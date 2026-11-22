import { rootId, type Graph, type LabConfig } from '../lab';
import { fromCatalog } from './catalog';
import { mergedKind, syncVariantPorts, type MergedSpec } from './catalog/merged';
import { operationKinds } from './catalog/operations';
import { defineLab, keepNewestModel, layout, received } from './kit';

/**
 * 플레이그라운드 · 0~9단원 실습에서 범용적인 서비스와 노드를 모아 자유롭게 구성한다.
 * 시작·도착이 없고, 연결된 노드를 모두 실행한다. 입력 소스가 단원의 "시작"이 보내던 자료를 대신한다.
 */
export const playgroundId = 'playground';

/**
 * 포트를 직접 조절할 수 있으므로, 포트 구성만 다른 노드는 하나로 합쳤다.
 * 합친 노드는 설정에서 "무엇을 하는지"를 고르며, 실행은 원래 노드의 로직을 그대로 쓴다.
 */
export const mergedSpecs: Record<string, MergedSpec> = {
  input: {
    label: '데이터 입력',
    key: 'source',
    settingLabel: '내보낼 자료',
    help: '단원 실습의 "시작"이 보내던 자료를 고릅니다. 고르면 출력 포트가 그 자료에 맞게 바뀝니다.',
    variants: [
      { id: 'raw', label: '원본 목록 (표본 100개)', from: 'rawData' },
      { id: 'job-8', label: '학습 작업 · 8GiB', from: 'trainJob', settings: { gib: 8 } },
      {
        id: 'job-24',
        label: '학습 작업 · 24GiB (GPU 1장 초과)',
        from: 'trainJob',
        settings: { gib: 24 },
      },
      { id: 'doc', label: '원본 문서', from: 'textInput', settings: { role: 'document' } },
      { id: 'question', label: '사용자 질문', from: 'textInput', settings: { role: 'question' } },
      { id: 'req-10', label: '사용자 요청 10건', from: 'requestStream', settings: { count: '10' } },
      {
        id: 'req-100',
        label: '사용자 요청 100건',
        from: 'requestStream',
        settings: { count: '100' },
      },
      { id: 'clicks', label: '고객 클릭 이력', from: 'clickLog' },
      {
        id: 'fq-train',
        label: '피처 조회 요청 · 학습 (10:00)',
        from: 'featureQuery',
        settings: { role: 'train' },
      },
      {
        id: 'fq-serve',
        label: '피처 조회 요청 · 추론 (11:15)',
        from: 'featureQuery',
        settings: { role: 'serve' },
      },
      { id: 'work-v1', label: '작업 데이터 v1', from: 'workspace', settings: { version: 'v1' } },
      { id: 'work-v2', label: '작업 데이터 v2', from: 'workspace', settings: { version: 'v2' } },
      {
        id: 'ops-low',
        label: '운영 로그 · 품질 저하 (갱신 지연 120분)',
        from: 'opsLog',
        settings: { lag: '120', quality: 'low' },
      },
      {
        id: 'ops-good',
        label: '운영 로그 · 정상 (갱신 지연 15분)',
        from: 'opsLog',
        settings: { lag: '15', quality: 'good' },
      },
    ],
  },
  versioned: {
    label: '버전 관리 항목',
    key: 'item',
    settingLabel: '항목',
    help: '코드 저장소의 커밋(코드·데이터 포인터)이나 저장소에 있는 데이터 파일의 버전을 고릅니다.',
    variants: [
      { id: 'repo-v2', label: '코드 · 커밋 v2 (최신)', from: 'repo', settings: { commit: 'v2' } },
      { id: 'repo-v1', label: '코드 · 커밋 v1', from: 'repo', settings: { commit: 'v1' } },
      {
        id: 'file-v2',
        label: '파일 · 데이터 v2 (12GB)',
        from: 'file',
        settings: { version: 'v2' },
      },
      {
        id: 'file-v1',
        label: '파일 · 데이터 v1 (10GB)',
        from: 'file',
        settings: { version: 'v1' },
      },
    ],
  },
  storageOp: {
    label: '저장소 작업',
    key: 'operation',
    settingLabel: '작업',
    help: '저장소에서 하는 일을 고릅니다. 원본 읽기·모델 저장은 객체 저장소(S3), 색인·검색은 Vector DB 유형에서만 동작합니다.',
    variants: [
      { id: 'read', label: '원본 읽기', from: 'readObjects' },
      { id: 'save', label: '모델 저장', from: 'saveModel' },
      { id: 'index', label: '색인', from: 'index' },
      { id: 'search', label: '검색', from: 'search' },
    ],
  },
  feature: {
    label: '피처',
    key: 'operation',
    settingLabel: '작업',
    help: '공통 정의를 만들거나, 정의와 조회 요청으로 학습·추론에 쓸 피처 값을 계산합니다.',
    variants: [
      {
        id: 'define-24',
        label: '공통 피처 정의 · 최근 24시간',
        from: 'defineFeature',
        settings: { window: '24' },
      },
      {
        id: 'define-1',
        label: '공통 피처 정의 · 최근 1시간',
        from: 'defineFeature',
        settings: { window: '1' },
      },
      {
        id: 'lookup-now',
        label: '조회 · 현재 시각 기준',
        from: 'lookupFeature',
        settings: { asOf: 'now' },
      },
      {
        id: 'lookup-cutoff',
        label: '조회 · 학습 기준 시각',
        from: 'lookupFeature',
        settings: { asOf: 'cutoff' },
      },
    ],
  },
  publish: {
    label: '모델 등록·배포',
    key: 'action',
    settingLabel: '동작',
    help: '평가 승인을 받은 모델을 레지스트리에 등록하거나, Production으로 등록한 모델을 서비스에 배포합니다.',
    variants: [
      {
        id: 'register-production',
        label: '등록 · Production',
        from: 'registerModel',
        settings: { stage: 'production' },
      },
      {
        id: 'register-staging',
        label: '등록 · Staging',
        from: 'registerModel',
        settings: { stage: 'staging' },
      },
      { id: 'deploy', label: '서비스에 배포', from: 'deployModel' },
    ],
  },
  serve: {
    label: '모델·API 응답',
    key: 'mode',
    settingLabel: '응답 방식',
    help: '요청을 배포된 모델로 처리하거나, 질문과 검색 근거로 답변을 만듭니다.',
    variants: [
      { id: 'infer', label: '모델 응답 (요청 + 모델)', from: 'infer' },
      { id: 'api', label: 'API 답변 (질문 + 근거)', from: 'api' },
    ],
  },
  observe: {
    label: '관측',
    key: 'target',
    settingLabel: '관측 대상',
    help: '모델 응답을 운영 보고로 모으거나, 서비스 지표와 정답 표본으로 품질 신호를 만듭니다.',
    variants: [
      { id: 'responses', label: '모델 응답 결과', from: 'observeResponses' },
      { id: 'metrics', label: '서비스 지표·품질', from: 'collectMetrics' },
    ],
  },
};

/** 서비스별로 열어 둘 노드. MLOps 라이프사이클 순서(입력 → 코드·데이터 → 학습 → 등록·서빙 → 운영)를 따른다. */
export const playgroundTools = {
  sources: ['input'],
  github: ['versioned'],
  storage: ['storageOp'],
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
  featureStore: ['feature'],
  registry: ['publish'],
  gateway: ['publish', 'routeTraffic', 'serve'],
  monitoring: ['observe', 'trigger', 'diagnose'],
} satisfies Record<string, string[]>;

const services = Object.keys(playgroundTools);
const kinds = [
  'root',
  ...services,
  ...new Set(
    Object.values(playgroundTools)
      .flat()
      .filter((kind) => !(kind in mergedSpecs)),
  ),
];

/**
 * 원인 판단의 현재 모델 입력은 선을 여러 개 받는다. 처음 배포한 모델과 순환으로 돌아온 재학습 모델을
 * 함께 연결하면, 첫 반복에는 처음 모델을 쓰고 이후에는 버전이 더 높은 재학습 모델을 쓴다.
 */
const diagnose = {
  ...operationKinds.diagnose,
  ports: operationKinds.diagnose.ports.map((p) =>
    p.id === 'in-current' ? { ...p, multiple: true } : p,
  ),
  run: (ctx: Parameters<typeof operationKinds.diagnose.run>[0]) => {
    const inputs = keepNewestModel(ctx.inputs);
    const current = received(inputs, 'deployed-model')[0]?.data.modelId;
    const message = operationKinds.diagnose.run({ ...ctx, inputs });
    return current ? message + ' · 현재 모델 ' + current : message;
  },
};

const common = fromCatalog({
  kinds,
  tools: playgroundTools,
  vectorDb: true,
  custom: {
    ...Object.fromEntries(
      Object.entries(mergedSpecs).map(([kind, spec]) => [kind, mergedKind(spec)]),
    ),
    diagnose,
  },
});

// 서비스 영역의 격자 배치. 새 노드는 2열 격자로 놓이므로 노드 수에 맞춰 높이를 잡는다.
const WIDTH = 520;
const cell = (service: keyof typeof playgroundTools) =>
  52 + Math.max(1, Math.ceil(playgroundTools[service].length / 2)) * 150 + 24;
const placement: Record<string, [number, number]> = {
  sources: [0, 0],
  github: [0, cell('sources') + 40],
  storage: [0, cell('sources') + cell('github') + 80],
  featureStore: [0, cell('sources') + cell('github') + cell('storage') + 120],
  ec2: [560, 0],
  registry: [1120, 0],
  gateway: [1120, cell('registry') + 40],
  monitoring: [1120, cell('registry') + cell('gateway') + 80],
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
  // 모든 노드의 입출력 포트를 학습자가 추가·삭제·타입 변경할 수 있게 연다.
  managedPorts: {},
  onSetting: (graph, id, key, value) => syncVariantPorts(mergedSpecs, graph, id, key, value),
  id: playgroundId,
  storageKey: 'blockml:system-lab:playground:v2',
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
