import { rootId, type Graph, type LabConfig } from '../lab';
import { fromCatalog } from './catalog';
import { defineLab, layout } from './kit';

/**
 * 플레이그라운드 · 0~9단원 실습에서 범용적인 서비스와 노드를 모아 자유롭게 구성한다.
 * 시작·도착이 없고, 연결된 노드를 모두 실행한다. 입력 소스가 단원의 "시작"이 보내던 자료를 대신한다.
 */
export const playgroundId = 'playground';

/** 서비스별로 열어 둘 노드. MLOps 라이프사이클 순서(입력 → 코드·데이터 → 학습 → 등록·서빙 → 운영)를 따른다. */
export const playgroundTools = {
  sources: [
    'rawData',
    'trainJob',
    'textInput',
    'requestStream',
    'clickLog',
    'featureQuery',
    'workspace',
    'opsLog',
  ],
  github: ['repo', 'file'],
  storage: ['readObjects', 'saveModel', 'index', 'search'],
  ec2: [
    'restore',
    'validateData',
    'partition',
    'prepareBatch',
    'split',
    'train',
    'merge',
    'trackExperiment',
    'evaluate',
    'embed',
  ],
  featureStore: ['defineFeature', 'lookupFeature'],
  registry: ['registerModel'],
  gateway: ['deployModel', 'routeTraffic', 'infer', 'api'],
  monitoring: ['observeResponses', 'collectMetrics', 'trigger', 'diagnose'],
} satisfies Record<string, string[]>;

const services = Object.keys(playgroundTools);
const kinds = ['root', ...services, ...Object.values(playgroundTools).flat()];

const common = fromCatalog({ kinds, tools: playgroundTools, custom: {} });

// 서비스 영역의 격자 배치. 새 노드는 2열 격자로 놓이므로 노드 수에 맞춰 높이를 잡는다.
const WIDTH = 520;
const cell = (service: keyof typeof playgroundTools) =>
  52 + Math.ceil(playgroundTools[service].length / 2) * 150 + 24;
const placement: Record<string, [number, number]> = {
  sources: [0, 0],
  featureStore: [0, cell('sources') + 40],
  github: [560, 0],
  storage: [560, cell('github') + 40],
  registry: [560, cell('github') + cell('storage') + 80],
  ec2: [1120, 0],
  gateway: [1680, 0],
  monitoring: [1680, cell('gateway') + 40],
};

function initial(lab: LabConfig): Graph {
  const { system } = layout(lab);
  return {
    entities: [
      system('root', rootId, '', { x: 0, y: 0 }, 0, 0),
      ...services.map((kind) => {
        const [x, y] = placement[kind];
        return system(
          kind,
          kind,
          rootId,
          { x, y },
          WIDTH,
          cell(kind as keyof typeof playgroundTools),
        );
      }),
    ],
    connections: [],
  };
}

export const playgroundLab: LabConfig = defineLab({
  ...common,
  toolPosition: (index) => ({ x: 24 + (index % 2) * 240, y: 52 + Math.floor(index / 2) * 150 }),
  // 학습 실행·결합의 입출력 타입은 병렬화 방식에 맞춰 직접 바꿀 수 있게 연다.
  managedPorts: { ...common.managedPorts, train: ['job'], merge: ['checkpoint'] },
  id: playgroundId,
  storageKey: 'blockml:system-lab:playground:v1',
  fixedKinds: ['root'],
  initial: () => initial(playgroundLab),
  starterTasks: [],
  requiredNodeIds: new Set(),
  freeform: true,
  observationLabels: {
    'data-invalid': '데이터 검증이 차단한 실행',
    'stage-blocked': 'Production이 아닌 모델의 배포가 차단된 실행',
    'retrain-triggered': '품질 저하가 재학습 신호를 낸 실행',
    'split-leak': '평가에 학습용 표본이 들어와 차단된 실행',
    'low-quality': '정확도 미달로 평가 승인이 막힌 실행',
    'approval-missing': '평가 승인 없이 반영을 시도해 차단된 실행',
    'space-mismatch': '임베딩 공간이 달라 검색이 차단된 실행',
    'single-oom': '한 장치에 작업 전체를 맡겨 OOM이 난 실행',
    'data-oom': '데이터 병렬 뒤에도 OOM이 남는 실행',
    oom: '분할 뒤에도 OOM이 남는 실행',
    'quality-drop': '품질 지표를 수집한 실행',
    'cache-miss': '캐시에 없어 checkout이 실패한 실행',
  },
});
