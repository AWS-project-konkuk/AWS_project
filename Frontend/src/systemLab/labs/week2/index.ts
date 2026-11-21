import {
  makeEntity,
  rootId,
  wire,
  type Graph,
  type LabConfig,
  type ResourceEntity,
  type SystemEntity,
} from '../../lab';
import { week2Persistence } from './persistence';
import { defaultClusterPorts, defaultKubernetes, manualIssue, serviceRoutes } from './rules';
import { strategies } from './strategies';

export const week2LessonId = 'week2-workflow';
const podIds = ['pod-a', 'pod-b'];

const labels = {
  root: '전체 서비스',
  ec2: 'EC2',
  docker: 'Docker',
  kubernetes: 'Kubernetes',
  start: '출발',
  end: '도착',
  model: '모델 파일',
  image: '컨테이너 이미지',
  deployment: 'Deployment',
  service: 'Service',
  pod: 'Pod',
  container: '컨테이너',
};
const tools = {
  root: ['ec2'],
  ec2: ['docker', 'kubernetes'],
  docker: ['image', 'container'],
  kubernetes: ['service', 'pod'],
};

function initial(lab: LabConfig): Graph {
  const sys = (
    kind: string,
    id: string,
    parent: string,
    x: number,
    y: number,
    width: number,
    height: number,
  ): SystemEntity => ({
    ...(makeEntity(lab, kind, id, parent, { x, y }) as SystemEntity),
    width,
    height,
    ...(kind === 'kubernetes' && { kubernetes: { ...defaultKubernetes, imageId: 'image' } }),
  });
  const node = (
    kind: string,
    id: string,
    parent: string,
    x: number,
    y: number,
    name = labels[kind as keyof typeof labels],
  ) => ({ ...(makeEntity(lab, kind, id, parent, { x, y }) as ResourceEntity), name });
  const entities = [
    sys('root', rootId, '', 0, 0, 0, 0),
    node('start', 'start', rootId, 0, 292),
    sys('ec2', 'ec2', rootId, 230, 0, 795, 650),
    sys('docker', 'docker', 'ec2', 22, 46, 230, 154),
    node('image', 'image', 'docker', 26, 47),
    sys('kubernetes', 'kubernetes', 'ec2', 22, 218, 750, 412),
    node('service', 'service', 'kubernetes', 36, 215),
    node('pod', 'pod-a', 'kubernetes', 415, 50, 'Pod 1'),
    node('pod', 'pod-b', 'kubernetes', 415, 222, 'Pod 2'),
    node('end', 'end', rootId, 1080, 360),
  ];
  return { entities, connections: [wire('start', 'service', 'request')] };
}

export const week2Lab: LabConfig = {
  id: week2LessonId,
  storageKey: 'blockml:system-lab:week2-workflow:v1',
  labels,
  materials: {
    request: '요청',
    prediction: '응답',
    model: '모델',
    image: '이미지',
    control: '관리 선언',
  },
  resourceRoles: { image: '실행 자료', deployment: '배포 설정', service: '요청 진입점' },
  tools,
  portTypes: {
    root: { in: [], out: [] },
    ec2: { in: [], out: [] },
    docker: { in: [], out: [] },
    kubernetes: { in: ['image'], out: [] },
    start: { in: [], out: ['request', 'model'] },
    end: { in: ['prediction'], out: [] },
    model: { in: [], out: ['model'] },
    image: { in: [], out: ['image'] },
    deployment: { in: [], out: ['control'] },
    service: { in: ['request'], out: [] },
    pod: { in: ['image', 'model', 'control', 'request'], out: ['prediction'] },
    container: { in: ['image', 'model', 'request'], out: ['prediction'] },
  },
  fixedKinds: ['root', 'start', 'end'],
  runStateKinds: ['ec2', 'docker', 'kubernetes', 'pod', 'container'],
  createEnabled: false,
  toolPosition: (index) => ({ x: 24, y: 52 + index * 164 }),
  managedPorts: { pod: ['image', 'control'] },
  multipleInput: ['end'],
  routeSources: ['service'],
  autoInput: (entity, port) =>
    entity.kind === 'pod' && port.material === 'request' && port.direction === 'in',
  entryKinds: ['service'],
  systemDefaults: (kind) =>
    kind === 'kubernetes'
      ? { kubernetes: { ...defaultKubernetes }, ports: defaultClusterPorts() }
      : {},
  resourceDefaults: (kind) => (kind === 'pod' ? { appLabel: 'review' } : {}),
  initial: () => initial(week2Lab),
  starterTasks: [
    wire('image', 'kubernetes', 'image'),
    ...podIds.map((pod) => wire('start', pod, 'model')),
    ...podIds.map((pod) => wire(pod, 'end', 'prediction')),
  ],
  requiredNodeIds: new Set(['start', 'image', 'kubernetes', 'service', ...podIds, 'end']),
  requestIds: Array.from({ length: 10 }, (_, i) => i + 1),
  requiredPods: 2,
  routes: serviceRoutes,
  manualIssue,
  canMove: (parent, item) =>
    tools[parent.kind as keyof typeof tools]?.includes(item.kind) ||
    (item.kind === 'service' && parent.id === item.parent),
  canLoad: (parent, item) =>
    tools[parent.kind as keyof typeof tools]?.includes(item.kind) ||
    (item.kind === 'model' && parent.kind !== 'ec2') ||
    ((item.kind === 'deployment' || item.kind === 'service') && parent.kind === 'kubernetes'),
  strategies,
  persistence: week2Persistence,
  aiHint: true,
  settingSpecs: {},
  onSetting: (graph) => graph,
  normalize: (graph) => graph,
  requiredObservations: [],
  observationLabels: {},
};
