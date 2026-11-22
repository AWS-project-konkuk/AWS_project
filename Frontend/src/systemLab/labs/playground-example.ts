import { applyCommand } from '../commands';
import { rootId, type Connection, type Graph, type SettingValue } from '../lab';
import { wired } from './kit';
import { playgroundLab as lab } from './playground';

/**
 * 플레이그라운드의 MLOps 예시 5단계. 쉬운 구성에서 시작해 단계마다 노드와 연결을 더한다.
 * 1 데이터 검증 → 2 학습·저장 → 3 평가·등록 → 4 배포·서빙·관측 → 5 순환하는 개선 루프와 피처·버전 재현까지 전체.
 */
type Node = {
  id: string;
  kind: string;
  parent: string;
  name: string;
  settings?: Record<string, SettingValue>;
};
const nodes: Node[] = [
  { id: 'raw', kind: 'input', parent: 'sources', name: '원본 데이터', settings: { source: 'raw' } },
  {
    id: 'reqs',
    kind: 'input',
    parent: 'sources',
    name: '사용자 요청',
    settings: { source: 'req-100' },
  },
  {
    id: 'ops',
    kind: 'input',
    parent: 'sources',
    name: '운영 로그',
    settings: { source: 'ops-low' },
  },
  {
    id: 'clicks',
    kind: 'input',
    parent: 'sources',
    name: '클릭 이력',
    settings: { source: 'clicks' },
  },
  {
    id: 'fqTrain',
    kind: 'input',
    parent: 'sources',
    name: '학습용 조회 요청',
    settings: { source: 'fq-train' },
  },
  {
    id: 'fqServe',
    kind: 'input',
    parent: 'sources',
    name: '추론용 조회 요청',
    settings: { source: 'fq-serve' },
  },
  {
    id: 'work',
    kind: 'input',
    parent: 'sources',
    name: '현재 작업 데이터',
    settings: { source: 'work-v2' },
  },
  {
    id: 'repo',
    kind: 'versioned',
    parent: 'github',
    name: '학습 코드 v2',
    settings: { item: 'repo-v2' },
  },
  {
    id: 'file',
    kind: 'versioned',
    parent: 'github',
    name: '데이터 파일 v2',
    settings: { item: 'file-v2' },
  },
  {
    id: 'read',
    kind: 'storageOp',
    parent: 'storage',
    name: '원본 읽기',
    settings: { operation: 'read' },
  },
  {
    id: 'save',
    kind: 'storageOp',
    parent: 'storage',
    name: '모델 저장',
    settings: { operation: 'save' },
  },
  { id: 'validate', kind: 'validateData', parent: 'ec2', name: '데이터 검증' },
  { id: 'partition', kind: 'partition', parent: 'ec2', name: '학습·평가 분할' },
  {
    id: 'batch',
    kind: 'prepareBatch',
    parent: 'ec2',
    name: '배치 준비',
    settings: { cache: 'on', shard: 'on', storage: 'persistent' },
  },
  { id: 'train', kind: 'train', parent: 'ec2', name: '모델 학습' },
  { id: 'track', kind: 'trackExperiment', parent: 'ec2', name: '실험 기록' },
  {
    id: 'evaluate',
    kind: 'evaluate',
    parent: 'ec2',
    name: '모델 평가',
    settings: { threshold: 0.8 },
  },
  {
    id: 'restore',
    kind: 'restore',
    parent: 'ec2',
    name: '실험 복원',
    settings: { operation: 'pull' },
  },
  { id: 'retrain', kind: 'train', parent: 'ec2', name: '재학습' },
  {
    id: 'reeval',
    kind: 'evaluate',
    parent: 'ec2',
    name: '재학습 평가',
    settings: { threshold: 0.85 },
  },
  {
    id: 'define',
    kind: 'feature',
    parent: 'featureStore',
    name: '공통 피처 정의',
    settings: { operation: 'define-24' },
  },
  {
    id: 'lookTrain',
    kind: 'feature',
    parent: 'featureStore',
    name: '학습 피처 조회',
    settings: { operation: 'lookup-cutoff' },
  },
  {
    id: 'lookServe',
    kind: 'feature',
    parent: 'featureStore',
    name: '추론 피처 조회',
    settings: { operation: 'lookup-now' },
  },
  {
    id: 'register',
    kind: 'publish',
    parent: 'registry',
    name: '모델 등록',
    settings: { action: 'register-production' },
  },
  {
    id: 'register2',
    kind: 'publish',
    parent: 'registry',
    name: '재학습 모델 등록',
    settings: { action: 'register-production' },
  },
  {
    id: 'deploy',
    kind: 'publish',
    parent: 'gateway',
    name: '모델 배포',
    settings: { action: 'deploy' },
  },
  {
    id: 'deploy2',
    kind: 'publish',
    parent: 'gateway',
    name: '재학습 모델 배포',
    settings: { action: 'deploy' },
  },
  { id: 'serve', kind: 'serve', parent: 'gateway', name: '모델 서빙', settings: { mode: 'infer' } },
  {
    id: 'observe',
    kind: 'observe',
    parent: 'monitoring',
    name: '응답 관측',
    settings: { target: 'responses' },
  },
  {
    id: 'metrics',
    kind: 'observe',
    parent: 'monitoring',
    name: '품질 지표 수집',
    settings: { target: 'metrics' },
  },
  { id: 'trigger', kind: 'trigger', parent: 'monitoring', name: '재학습 트리거' },
  {
    id: 'diagnose',
    kind: 'diagnose',
    parent: 'monitoring',
    name: '원인 판단',
    settings: { correction: 'fresh' },
  },
];
const fullWires = [
  // 데이터 준비 → 학습 → 평가
  wired('raw', 'objects', 'read', 'objects'),
  wired('read', 'dataset', 'validate', 'dataset'),
  wired('validate', 'dataset', 'partition', 'dataset'),
  wired('partition', 'job', 'batch', 'job'),
  wired('partition', 'train', 'batch', 'dataset'),
  wired('batch', 'job', 'train', 'job'),
  wired('train', 'result', 'track', 'checkpoint'),
  wired('track', 'checkpoint', 'evaluate', 'checkpoint'),
  wired('partition', 'eval', 'evaluate', 'dataset'),
  wired('track', 'checkpoint', 'save', 'checkpoint'),
  // 승인 → 등록 → 배포 → 서빙 → 관측
  wired('evaluate', 'approval', 'register', 'approval'),
  wired('register', 'model', 'deploy', 'model'),
  wired('deploy', 'model', 'serve', 'model'),
  wired('reqs', 'request', 'serve', 'request'),
  wired('serve', 'prediction', 'observe', 'prediction'),
  // 운영 지표 → 재학습 → 재평가
  wired('ops', 'metrics', 'metrics', 'metrics'),
  wired('ops', 'labels', 'metrics', 'labels'),
  wired('metrics', 'signal', 'trigger', 'signal'),
  wired('trigger', 'signal', 'diagnose', 'signal'),
  wired('deploy', 'model', 'diagnose', 'current'),
  wired('diagnose', 'job', 'retrain', 'job'),
  wired('retrain', 'result', 'reeval', 'checkpoint'),
  wired('diagnose', 'evaluation', 'reeval', 'dataset'),
  // 재학습 모델을 등록·배포해 다시 현재 모델로 돌려보내는 순환. 첫 반복에는 처음 배포한 모델을 쓴다.
  wired('reeval', 'approval', 'register2', 'approval'),
  wired('register2', 'model', 'deploy2', 'model'),
  wired('deploy2', 'model', 'diagnose', 'current'),
  // 학습·추론 피처 일치
  wired('clicks', 'events', 'define', 'events'),
  wired('define', 'definition', 'lookTrain', 'definition'),
  wired('define', 'definition', 'lookServe', 'definition'),
  wired('fqTrain', 'query', 'lookTrain', 'query'),
  wired('fqServe', 'query', 'lookServe', 'query'),
  // 코드·데이터 버전으로 실험 복원
  wired('repo', 'code', 'restore', 'code'),
  wired('work', 'workdata', 'restore', 'workdata'),
  wired('file', 'file', 'restore', 'file'),
];

/** 서비스를 세 열에 쌓는다. 높이는 안의 노드 수에 맞춘다. */
const columns = [
  ['sources', 'github'],
  ['storage', 'ec2'],
  ['featureStore', 'registry', 'gateway', 'monitoring'],
];
const GAP = 40;
const WIDTH = 520;

function buildExample(ids: string[], wires: Connection[]): Graph {
  let graph = lab.initial();
  const apply = (command: Parameters<typeof applyCommand>[1]) => {
    graph = applyCommand(graph, command, lab);
  };
  for (const node of nodes.filter((item) => ids.includes(item.id))) {
    apply({ type: 'add', id: node.id, kind: node.kind, parent: node.parent });
    apply({ type: 'settings', id: node.id, name: node.name });
    for (const [key, value] of Object.entries(node.settings ?? {}))
      apply({ type: 'setting', id: node.id, key, value });
  }
  for (const edge of wires) apply({ type: 'connect', edge });
  const height = (service: string) => {
    const count = graph.entities.filter((e) => e.parent === service).length;
    return 52 + Math.max(1, Math.ceil(count / 2)) * 150 + 24;
  };
  // 노드가 없는 서비스는 빼고, 남은 서비스를 앞쪽 열부터 채운다.
  const used = new Set(graph.entities.filter((e) => e.type === 'resource').map((e) => e.parent));
  const places = new Map<string, { x: number; y: number; height: number }>();
  columns
    .map((services) => services.filter((service) => used.has(service)))
    .filter((services) => services.length)
    .forEach((services, column) => {
      let y = 0;
      for (const service of services) {
        places.set(service, { x: column * (WIDTH + GAP), y, height: height(service) });
        y += height(service) + GAP;
      }
    });
  return {
    ...graph,
    entities: graph.entities
      .filter(
        (entity) => entity.type !== 'system' || entity.parent !== rootId || used.has(entity.id),
      )
      .map((entity) => {
        const place = places.get(entity.id);
        return place && entity.type === 'system' && entity.parent === rootId
          ? { ...entity, position: { x: place.x, y: place.y }, width: WIDTH, height: place.height }
          : entity;
      }),
  };
}

const dataWires = [
  wired('raw', 'objects', 'read', 'objects'),
  wired('read', 'dataset', 'validate', 'dataset'),
  wired('validate', 'dataset', 'partition', 'dataset'),
];
const trainWires = [
  ...dataWires,
  wired('partition', 'job', 'train', 'job'),
  wired('train', 'result', 'save', 'checkpoint'),
];
const registerWires = [
  ...dataWires,
  wired('partition', 'job', 'train', 'job'),
  wired('train', 'result', 'track', 'checkpoint'),
  wired('track', 'checkpoint', 'evaluate', 'checkpoint'),
  wired('partition', 'eval', 'evaluate', 'dataset'),
  wired('track', 'checkpoint', 'save', 'checkpoint'),
  wired('evaluate', 'approval', 'register', 'approval'),
];
const serveWires = [
  ...registerWires,
  wired('register', 'model', 'deploy', 'model'),
  wired('deploy', 'model', 'serve', 'model'),
  wired('reqs', 'request', 'serve', 'request'),
  wired('serve', 'prediction', 'observe', 'prediction'),
];

export interface ExampleWorkflow {
  id: string;
  title: string;
  build: () => Graph;
}
/** 플레이그라운드에서 고를 수 있는 MLOps 예시. 위에서 아래로 갈수록 복잡하다. */
export const exampleWorkflows: ExampleWorkflow[] = [
  {
    id: 'level-1',
    title: '1단계 · 데이터 읽고 검증하기',
    build: () => buildExample(['raw', 'read', 'validate'], dataWires.slice(0, 2)),
  },
  {
    id: 'level-2',
    title: '2단계 · 모델 학습하고 저장하기',
    build: () =>
      buildExample(['raw', 'read', 'validate', 'partition', 'train', 'save'], trainWires),
  },
  {
    id: 'level-3',
    title: '3단계 · 평가하고 모델 등록하기',
    build: () =>
      buildExample(
        ['raw', 'read', 'save', 'validate', 'partition', 'train', 'track', 'evaluate', 'register'],
        registerWires,
      ),
  },
  {
    id: 'level-4',
    title: '4단계 · 배포하고 서빙·관측하기',
    build: () =>
      buildExample(
        [
          'raw',
          'reqs',
          'read',
          'save',
          'validate',
          'partition',
          'train',
          'track',
          'evaluate',
          'register',
          'deploy',
          'serve',
          'observe',
        ],
        serveWires,
      ),
  },
  {
    id: 'level-5',
    title: '5단계 · 순환하는 개선 루프까지 전체 MLOps',
    build: () =>
      buildExample(
        nodes.map((node) => node.id),
        fullWires,
      ),
  },
];

/** 가장 복잡한 5단계 예시. */
export const examplePipeline = (): Graph =>
  buildExample(
    nodes.map((node) => node.id),
    fullWires,
  );
