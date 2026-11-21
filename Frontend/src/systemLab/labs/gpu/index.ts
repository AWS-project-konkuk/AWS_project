import type { Strategy } from '../../engine';
import { findPort, rootId, type Graph, type LabConfig, type SettingValue } from '../../lab';
import { datum, defineLab, layout, need, port, setting, wired } from '../kit';

/** 4단원 종합 · GPU 두 장 학습. 병렬 전략은 GPU 학습 서비스의 설정이다. */
export const gpuLessonId = 'week1-workflow';

type Mode = 'data' | 'model' | 'tensor';
const outMaterial: Record<Mode, string> = {
  data: 'gradient',
  model: 'activation',
  tensor: 'partial',
};
const exchanged: Record<Mode, string> = {
  data: '기울기',
  model: '중간 활성값',
  tensor: '부분 행렬 결과',
};
const modeOf = (graph: Graph, parent: string): Mode => {
  const value = graph.entities.find((e) => e.id === parent)?.settings?.strategy;
  return value === 'model' || value === 'tensor' ? value : 'data';
};

const strategies: Record<string, Strategy> = {
  start: ({ emit }) => {
    emit(datum('batch', '학습 배치 64개', { samples: 64 }), 'out-batch');
    emit(datum('model', '모델 상태 24GiB', { gib: 24 }), 'out-model');
    return '학습 배치 64개와 모델 학습 상태 24GiB를 보냈습니다.';
  },
  split: (ctx) => {
    const batch = need(ctx, 'batch');
    const model = need(ctx, 'model');
    const mode = modeOf(ctx.graph, ctx.node.parent);
    const gib = Number(model.data.gib);
    const text: Record<Mode, [string, string]> = {
      data: ['표본 0~31 + 전체 모델 복제', '표본 32~63 + 전체 모델 복제'],
      model: ['앞 레이어 그룹', '뒤 레이어 그룹'],
      tensor: ['행렬의 왼쪽 조각', '행렬의 오른쪽 조각'],
    };
    (['a', 'b'] as const).forEach((part, i) =>
      ctx.emit(
        datum('task', text[mode][i], { part, mode, gib, samples: batch.data.samples }),
        'out-' + part,
      ),
    );
    return exchanged[mode] + '을 주고받는 구성으로 작업을 둘로 나눴습니다.';
  },
  worker: (ctx) => {
    const task = need(ctx, 'task', '작업 조각');
    const mode = modeOf(ctx.graph, ctx.node.parent);
    const gib = Number(task.data.gib);
    const per = mode === 'data' ? gib : gib / 2;
    const vram = Number(setting(ctx.node, 'vram'));
    if (per > vram) {
      ctx.observe(mode === 'data' ? 'data-oom' : 'oom');
      throw new Error(
        'OOM: 한 장에 ' +
          per +
          'GiB가 필요하지만 ' +
          vram +
          'GiB뿐입니다.' +
          (mode === 'data'
            ? ' 데이터 병렬은 모델을 장치마다 복제하므로 장치당 메모리가 줄지 않습니다.'
            : ''),
      );
    }
    const part = String(task.data.part);
    const activation = ctx.byPort['in-act'] ?? [];
    let stage = 'only';
    if (mode === 'model') {
      stage = activation.length ? 'late' : 'early';
      if (activation.length > 1) throw new Error('활성값 입력은 하나만 연결하세요.');
      const upstream = activation[0];
      if (upstream && upstream.type === 'data' && upstream.data.part === part)
        throw new Error('앞 레이어를 맡은 다른 워커의 활성값을 받아야 합니다.');
    } else if (activation.length) {
      throw new Error('이 전략에서는 중간 활성값 입력을 쓰지 않습니다.');
    }
    ctx.emit(
      datum(outMaterial[mode], exchanged[mode] + (stage === 'late' ? ' · 최종 출력' : ''), {
        part,
        worker: ctx.node.id,
        stage,
        mode,
        perDeviceGiB: per,
        vram,
      }),
    );
    return (
      '장치당 ' +
      per +
      ' / ' +
      vram +
      'GiB · ' +
      exchanged[mode] +
      (stage === 'early' ? '을 뒤 워커로 전달' : '을 계산')
    );
  },
  merge: (ctx) => {
    const mode = modeOf(ctx.graph, ctx.node.parent);
    const material = outMaterial[mode];
    const a = (ctx.byPort['in-a'] ?? []).flatMap((v) => (v.type === 'data' ? [v] : []));
    const b = (ctx.byPort['in-b'] ?? []).flatMap((v) => (v.type === 'data' ? [v] : []));
    if (b.length !== 1 || (mode !== 'model' && a.length !== 1))
      throw new Error(
        mode === 'model'
          ? '뒤 레이어 워커의 결과를 결합 입력 2에 연결하세요.'
          : '두 워커의 ' + exchanged[mode] + '을 각각 결합 입력에 연결하세요.',
      );
    if (mode === 'model') {
      if (b[0].data.stage !== 'late')
        throw new Error(
          '마지막 레이어를 맡은 워커의 결과가 필요합니다. 앞 워커의 활성값을 뒤 워커에 전달하세요.',
        );
    } else if (a[0].data.worker === b[0].data.worker || a[0].data.part === b[0].data.part)
      throw new Error('서로 다른 두 워커가 서로 다른 작업 조각을 계산해야 합니다.');
    const communication = Number(
      setting(
        ctx.graph.entities.find((e) => e.id === ctx.node.parent),
        'communication',
      ),
    );
    const cost = communication * (mode === 'tensor' ? 2 : 1);
    ctx.emit(
      datum('checkpoint', '갱신된 체크포인트', {
        mode,
        material,
        perDeviceGiB: b[0].data.perDeviceGiB,
        vram: b[0].data.vram,
        cost,
      }),
    );
    return (
      (mode === 'data'
        ? '평균 기울기로 같은 모델을 갱신'
        : mode === 'model'
          ? '레이어 간 전달을 마친 학습 상태'
          : '부분 결과를 합쳐 한 레이어 출력을 완성') +
      ' · 통신 ' +
      cost
    );
  },
  end: (ctx) => {
    const result = need(ctx, 'checkpoint', '체크포인트').data;
    const mode = result.mode as Mode;
    ctx.report([
      { label: '장치당 메모리', value: result.perDeviceGiB + ' / ' + result.vram + ' GiB' },
      { label: '주고받은 자료', value: exchanged[mode] },
      { label: '통신량', value: String(result.cost) },
    ]);
    if (mode !== 'data') ctx.observe('split-complete');
    return '두 워커가 ' + exchanged[mode] + '을 주고받아 체크포인트를 갱신했습니다.';
  },
};

const labels = {
  root: '전체 서비스',
  gpu: 'GPU 학습',
  start: '시작',
  end: '도착',
  split: '작업 분할',
  worker: 'GPU 워커',
  merge: '결과 결합',
};

function initial(lab: LabConfig): Graph {
  const { system, node } = layout(lab);
  return {
    entities: [
      system('root', rootId, '', { x: 0, y: 0 }, 0, 0),
      node('start', 'start', rootId, { x: 0, y: 150 }),
      system('gpu', 'gpu', rootId, { x: 300, y: 0 }, 720, 340),
      node('split', 'split', 'gpu', { x: 24, y: 120 }),
      node('worker', 'worker1', 'gpu', { x: 270, y: 50 }, { name: 'GPU 워커 1' }),
      node('worker', 'worker2', 'gpu', { x: 270, y: 200 }, { name: 'GPU 워커 2' }),
      node('merge', 'merge', 'gpu', { x: 510, y: 125 }),
      node('end', 'end', rootId, { x: 1080, y: 160 }),
    ],
    connections: [
      wired('start', 'batch', 'split', 'batch'),
      wired('start', 'model', 'split', 'model'),
      wired('split', 'a', 'worker1', 'task'),
      wired('split', 'b', 'worker2', 'task'),
      wired('merge', 'checkpoint', 'end', 'checkpoint'),
    ],
  };
}
/** 전략이 바뀌면 워커와 결합의 자료 타입을 맞추고, 타입이 어긋난 연결은 제거한다. */
function onSetting(graph: Graph, id: string, key: string, value: SettingValue): Graph {
  if (key !== 'strategy') return graph;
  const material = outMaterial[value as Mode] ?? outMaterial.data;
  const entities = graph.entities.map((entity) => {
    if (entity.parent !== id || entity.type !== 'resource') return entity;
    if (entity.kind === 'worker')
      return {
        ...entity,
        ports: entity.ports.map((p) => (p.id === 'out-result' ? { ...p, material } : p)),
      };
    if (entity.kind === 'merge')
      return {
        ...entity,
        ports: entity.ports.map((p) =>
          p.id === 'in-a' || p.id === 'in-b' ? { ...p, material } : p,
        ),
      };
    return entity;
  });
  const next = { ...graph, entities };
  return {
    ...next,
    connections: next.connections.filter((edge) => {
      const from = findPort(next, edge.from);
      const to = findPort(next, edge.to);
      return !!from && !!to && from.material === to.material;
    }),
  };
}

const allMaterials = ['gradient', 'activation', 'partial'];
export const gpuLab: LabConfig = defineLab({
  id: gpuLessonId,
  storageKey: 'blockml:system-lab:week1-workflow:v1',
  labels,
  materials: {
    batch: '학습 배치',
    model: '모델 상태',
    task: '작업 조각',
    gradient: '기울기',
    activation: '중간 활성값',
    partial: '부분 결과',
    checkpoint: '체크포인트',
  },
  tools: { root: ['gpu'], gpu: ['split', 'worker', 'merge'] },
  portTypes: {
    root: { in: [], out: [] },
    gpu: { in: [], out: [] },
    start: { in: [], out: ['batch', 'model'] },
    end: { in: ['checkpoint'], out: [] },
    split: { in: ['batch', 'model'], out: ['task'] },
    worker: { in: ['task', 'activation'], out: allMaterials },
    merge: { in: allMaterials, out: ['checkpoint'] },
  },
  runStateKinds: ['gpu', 'split', 'worker', 'merge'],
  managedPorts: {
    start: ['batch', 'model'],
    end: ['checkpoint'],
    split: ['batch', 'model', 'task'],
    worker: ['task', 'activation', ...allMaterials],
    merge: [...allMaterials, 'checkpoint'],
  },
  resourceDefaults: (kind) => {
    const ports = {
      start: [port('out', 'batch', 'batch'), port('out', 'model', 'model')],
      end: [port('in', 'checkpoint', 'checkpoint')],
      split: [
        port('in', 'batch', 'batch'),
        port('in', 'model', 'model'),
        port('out', 'a', 'task'),
        port('out', 'b', 'task'),
      ],
      worker: [
        port('in', 'task', 'task'),
        port('in', 'act', 'activation'),
        port('out', 'result', 'gradient'),
      ],
      merge: [
        port('in', 'a', 'gradient'),
        port('in', 'b', 'gradient'),
        port('out', 'checkpoint', 'checkpoint'),
      ],
    }[kind as 'start'];
    return ports ? { ports } : {};
  },
  settingSpecs: {
    gpu: [
      {
        key: 'strategy',
        label: '병렬 전략',
        type: 'choice',
        initial: 'data',
        options: [
          { value: 'data', label: '데이터 병렬' },
          { value: 'model', label: '모델 병렬 · 레이어 분할' },
          { value: 'tensor', label: '텐서 병렬' },
        ],
        help: '전략을 바꾸면 워커가 주고받는 자료 타입이 바뀌고, 맞지 않는 연결은 지워집니다.',
      },
      {
        key: 'communication',
        label: '장치 간 통신 비용',
        type: 'number',
        initial: 4,
        min: 0,
        max: 24,
        step: 1,
        help: '상대 시간이며 실제 성능 측정치가 아닙니다.',
      },
    ],
    worker: [
      {
        key: 'vram',
        label: 'GPU 메모리 (GiB)',
        type: 'number',
        initial: 16,
        min: 4,
        max: 48,
        step: 1,
        help: '이 장치 한 장의 용량입니다.',
      },
    ],
  },
  onSetting,
  initial() {
    return initial(gpuLab);
  },
  starterTasks: [
    wired('start', 'batch', 'split', 'batch'),
    wired('start', 'model', 'split', 'model'),
    wired('split', 'a', 'worker1', 'task'),
    wired('split', 'b', 'worker2', 'task'),
    wired('worker1', 'result', 'merge', 'a'),
    wired('worker2', 'result', 'merge', 'b'),
    wired('merge', 'checkpoint', 'end', 'checkpoint'),
  ],
  requiredNodeIds: new Set(['start', 'split', 'worker1', 'worker2', 'merge', 'end']),
  strategies,
  requiredObservations: ['data-oom', 'split-complete'],
  observationLabels: {
    'data-oom': '16GiB 장치 두 장에서 데이터 병렬의 OOM',
    'split-complete': '레이어 또는 텐서 분할로 두 워커를 모두 사용한 완료',
  },
});
