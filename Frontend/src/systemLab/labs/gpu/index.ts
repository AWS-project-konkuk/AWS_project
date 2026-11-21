import { rootId, type Graph, type LabConfig } from '../../lab';
import { exchanged, fromCatalog, syncParallelPorts } from '../catalog';
import { datum, defineLab, josa, layout, need, port, wired } from '../kit';

/** 4단원 종합 · GPU 두 장 학습. 학습 실행, 분할, 결합은 공통 EC2 노드이다. */
export const gpuLessonId = 'week1-workflow';

const common = fromCatalog({
  kinds: ['root', 'ec2', 'train', 'split', 'merge'],
  tools: { ec2: ['train', 'split', 'merge'] },
  custom: {
    start: {
      label: '시작',
      ports: [port('out', 'job', 'job')],
      run: ({ emit }) => {
        emit(datum('job', '학습 작업 · 배치 64개 + 모델 상태 24GiB', { gib: 24, samples: 64 }));
        return '학습 배치 64개와 모델 학습 상태 24GiB를 보냈습니다.';
      },
    },
    end: {
      label: '도착',
      ports: [port('in', 'checkpoint', 'checkpoint')],
      run: (ctx) => {
        const result = need(ctx, 'checkpoint', '체크포인트').data;
        const mode = String(result.mode);
        ctx.report([
          { label: '장치당 메모리', value: result.perDeviceGiB + ' / ' + result.vram + ' GiB' },
          {
            label: '주고받은 자료',
            value: mode in exchanged ? exchanged[mode as keyof typeof exchanged] : '없음',
          },
          { label: '통신량', value: String(result.cost) },
        ]);
        if (mode === 'model' || mode === 'tensor') ctx.observe('split-complete');
        return (
          '두 워커가 ' +
          josa(exchanged[mode as keyof typeof exchanged] ?? '결과', '을/를') +
          ' 주고받아 체크포인트를 갱신했습니다.'
        );
      },
    },
  },
});

function initial(lab: LabConfig): Graph {
  const { system, node } = layout(lab);
  return {
    entities: [
      system('root', rootId, '', { x: 0, y: 0 }, 0, 0),
      node('start', 'start', rootId, { x: 0, y: 120 }),
      system('ec2', 'ec2', rootId, { x: 300, y: 0 }, 640, 340),
      node('train', 'worker1', 'ec2', { x: 24, y: 60 }, { name: 'GPU 워커 1' }),
      node('end', 'end', rootId, { x: 1000, y: 120 }),
    ],
    connections: [],
  };
}

export const gpuLab: LabConfig = defineLab({
  ...common,
  labels: { ...common.labels, train: 'GPU 워커' },
  id: gpuLessonId,
  storageKey: 'blockml:system-lab:week1-workflow:v2',
  initial: () => initial(gpuLab),
  normalize: syncParallelPorts,
  // 서비스가 하나뿐이라 새 노드를 2열 격자로 놓아 연결선이 포트를 덮지 않게 한다.
  toolPosition: (index) => ({ x: 24 + (index % 2) * 240, y: 52 + Math.floor(index / 2) * 150 }),
  starterTasks: [
    wired('start', 'job', 'worker1', 'job'),
    wired('worker1', 'result', 'end', 'checkpoint'),
  ],
  requiredNodeIds: new Set(['start', 'worker1', 'end']),
  requiredObservations: ['single-oom', 'data-oom', 'split-complete'],
  observationLabels: {
    'single-oom': 'GPU 워커 하나에 작업 전체를 맡겼을 때의 OOM',
    'data-oom': '데이터 병렬로 나눈 뒤에도 남는 OOM',
    'split-complete': '레이어 또는 텐서 분할로 두 워커를 모두 사용한 완료',
  },
});
