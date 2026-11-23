import type { Strategy } from '../../engine';
import {
  findPort,
  type Graph,
  type Kind,
  type LabConfig,
  type PortSpec,
  type SettingSpec,
  type SettingValue,
} from '../../lab';
import { choice, datum, josa, need, port, setting } from '../kit';
import { dataKinds } from './data';
import { featureKinds } from './features';
import { mlopsKinds } from './mlops';
import { operationKinds } from './operations';
import { servingKinds } from './serving';

/**
 * 모든 실습이 함께 쓰는 서비스와 작업 노드.
 * 노드가 하는 일은 설정으로 구분하고, 실습은 필요한 종류만 골라 열어 쓴다.
 * 시작과 도착은 실습마다 다르므로 각 실습이 정의한다.
 */
export interface CatalogKind {
  label: string;
  /** 서비스 영역인지. 서비스는 켜고 끌 수 있고 작업 노드를 담는다. */
  service?: boolean;
  /** 작업 노드가 처음 갖는 포트. */
  ports?: PortSpec[];
  /** 포트가 상황에 따라 바뀌는 노드가 가질 수 있는 타입. */
  extra?: { in?: string[]; out?: string[] };
  settings?: SettingSpec[];
  run?: Strategy;
}

export const materials: Record<string, string> = {
  'task-result': '작업 결과',
  workdata: '작업 데이터',
  code: '코드·포인터',
  file: '파일',
  restored: '복원 결과',
  job: '학습 작업',
  gradient: '기울기',
  activation: '중간 활성값',
  partial: '부분 결과',
  checkpoint: '체크포인트',
  text: '텍스트',
  vector: '벡터',
  index: '색인',
  evidence: '근거',
  answer: '답변',
  objects: '객체 목록',
  dataset: '데이터 표본',
  'saved-model': '저장된 모델',
  'click-events': '클릭 이력',
  'feature-definition': '피처 정의',
  'feature-query': '조회 요청',
  'feature-value': '피처 값',
  request: '사용자 요청',
  'deployed-model': '사용할 모델',
  'traffic-plan': '요청 분배 내역',
  prediction: '모델 결과',
  'serving-report': '운영 보고',
  'service-metrics': '서비스 지표',
  labels: '정답 표본',
  'quality-signal': '품질 조사 자료',
  approval: '평가 승인',
  'registered-model': '등록된 모델',
};

export const GPU_MEMORY = 16;
type Mode = 'data' | 'model' | 'tensor';
const outMaterial: Record<Mode, string> = {
  data: 'gradient',
  model: 'activation',
  tensor: 'partial',
};
export const exchanged: Record<Mode, string> = {
  data: '기울기',
  model: '중간 활성값',
  tensor: '부분 행렬 결과',
};
const parallelMode = (graph: Graph, parent: string): Mode | undefined => {
  const value = graph.entities.find((e) => e.kind === 'split' && e.parent === parent)?.settings
    ?.strategy;
  return value === 'data' || value === 'model' || value === 'tensor' ? value : undefined;
};

const storageType = (graph: Graph, parent: string) =>
  graph.entities.find((e) => e.id === parent)?.settings?.type;

const run: Record<string, Strategy> = {
  repo: (ctx) => {
    const version = String(setting(ctx.node, 'commit'));
    ctx.emit(
      datum('code', '코드·포인터 ' + version, { version, pointer: 'dataset.dvc@' + version }),
    );
    return '커밋 ' + version + '의 코드와 데이터 포인터를 내보냈습니다.';
  },
  file: (ctx) => {
    const version = String(setting(ctx.node, 'version'));
    ctx.emit(
      datum('file', '데이터 파일 ' + version, { version, size: version === 'v1' ? 10 : 12 }),
    );
    return '데이터 ' + version + ' 파일을 내보냈습니다.';
  },
  restore: (ctx) => {
    const code = need(ctx, 'code');
    const work = need(ctx, 'workdata');
    const operation = String(setting(ctx.node, 'operation'));
    const cached = setting(ctx.node, 'cache') === 'present';
    const target = String(code.data.version);
    let dataVersion = String(work.data.version);
    let source = 'workspace';
    if (operation !== 'git') {
      if (cached) {
        source = 'cache';
        dataVersion = target;
      } else if (operation === 'checkout') {
        ctx.observe('cache-miss');
        throw new Error(
          '로컬 캐시에 ' +
            target +
            ' 데이터가 없어 checkout만으로 복원할 수 없습니다. dvc pull로 원격 파일을 가져오세요.',
        );
      } else {
        const files = ctx.inputs.flatMap((a) =>
          a.type === 'data' && a.material === 'file' ? [a] : [],
        );
        if (!files.length)
          throw new Error('dvc pull에는 파일 입력이 필요합니다. 저장소의 파일을 연결하세요.');
        if (files[0].data.version !== target)
          throw new Error(
            '가져온 파일은 ' +
              files[0].data.version +
              '인데 포인터는 ' +
              target +
              '을 가리킵니다. 파일 노드의 데이터 버전을 ' +
              target +
              '으로 맞추세요.',
          );
        source = 'remote';
        dataVersion = target;
      }
    }
    ctx.emit(
      datum('restored', '코드 ' + target + ' · 데이터 ' + dataVersion, {
        codeVersion: target,
        dataVersion,
        source,
      }),
    );
    return source === 'workspace'
      ? 'Git만 이동했습니다. 작업 데이터는 ' + dataVersion + ' 그대로입니다.'
      : source === 'cache'
        ? '로컬 캐시에서 ' +
          josa('데이터 ' + dataVersion, '을/를') +
          ' 복원했습니다. 원격 읽기는 없습니다.'
        : '원격에서 ' + josa('데이터 ' + dataVersion, '을/를') + ' 가져와 복원했습니다.';
  },
  split: (ctx) => {
    const job = need(ctx, 'job');
    const mode = String(setting(ctx.node, 'strategy')) as Mode;
    const gib = Number(job.data.gib) / (mode === 'data' ? 1 : 2);
    const samples = Number(job.data.samples) / 2;
    const text: Record<Mode, [string, string]> = {
      data: ['표본 절반 + 전체 모델 복제', '나머지 표본 + 전체 모델 복제'],
      model: ['레이어 그룹 A', '레이어 그룹 B'],
      tensor: ['행렬의 왼쪽 조각', '행렬의 오른쪽 조각'],
    };
    (['a', 'b'] as const).forEach((part, i) =>
      ctx.emit(datum('job', text[mode][i], { part, mode, gib, samples }), 'out-' + part),
    );
    return josa(exchanged[mode], '을/를') + ' 주고받는 구성으로 작업을 둘로 나눴습니다.';
  },
  train: (ctx) => {
    const job = need(ctx, 'job');
    const gib = Number(job.data.gib);
    const part = job.data.part as string | undefined;
    const mode = job.data.mode as Mode | undefined;
    if (gib > GPU_MEMORY) {
      ctx.observe(!part ? 'single-oom' : mode === 'data' ? 'data-oom' : 'oom');
      throw new Error(
        'OOM: 한 장에 ' +
          gib +
          'GiB가 필요하지만 ' +
          GPU_MEMORY +
          'GiB뿐입니다.' +
          (!part
            ? ' 작업 전체가 한 워커에 들어왔습니다.'
            : mode === 'data'
              ? ' 데이터 병렬은 모델을 장치마다 복제하므로 장치당 메모리가 줄지 않습니다.'
              : ''),
      );
    }
    const activation = ctx.byPort['in-act'] ?? [];
    let stage = 'only';
    if (mode === 'model') {
      stage = activation.length ? 'late' : 'early';
      const upstream = activation[0];
      if (activation.length > 1) throw new Error('활성값 입력은 하나만 연결하세요.');
      if (upstream && upstream.type === 'data' && upstream.data.part === part)
        throw new Error('활성값은 레이어 그룹이 다른 워커에게서 받아야 합니다.');
    }
    const out = ctx.node.ports.find((p) => p.id === 'out-result')?.material ?? 'checkpoint';
    ctx.emit(
      datum(
        out,
        mode ? exchanged[mode] + (stage === 'late' ? ' · 최종 출력' : '') : '갱신된 체크포인트',
        {
          ...job.data,
          part,
          worker: ctx.node.id,
          stage,
          mode: mode ?? 'single',
          perDeviceGiB: gib,
          vram: GPU_MEMORY,
          cost: 0,
        },
      ),
    );
    return (
      '장치당 ' +
      gib +
      ' / ' +
      GPU_MEMORY +
      'GiB' +
      (mode ? ' · ' + josa(exchanged[mode], '을/를') + ' 계산' : '')
    );
  },
  merge: (ctx) => {
    const a = (ctx.byPort['in-a'] ?? []).flatMap((v) => (v.type === 'data' ? [v] : []));
    const b = (ctx.byPort['in-b'] ?? []).flatMap((v) => (v.type === 'data' ? [v] : []));
    const mode = (b[0]?.data.mode ?? a[0]?.data.mode ?? 'data') as Mode;
    if (b.length !== 1 || (mode !== 'model' && a.length !== 1))
      throw new Error(
        mode === 'model'
          ? '활성값을 받아 마지막 레이어를 계산한 워커의 결과를 결합 입력 2에 연결하세요.'
          : '두 워커의 ' + josa(exchanged[mode], '을/를') + ' 각각 결합 입력에 연결하세요.',
      );
    if (mode === 'model') {
      if (b[0].data.stage !== 'late')
        throw new Error(
          '마지막 레이어를 맡은 워커의 결과가 필요합니다. 앞 워커의 활성값을 뒤 워커에 전달하세요.',
        );
    } else if (a[0].data.worker === b[0].data.worker || a[0].data.part === b[0].data.part)
      throw new Error('서로 다른 두 워커가 서로 다른 작업 조각을 계산해야 합니다.');
    const cost = Number(setting(ctx.node, 'communication')) * (mode === 'tensor' ? 2 : 1);
    ctx.emit(
      datum('checkpoint', '갱신된 체크포인트', {
        mode,
        perDeviceGiB: b[0].data.perDeviceGiB,
        vram: GPU_MEMORY,
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
  embed: (ctx) => {
    const text = need(ctx, 'text').data;
    const space = String(setting(ctx.node, 'space'));
    const chunk = String(setting(ctx.node, 'chunk'));
    const documents = (text.documents as unknown[] | undefined) ?? [];
    const chunks = text.kind === 'document' ? documents.length * (chunk === 'sentence' ? 2 : 1) : 1;
    ctx.emit(
      datum(
        'vector',
        '공간 ' +
          space +
          ' · ' +
          (text.kind === 'document' ? '문서' : '질문') +
          ' 벡터 ' +
          chunks +
          '개',
        { space, chunks, kind: text.kind, documents, text: text.text },
      ),
    );
    return (
      (text.kind === 'document'
        ? '문서를 ' + (chunk === 'sentence' ? '문장' : '문단') + ' 단위로 나눠 '
        : '질문을 ') +
      '공간 ' +
      space +
      '의 벡터 ' +
      chunks +
      '개로 바꿨습니다.'
    );
  },
  index: (ctx) => {
    const vector = need(ctx, 'vector').data;
    if (storageType(ctx.graph, ctx.node.parent) !== 'vector')
      throw new Error(
        '객체 저장소에는 벡터를 색인할 수 없습니다. 저장소 유형을 Vector DB로 바꾸세요.',
      );
    if (vector.kind !== 'document')
      throw new Error('색인에는 문서 벡터를 연결하세요. 질문 벡터가 연결되어 있습니다.');
    ctx.emit(
      datum('index', '공간 ' + vector.space + ' 색인 · 벡터 ' + vector.chunks + '개', {
        ...vector,
      }),
    );
    return '문서 벡터 ' + vector.chunks + '개를 색인에 저장했습니다.';
  },
  search: (ctx) => {
    const index = need(ctx, 'index', '색인').data;
    const query = need(ctx, 'vector', '질문 벡터').data;
    if (storageType(ctx.graph, ctx.node.parent) !== 'vector')
      throw new Error(
        '객체 저장소에서는 벡터 검색을 할 수 없습니다. 저장소 유형을 Vector DB로 바꾸세요.',
      );
    if (query.kind !== 'question')
      throw new Error('검색에는 질문 벡터를 연결하세요. 문서 벡터가 연결되어 있습니다.');
    if (index.space !== query.space) {
      ctx.observe('space-mismatch');
      throw new Error(
        '질문은 공간 ' +
          query.space +
          '이고 색인은 공간 ' +
          index.space +
          '입니다. 서로 다른 공간의 벡터는 거리를 비교할 수 없어 검색을 차단했습니다.',
      );
    }
    const documents = index.documents as { id: string; text: string }[];
    const best = documents.find((doc) => doc.id === 'doc-return') ?? documents[0];
    ctx.emit(datum('evidence', '근거 ' + best.id, { ids: [best.id], text: best.text }));
    return '같은 공간에서 가장 가까운 문서 ' + josa(best.id, '을/를') + ' 찾았습니다.';
  },
  api: (ctx) => {
    const evidence = need(ctx, 'evidence', '근거').data;
    const question = need(ctx, 'text', '질문').data;
    const ids = evidence.ids as string[];
    ctx.emit(
      datum('answer', josa('근거 ' + ids.join(', '), '이/가') + ' 붙은 답변', {
        ids,
        text: String(evidence.text) + ' [' + ids.join(', ') + ']',
        question: question.text,
      }),
    );
    return (
      '질문과 ' +
      josa('근거 ' + ids.join(', '), '으로/로') +
      ' 프롬프트를 만들어 답변했습니다. (고정 응답, 실제 LLM 호출 없음)'
    );
  },
};

export const catalog: Record<string, CatalogKind> = {
  ...dataKinds,
  ...featureKinds,
  ...operationKinds,
  ...servingKinds,
  ...mlopsKinds,
  root: { label: '전체 서비스' },
  ec2: { label: 'EC2', service: true },
  storage: {
    label: '저장소',
    service: true,
    settings: [
      choice(
        'type',
        '저장소 유형',
        'object',
        [
          ['object', '객체 저장소 (S3)'],
          ['vector', 'Vector DB'],
        ],
        '유형에 따라 쓸 수 있는 노드가 달라집니다. 색인과 검색은 Vector DB에서만 동작합니다.',
      ),
    ],
  },
  github: { label: 'GitHub', service: true },
  gateway: { label: 'Gateway', service: true },
  repo: {
    label: '코드 저장소',
    ports: [port('out', 'code', 'code')],
    settings: [
      choice(
        'commit',
        '커밋',
        'v2',
        [
          ['v1', '커밋 v1'],
          ['v2', '커밋 v2 (최신)'],
        ],
        '선택한 커밋의 코드와 데이터 포인터를 내보냅니다.',
      ),
    ],
    run: run.repo,
  },
  file: {
    label: '파일',
    ports: [port('out', 'file', 'file')],
    settings: [
      choice(
        'version',
        '데이터 버전',
        'v2',
        [
          ['v1', '데이터 v1 (10GB)'],
          ['v2', '데이터 v2 (12GB)'],
        ],
        '이 파일이 담고 있는 데이터의 버전입니다. 필요한 버전의 파일을 내보내도록 맞추세요.',
      ),
    ],
    run: run.file,
  },
  restore: {
    label: '복원·검증',
    ports: [
      port('in', 'code', 'code'),
      port('in', 'workdata', 'workdata'),
      port('in', 'file', 'file'),
      port('out', 'restored', 'restored'),
    ],
    settings: [
      choice(
        'operation',
        '복원 작업',
        'git',
        [
          ['git', 'Git 이동만'],
          ['checkout', 'dvc checkout'],
          ['pull', 'dvc pull 후 복원'],
        ],
        'Git은 코드와 포인터만 바꿉니다. 데이터는 checkout이나 pull이 복원합니다.',
      ),
      choice(
        'cache',
        '로컬 캐시의 데이터',
        'missing',
        [
          ['present', '캐시에 있음'],
          ['missing', '캐시에 없음'],
        ],
        '캐시에 있으면 원격에서 다시 받지 않습니다.',
      ),
    ],
    run: run.restore,
  },
  train: {
    label: '학습 실행',
    ports: [port('in', 'job', 'job'), port('out', 'result', 'checkpoint')],
    extra: { in: ['activation'], out: ['gradient', 'activation', 'partial'] },
    run: run.train,
  },
  split: {
    label: '분할',
    ports: [port('in', 'job', 'job'), port('out', 'a', 'job'), port('out', 'b', 'job')],
    settings: [
      choice(
        'strategy',
        '분할 방식',
        'data',
        [
          ['data', '데이터 병렬'],
          ['model', '모델 병렬 · 레이어 분할'],
          ['tensor', '텐서 병렬'],
        ],
        '방식에 따라 워커가 주고받는 자료 타입이 바뀌고, 맞지 않는 연결은 지워집니다.',
      ),
    ],
    run: run.split,
  },
  merge: {
    label: '결합',
    ports: [
      port('in', 'a', 'gradient'),
      port('in', 'b', 'gradient'),
      port('out', 'checkpoint', 'checkpoint'),
    ],
    extra: { in: ['activation', 'partial'] },
    settings: [
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
    run: run.merge,
  },
  embed: {
    label: '임베딩',
    ports: [port('in', 'text', 'text'), port('out', 'vector', 'vector')],
    settings: [
      choice(
        'space',
        '임베딩 공간',
        'B',
        [
          ['A', '모델 A 공간'],
          ['B', '모델 B 공간'],
        ],
        '색인과 질문은 같은 공간의 벡터여야 거리를 비교할 수 있습니다.',
      ),
      choice(
        'chunk',
        '청킹 단위',
        'paragraph',
        [
          ['paragraph', '문단'],
          ['sentence', '문장'],
        ],
        '문서를 나누는 단위입니다. 단위가 작을수록 벡터 수가 늘어납니다.',
      ),
    ],
    run: run.embed,
  },
  index: {
    label: '색인',
    ports: [port('in', 'vector', 'vector'), port('out', 'index', 'index')],
    run: run.index,
  },
  search: {
    label: '검색',
    ports: [
      port('in', 'index', 'index'),
      port('in', 'query', 'vector', false, '질문 벡터'),
      port('out', 'evidence', 'evidence'),
    ],
    run: run.search,
  },
  api: {
    label: 'API 요청 처리',
    ports: [
      port('in', 'question', 'text', false, '질문'),
      port('in', 'evidence', 'evidence'),
      port('out', 'answer', 'answer'),
    ],
    run: run.api,
  },
};

type Pick = {
  /** 이 실습에서 쓰는 공통 종류. */
  kinds: string[];
  /** 이 실습에서만 쓰는 종류(시작과 도착). */
  custom: Record<string, CatalogKind>;
  /** 서비스별로 열어 둘 작업 노드. */
  tools: Record<string, string[]>;
  /** 공통 설정의 초기값을 이 실습에 맞게 바꾼다. 예: { embed: { space: 'A' } } */
  defaults?: Record<string, Record<string, SettingValue>>;
  /** 이번 실습에서 쓰지 않는 포트 ID. */
  omitPorts?: Record<string, readonly string[]>;
  /** 저장소 유형에 Vector DB를 보일지. 기본은 색인·검색 노드를 쓸 때만 보인다. */
  vectorDb?: boolean;
};
/** 선택한 종류에서 LabConfig의 공통 부분을 만든다. */
export function fromCatalog(pick: Pick) {
  const all: Record<string, CatalogKind> = {
    ...Object.fromEntries(pick.kinds.map((k) => [k, catalog[k]])),
    ...pick.custom,
  };
  const labels: Record<Kind, string> = {};
  const portTypes: LabConfig['portTypes'] = {};
  const managedPorts: Record<Kind, string[]> = {};
  const settingSpecs: Record<Kind, SettingSpec[]> = {};
  const strategies: Record<Kind, Strategy> = {};
  const defaults: Record<Kind, PortSpec[]> = {};
  // Vector DB 유형은 색인·검색을 쓰는 실습에서만 보여 준다.
  const usesVectorSearch = pick.vectorDb ?? pick.kinds.some((k) => k === 'index' || k === 'search');
  for (const [kind, def] of Object.entries(all)) {
    labels[kind] = def.label;
    const ports = def.ports?.filter((port) => !pick.omitPorts?.[kind]?.includes(port.id));
    const ins = [
      ...new Set([
        ...(ports ?? []).filter((p) => p.direction === 'in').map((p) => p.material),
        ...(def.extra?.in ?? []),
      ]),
    ];
    const outs = [
      ...new Set([
        ...(ports ?? []).filter((p) => p.direction === 'out').map((p) => p.material),
        ...(def.extra?.out ?? []),
      ]),
    ];
    portTypes[kind] = { in: ins, out: outs };
    managedPorts[kind] = [...ins, ...outs];
    if (ports) defaults[kind] = ports;
    if (def.settings)
      settingSpecs[kind] = def.settings.map((spec) => {
        const initial = pick.defaults?.[kind]?.[spec.key];
        const base =
          kind === 'storage' && spec.key === 'type' && !usesVectorSearch
            ? { ...spec, options: spec.options?.filter((option) => option.value !== 'vector') }
            : spec;
        return initial === undefined ? base : { ...base, initial };
      });
    if (def.run) strategies[kind] = def.run;
  }
  const services = Object.entries(all)
    .filter(([, def]) => def.service || def === all.root)
    .map(([kind]) => kind);
  const serviceKinds = services.filter((kind) => kind !== 'root');
  return {
    labels,
    materials,
    portTypes,
    managedPorts,
    settingSpecs,
    strategies,
    tools: Object.fromEntries([
      ...services.map((kind) => [kind, kind === 'root' ? serviceKinds : (pick.tools[kind] ?? [])]),
    ]) as Record<Kind, readonly Kind[]>,
    resourceDefaults: (kind: Kind) => (defaults[kind] ? { ports: defaults[kind] } : {}),
  };
}

/** 분할 방식에 따라 학습 실행·결합의 포트 타입을 맞추고, 타입이 어긋난 연결을 지운다. */
export function syncParallelPorts(graph: Graph): Graph {
  const entities = graph.entities.map((entity) => {
    if (entity.type !== 'resource' || (entity.kind !== 'train' && entity.kind !== 'merge'))
      return entity;
    const mode = parallelMode(graph, entity.parent);
    const material = mode ? outMaterial[mode] : undefined;
    const ports =
      entity.kind === 'train'
        ? [
            port('in', 'job', 'job'),
            ...(mode === 'model' ? [port('in', 'act', 'activation')] : []),
            port('out', 'result', material ?? 'checkpoint'),
          ]
        : [
            port('in', 'a', material ?? 'gradient'),
            port('in', 'b', material ?? 'gradient'),
            port('out', 'checkpoint', 'checkpoint'),
          ];
    return JSON.stringify(ports) === JSON.stringify(entity.ports) ? entity : { ...entity, ports };
  });
  const next = { ...graph, entities };
  const connections = next.connections.filter((edge) => {
    const from = findPort(next, edge.from);
    const to = findPort(next, edge.to);
    return !!from && !!to && from.material === to.material;
  });
  return connections.length === graph.connections.length &&
    entities.every((e, i) => e === graph.entities[i])
    ? graph
    : { ...next, connections };
}
