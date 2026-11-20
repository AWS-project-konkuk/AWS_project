import { resolveScenario } from '../weekly/scenarios';
import {
  connection,
  definition,
  labOf,
  labels,
  makeEntity,
  pilotLesson,
  requiredNodeIds,
  rootId,
  starterTasks,
  type Connection,
  type Entity,
  type Graph,
  type Kind,
  type LabId,
  type Material,
  type PortSpec,
  type ResourceKind,
  type SystemEntity,
  type SystemKind,
} from './model';

/** 노드·시스템의 설정 항목. 선택지는 실행 엔진이 해석합니다. */
export interface FieldSpec {
  id: string;
  label: string;
  help: string;
  initial: string;
  options: readonly { value: string; label: string }[];
}
export interface LabQuestion {
  question: string;
  /** 첫 번째 선택지가 정답입니다. */
  options: readonly string[];
  explanation: string;
}
/** 트리 실습 하나를 정의합니다. 공통 캔버스·명령·엔진은 이 값만 바꿔 다른 실습을 실행합니다. */
export interface LabSpec {
  id: LabId;
  title: string;
  description: string;
  ariaLabel: string;
  storageKey: string;
  initial: () => Graph;
  required: ReadonlySet<string>;
  starter: readonly Connection[];
  fields: Partial<Record<Kind, readonly FieldSpec[]>>;
  hints: Partial<Record<Kind, string>>;
  startInfo?: readonly string[];
  endInfo?: readonly string[];
  practiceIntro: string;
  question: LabQuestion;
}

const pilotQuestion = resolveScenario(pilotLesson, {});

// ─────────────────────────── 공통 도우미 ───────────────────────────
const port = (direction: 'in' | 'out', material: Material, multiple = false): PortSpec => ({
  id: direction + '-' + material,
  direction,
  material,
  multiple,
});
function system(
  kind: SystemKind,
  id: string,
  parent: string,
  [x, y, width, height]: [number, number, number, number],
  settings?: Record<string, string>,
  name = labels[kind],
): SystemEntity {
  return {
    ...(makeEntity(kind, id, parent, { x, y }) as SystemEntity),
    name,
    width,
    height,
    ...(kind !== 'root' && { enabled: true }),
    ...(settings && { settings }),
  };
}
function resource(
  kind: ResourceKind,
  id: string,
  parent: string,
  [x, y]: [number, number],
  ports?: PortSpec[],
  name = labels[kind],
  settings?: Record<string, string>,
): Entity {
  const entity = makeEntity(kind, id, parent, { x, y });
  return {
    ...entity,
    name,
    ...(ports && { ports }),
    ...(settings && { settings }),
  } as Entity;
}
const wire = (from: string, to: string, material: Material) =>
  connection(from, 'out-' + material, to, 'in-' + material);
const fieldDefaults = (fields: readonly FieldSpec[]) =>
  Object.fromEntries(fields.map((field) => [field.id, field.initial]));

// ─────────────────────────── 05 GPU · week1-workflow ───────────────────────────
export const gpu = {
  /** 모델 학습 상태(가중치·기울기·옵티마이저 상태) */
  modelMemory: 24,
  vram: 16,
  samples: 64,
};
export const strategyLabels: Record<string, string> = {
  data: '데이터 병렬',
  model: '모델 병렬 (레이어 분할)',
  tensor: '텐서 병렬',
  fsdp: 'FSDP (상태 분할)',
};
const trainerFields: FieldSpec[] = [
  {
    id: 'strategy',
    label: '분산 전략',
    help: '무엇을 복제하고 무엇을 나눌지 정합니다. 노드는 그대로 두고 처리 방식만 바뀝니다.',
    initial: 'data',
    options: Object.entries(strategyLabels).map(([value, label]) => ({ value, label })),
  },
  {
    id: 'link',
    label: 'GPU 간 연결',
    help: '기울기·부분 결과를 주고받는 통로입니다. 레이어마다 통신하는 전략은 빠른 연결이 필요합니다.',
    initial: 'pcie',
    options: [
      { value: 'pcie', label: 'PCIe' },
      { value: 'nvlink', label: 'NVLink' },
    ],
  },
];
const gpuWorkers = ['worker-a', 'worker-b'];
function gpuInitial(): Graph {
  const entities: Entity[] = [
    system('root', rootId, '', [0, 0, 0, 0]),
    resource('start', 'start', rootId, [0, 250], [port('out', 'batch'), port('out', 'model')]),
    system('gpu-server', 'gpu-server', rootId, [230, 0, 800, 520]),
    system('trainer', 'trainer', 'gpu-server', [22, 46, 750, 440], fieldDefaults(trainerFields)),
    resource('worker', 'worker-a', 'trainer', [36, 60], undefined, 'GPU A'),
    resource('worker', 'worker-b', 'trainer', [36, 260], undefined, 'GPU B'),
    resource('sync', 'sync', 'trainer', [440, 160]),
    resource('end', 'end', rootId, [1090, 300], [port('in', 'checkpoint', true)]),
  ];
  return {
    lab: 'week1-workflow',
    entities,
    connections: [wire('start', 'worker-a', 'batch'), wire('start', 'worker-a', 'model')],
  };
}
const gpuLab: LabSpec = {
  id: 'week1-workflow',
  title: 'GPU 두 장으로 큰 모델 학습하기',
  description:
    '학습 상태 24GiB 모델을 16GiB GPU 두 장에 담습니다. 두 워커에 데이터를 연결하고, 분산 학습의 전략과 연결 방식을 골라 체크포인트를 도착에 보내세요.',
  ariaLabel: '분산 학습 시스템 실습',
  storageKey: 'blockml:system-lab:week1-workflow:v1',
  initial: gpuInitial,
  required: new Set(['start', 'trainer', ...gpuWorkers, 'sync', 'end']),
  starter: [
    wire('start', 'worker-b', 'batch'),
    wire('start', 'worker-b', 'model'),
    ...gpuWorkers.map((id) => wire(id, 'sync', 'gradient')),
    wire('sync', 'end', 'checkpoint'),
  ],
  fields: { trainer: trainerFields },
  hints: {
    root: '전체 서비스입니다. GPU 서버를 선택하면 안에 둘 수 있는 도구를 볼 수 있습니다.',
    'gpu-server': 'GPU 두 장(각 16GiB VRAM)이 달린 EC2 인스턴스입니다.',
    trainer:
      'torchrun으로 실행하는 분산 학습 작업입니다. 분산 전략과 GPU 간 연결을 여기서 고릅니다.',
    worker:
      'GPU 한 장에서 학습을 수행합니다. 장치에 올릴 학습 상태가 VRAM 16GiB를 넘으면 OOM입니다.',
    sync: '두 워커의 결과(기울기·조각)를 모아 하나의 체크포인트로 저장합니다.',
  },
  startInfo: [
    `학습 배치 출력 · 학습 데이터 ${gpu.samples}개를 제공합니다. 두 워커의 학습 배치 입력에 연결하세요.`,
    `모델 출력 · 학습 상태가 ${gpu.modelMemory}GiB인 모델을 제공합니다. 두 워커의 모델 입력에 연결하세요.`,
  ],
  endInfo: [
    '결과 동기화가 만든 체크포인트가 도착해야 합니다.',
    `서로 다른 워커 두 개가 결과를 보내야 하며, 각 워커의 메모리는 VRAM ${gpu.vram}GiB 이하여야 합니다.`,
    '텐서 병렬처럼 레이어마다 통신하는 전략은 통신 병목이 없어야 합니다.',
  ],
  practiceIntro:
    '두 워커에 데이터와 모델을 연결하고 실행해 OOM을 확인한 뒤, 분산 학습의 전략과 연결을 바꿔 체크포인트를 도착에 보내세요.',
  question: {
    question: 'GPU를 두 장으로 늘렸는데 데이터 병렬에서 OOM이 계속 난 이유는?',
    options: [
      '각 GPU에 전체 모델 학습 상태를 복제했기 때문이다.',
      'GPU 두 장의 메모리는 언제나 자동으로 한 덩어리가 되기 때문이다.',
    ],
    explanation:
      '데이터 병렬은 데이터를 나누고 모델 학습 상태는 GPU마다 복제합니다. 모델 병렬·텐서 병렬·FSDP는 상태를 나누는 대신 통신과 대기가 늘어납니다.',
  },
};

// ─────────────────────────── 07 RAG · rag-workflow ───────────────────────────
export const embeddingModels: Record<string, { label: string; dimension: number }> = {
  minilm: { label: 'all-MiniLM-L6-v2', dimension: 384 },
  multilingual: { label: '다국어 MiniLM', dimension: 384 },
  openai: { label: 'text-embedding-3-small', dimension: 1536 },
};
const embedderFields: FieldSpec[] = [
  {
    id: 'model',
    label: '임베딩 모델',
    help: '문서와 질문은 같은 모델로 임베딩해야 같은 의미 공간에서 거리를 비교할 수 있습니다.',
    initial: 'minilm',
    options: Object.entries(embeddingModels).map(([value, m]) => ({
      value,
      label: `${m.label} · ${m.dimension}차원`,
    })),
  },
];
const collectionFields: FieldSpec[] = [
  {
    id: 'metric',
    label: '거리 기준',
    help: 'Chroma의 기본값은 l2입니다. 정규화한 텍스트 임베딩에서는 cosine과 같은 순위를 냅니다.',
    initial: 'cosine',
    options: [
      { value: 'cosine', label: 'cosine' },
      { value: 'l2', label: 'l2' },
    ],
  },
  {
    id: 'topk',
    label: 'top-k',
    help: '프롬프트에 넣을 근거 청크 수입니다.',
    initial: '3',
    options: ['1', '3', '5'].map((value) => ({ value, label: value + '개' })),
  },
];
const promptFields: FieldSpec[] = [
  {
    id: 'abstain',
    label: '근거가 없으면 답변 보류',
    help: '검색 근거가 질문과 관련 없을 때 지어내지 않고 "문서에서 찾을 수 없습니다"라고 답하게 합니다.',
    initial: 'off',
    options: [
      { value: 'off', label: '끔' },
      { value: 'on', label: '켬' },
    ],
  },
];
const ragRequired = [
  'start',
  'chunker',
  'embed-doc',
  'collection',
  'embed-query',
  'prompt',
  'llm',
  'end',
];
function ragInitial(): Graph {
  const entities: Entity[] = [
    system('root', rootId, '', [0, 0, 0, 0]),
    resource(
      'start',
      'start',
      rootId,
      [0, 280],
      [port('out', 'document'), port('out', 'question')],
    ),
    system('rag-server', 'rag-server', rootId, [230, 0, 760, 640]),
    system('indexer', 'indexer', 'rag-server', [22, 46, 480, 150], undefined, '색인 작업 (Docker)'),
    resource('chunker', 'chunker', 'indexer', [24, 52]),
    resource(
      'embedder',
      'embed-doc',
      'indexer',
      [260, 52],
      [port('in', 'chunk'), port('out', 'vector')],
      '문서 임베딩',
      { model: 'minilm' },
    ),
    system(
      'vector-store',
      'vector-store',
      'rag-server',
      [22, 216, 480, 175],
      undefined,
      'Vector DB (Chroma)',
    ),
    resource('collection', 'collection', 'vector-store', [260, 52], undefined, '컬렉션', {
      ...fieldDefaults(collectionFields),
    }),
    system('rag-api', 'rag-api', 'rag-server', [22, 411, 720, 190]),
    resource(
      'embedder',
      'embed-query',
      'rag-api',
      [24, 52],
      [port('in', 'question'), port('out', 'query-vector')],
      '질문 임베딩',
      { model: 'multilingual' },
    ),
    resource('prompt', 'prompt', 'rag-api', [260, 52], undefined, '프롬프트 조립', {
      ...fieldDefaults(promptFields),
    }),
    resource('llm', 'llm', 'rag-api', [496, 52]),
    resource('end', 'end', rootId, [1030, 320], [port('in', 'answer', true)]),
  ];
  return {
    lab: 'rag-workflow',
    entities,
    connections: [
      wire('start', 'chunker', 'document'),
      wire('chunker', 'embed-doc', 'chunk'),
      wire('embed-doc', 'collection', 'vector'),
      wire('start', 'embed-query', 'question'),
      wire('embed-query', 'collection', 'query-vector'),
      wire('collection', 'prompt', 'evidence'),
      wire('prompt', 'llm', 'prompt-text'),
      wire('llm', 'end', 'answer'),
    ],
  };
}
const ragLab: LabSpec = {
  id: 'rag-workflow',
  title: '문서 준비와 질문 응답의 두 경로',
  description:
    '상품 상담 챗봇이 반품 기한 질문에 엉뚱한 답을 합니다. 실행해 어느 단계에서 틀리는지 찾고, 임베딩 모델·질문 연결·답변 보류 설정을 고쳐 근거 있는 답을 만드세요.',
  ariaLabel: 'RAG 시스템 실습',
  storageKey: 'blockml:system-lab:rag-workflow:v1',
  initial: ragInitial,
  required: new Set(ragRequired),
  starter: [wire('start', 'prompt', 'question')],
  fields: { embedder: embedderFields, collection: collectionFields, prompt: promptFields },
  hints: {
    root: '전체 서비스입니다. EC2를 선택하면 안에 둘 수 있는 서비스를 볼 수 있습니다.',
    'rag-server': '색인 작업, Vector DB, RAG API가 함께 실행되는 서버입니다.',
    indexer: '문서가 바뀔 때마다 미리 실행하는 색인 경로입니다.',
    'vector-store': '청크 벡터와 원문을 저장하고 질문 벡터와 가까운 근거를 찾습니다.',
    'rag-api': '질문이 올 때마다 실행되는 요청 경로입니다.',
    chunker: '긴 문서를 검색하기 좋은 크기의 청크로 나눕니다.',
    embedder: '청크나 질문을 벡터로 바꿉니다. 문서 쪽과 질문 쪽 임베딩은 같은 모델을 써야 합니다.',
    collection: '질문 벡터와 가까운 청크 top-k를 근거로 꺼냅니다.',
    prompt: '질문과 근거를 하나의 프롬프트로 묶습니다.',
    llm: '프롬프트의 근거를 바탕으로 답하고 출처를 밝힙니다.',
  },
  startInfo: [
    '문서 출력 · 반품 정책, 배송 안내, 날씨 안내 등 사내 문서 4건을 제공합니다.',
    '질문 출력 · "반품 기한이 어떻게 되나요?"를 제공합니다. 질문 임베딩과 프롬프트 조립에 모두 필요합니다.',
  ],
  endInfo: [
    '질문과 관련된 근거(반품 정책)를 바탕으로 만든 응답이 도착해야 합니다.',
    '문서 임베딩과 질문 임베딩은 같은 모델이어야 합니다. 차원이 같아도 모델이 다르면 무관한 문서가 검색됩니다.',
    '근거가 없을 때 답변을 보류하도록 프롬프트 조립을 설정해야 합니다.',
  ],
  practiceIntro:
    '먼저 실행해 어느 단계에서 틀리는지 확인하세요. 질문 임베딩 모델을 문서 쪽과 맞추고, 빠진 연결과 답변 보류 설정을 채우면 됩니다.',
  question: {
    question: '두 임베딩 모델이 모두 384차원인데도 무관한 문서가 검색된 이유는?',
    options: [
      '차원이 같아도 모델마다 의미 공간이 달라 거리 비교에 의미가 없기 때문이다.',
      'Vector DB는 384차원 벡터를 저장할 수 없기 때문이다.',
    ],
    explanation:
      '차원 수가 같으면 계산은 되지만, 두 모델이 같은 의미 공간을 쓴다는 보장은 없습니다. 저장과 질문에 같은 임베딩 모델을 써야 합니다.',
  },
};

// ─────────────────────────── 02 Docker·K8s · week2-workflow ───────────────────────────
const pilotLab: LabSpec = {
  id: 'week2-workflow',
  title: '모델 서빙 실습',
  description:
    '이미지는 Kubernetes에, 요청은 내부 Service에 연결하세요. 두 Pod에 모델을 전달하고 각 응답을 도착에 연결하세요.',
  ariaLabel: 'Docker·Kubernetes 시스템 실습',
  storageKey: 'blockml:system-lab:week2-workflow:v1',
  initial: definition.initial,
  required: requiredNodeIds,
  starter: starterTasks,
  fields: {},
  hints: {},
  practiceIntro: '시스템과 노드를 실행 상태로 바꾸고 입출력을 연결해 두 Pod의 응답을 확인하세요.',
  question: pilotQuestion,
};

export const labs: Record<LabId, LabSpec> = {
  'week2-workflow': pilotLab,
  'week1-workflow': gpuLab,
  'rag-workflow': ragLab,
};
export const labSpec = (graph: Pick<Graph, 'lab'>) => labs[labOf(graph)];
/** 엔티티 설정값 · 저장값이 없으면 해당 실습 필드의 기본값을 씁니다. */
export function setting(graph: Pick<Graph, 'lab'>, entity: Entity, field: string): string {
  return (
    entity.settings?.[field] ??
    labSpec(graph).fields[entity.kind]?.find((f) => f.id === field)?.initial ??
    ''
  );
}
