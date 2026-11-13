export const pilotLesson = 'week2-workflow';
export const rootId = 'root';
export type SystemKind = 'root' | 'ec2' | 'docker' | 'kubernetes';
export type ResourceKind =
  'start' | 'end' | 'model' | 'image' | 'deployment' | 'service' | 'pod' | 'container';
export type Kind = SystemKind | ResourceKind;
export type Material = 'request' | 'prediction' | 'model' | 'image' | 'control';
export type Direction = 'in' | 'out';
export type Version = 'v1' | 'v2';
export interface PortSpec {
  id: string;
  direction: Direction;
  material: Material;
  multiple: boolean;
}
export interface Point {
  x: number;
  y: number;
}
interface EntityBase {
  id: string;
  name: string;
  parent: string;
  position: Point;
  enabled?: boolean;
}
export interface KubernetesSettings {
  imageId: string;
  replicas: number;
  workloadLabel: string;
  serviceSelector: string;
  servicePort: number;
}
export const defaultKubernetes: KubernetesSettings = {
  imageId: '',
  replicas: 2,
  workloadLabel: 'review',
  serviceSelector: 'review',
  servicePort: 80,
};
export interface SystemEntity extends EntityBase {
  type: 'system';
  kind: SystemKind;
  width: number;
  height: number;
  ports?: PortSpec[];
  kubernetes?: KubernetesSettings;
}
export interface ResourceEntity extends EntityBase {
  type: 'resource';
  kind: ResourceKind;
  ports: PortSpec[];
  version: Version;
  replicas: number;
  appLabel?: string;
}
export type Entity = SystemEntity | ResourceEntity;
export interface Endpoint {
  node: string;
  port: string;
}
export interface Connection {
  id: string;
  from: Endpoint;
  to: Endpoint;
}
export interface Graph {
  entities: Entity[];
  connections: Connection[];
}
export const labels: Record<Kind, string> = {
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
export const resourceRoles: Partial<Record<ResourceKind, string>> = {
  image: '실행 자료',
  deployment: '배포 설정',
  service: '요청 진입점',
};
export const materials: Record<Material, string> = {
  request: '요청',
  prediction: '응답',
  model: '모델',
  image: '이미지',
  control: '관리 선언',
};
export const tools: Record<SystemKind, readonly Kind[]> = {
  root: ['ec2'],
  ec2: ['docker', 'kubernetes'],
  docker: ['image', 'container'],
  kubernetes: ['service', 'pod'],
};
export const portTypes: Record<Kind, Record<Direction, readonly Material[]>> = {
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
};
export const isSystemKind = (kind: Kind): kind is SystemKind => Object.hasOwn(tools, kind);
export const protectedKind = (kind: Kind) => kind === 'root' || kind === 'start' || kind === 'end';
export const hasRunState = (kind: Kind) =>
  !protectedKind(kind) && (isSystemKind(kind) || kind === 'pod' || kind === 'container');
export const editablePortTypes = (kind: Kind, direction: Direction) =>
  portTypes[kind][direction].filter(
    (material) => kind !== 'pod' || (material !== 'image' && material !== 'control'),
  );
export const defaultClusterPorts = (): PortSpec[] => [
  { id: 'in-image', material: 'image', direction: 'in', multiple: false },
];
export const portLabel = (ports: PortSpec[], port: PortSpec) => {
  const peers = ports.filter((p) => p.material === port.material && p.direction === port.direction);
  return materials[port.material] + (peers.length > 1 ? ' ' + (peers.indexOf(port) + 1) : '');
};
export function makeEntity(kind: Kind, id: string, parent: string, position: Point): Entity {
  const base = {
    id,
    name: labels[kind],
    parent,
    position,
    ...(hasRunState(kind) && { enabled: false }),
  };
  if (isSystemKind(kind))
    return {
      ...base,
      type: 'system',
      kind,
      width: 300,
      height: 200,
      ...(kind === 'kubernetes' && {
        kubernetes: { ...defaultKubernetes },
        ports: defaultClusterPorts(),
      }),
    };
  const ports = (['in', 'out'] as const).flatMap((direction) =>
    portTypes[kind][direction]
      .filter((material) => kind !== 'pod' || (material !== 'image' && material !== 'control'))
      .map((material) => ({
        id: direction + '-' + material,
        direction,
        material,
        multiple: kind === 'end',
      })),
  );
  return {
    ...base,
    type: 'resource',
    kind,
    ports,
    version: 'v1',
    replicas: 2,
    ...(kind === 'pod' && { appLabel: 'review' }),
  };
}
export function connection(from: string, out: string, to: string, input: string): Connection {
  return {
    id: from + ':' + out + '>' + to + ':' + input,
    from: { node: from, port: out },
    to: { node: to, port: input },
  };
}
const wire = (from: string, to: string, material: Material) =>
  connection(from, 'out-' + material, to, 'in-' + material);
const podIds = ['pod-a', 'pod-b'];
export const starterTasks = [
  wire('image', 'kubernetes', 'image'),
  ...podIds
    .map((pod) => wire('start', pod, 'model'))
    .concat(podIds.map((pod) => wire(pod, 'end', 'prediction'))),
];
const requiredNodeIds = new Set(['start', 'image', 'kubernetes', 'service', ...podIds, 'end']);

export const endpointId = (id: string) => (id === 'kubernetes' ? 'service' : id + '-endpoint');
export const appLabel = (pod: ResourceEntity) => pod.appLabel ?? 'review';
export function clusterImages(graph: Graph, cluster: SystemEntity): ResourceEntity[] {
  const stores = new Set(
    graph.entities
      .filter((e) => e.kind === 'docker' && e.parent === cluster.parent)
      .map((e) => e.id),
  );
  return graph.entities.filter(
    (e): e is ResourceEntity => e.type === 'resource' && e.kind === 'image' && stores.has(e.parent),
  );
}
export function serviceRoutes(graph: Graph): Connection[] {
  return graph.entities.flatMap((service) => {
    if (service.kind !== 'service') return [];
    const cluster = graph.entities.find((entity) => entity.id === service.parent);
    if (cluster?.type !== 'system' || !cluster.kubernetes || !cluster.kubernetes.serviceSelector)
      return [];
    return graph.entities.flatMap((pod) => {
      if (
        pod.type !== 'resource' ||
        pod.kind !== 'pod' ||
        pod.parent !== cluster.id ||
        appLabel(pod) !== cluster.kubernetes?.serviceSelector
      )
        return [];
      const input = pod.ports.find(
        (port) => port.direction === 'in' && port.material === 'request',
      );
      return input ? [connection(service.id, 'service-route', pod.id, input.id)] : [];
    });
  });
}

export function requiredLabEntities(entities: readonly Entity[]): Set<string> {
  const parents = new Map(entities.map((entity) => [entity.id, entity.parent]));
  const ids = new Set([rootId]);
  for (const id of requiredNodeIds) {
    let current = id;
    while (current && !ids.has(current)) {
      ids.add(current);
      current = parents.get(current) ?? '';
    }
  }
  return ids;
}
function initial(): Graph {
  const sys = (
    kind: SystemKind,
    id: string,
    parent: string,
    x: number,
    y: number,
    width: number,
    height: number,
  ): SystemEntity => ({
    ...makeEntity(kind, id, parent, { x, y }),
    type: 'system',
    kind,
    width,
    height,
    ...(kind === 'kubernetes' && { kubernetes: { ...defaultKubernetes, imageId: 'image' } }),
  });
  const node = (
    kind: ResourceKind,
    id: string,
    parent: string,
    x: number,
    y: number,
    name = labels[kind],
  ) => ({ ...makeEntity(kind, id, parent, { x, y }), name });
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
export interface LabDefinition {
  initial: () => Graph;
  requestIds: readonly number[];
  requiredPods: number;
}
export const definition: LabDefinition = {
  initial,
  requestIds: Array.from({ length: 10 }, (_, i) => i + 1),
  requiredPods: 2,
};

export function descendants(graph: Graph, id: string): Set<string> {
  const ids = new Set([id]);
  const visit = (parent: string) => {
    for (const node of graph.entities)
      if (node.parent === parent && !ids.has(node.id)) {
        ids.add(node.id);
        visit(node.id);
      }
  };
  visit(id);
  return ids;
}
export function findPort(graph: Graph, endpoint: Endpoint) {
  const node = graph.entities.find((entity) => entity.id === endpoint.node);
  return node?.ports?.find((port) => port.id === endpoint.port);
}
export function manualConnectionIssue(graph: Graph, edge: Connection): string | undefined {
  const from = graph.entities.find((e) => e.id === edge.from.node);
  const to = graph.entities.find((e) => e.id === edge.to.node);
  if (from?.kind === 'kubernetes' || from?.kind === 'service' || from?.kind === 'deployment')
    return '이 경로는 Kubernetes 설정에서 지정하세요.';
  if (to?.kind === 'kubernetes' && from?.kind !== 'image')
    return 'Kubernetes에는 컨테이너 이미지만 연결하세요.';
  if (to?.kind === 'pod' && findPort(graph, edge.to)?.material !== 'model')
    return 'Pod의 요청과 이미지는 Kubernetes 설정을 따릅니다.';
  return connectionIssue(graph, edge);
}
export function connectionIssue(graph: Graph, edge: Connection): string | undefined {
  const out = findPort(graph, edge.from);
  const input = findPort(graph, edge.to);
  if (!out || !input || out.direction !== 'out' || input.direction !== 'in')
    return '출력에서 입력으로 연결하세요.';
  if (edge.from.node === edge.to.node) return '같은 노드의 입출력은 연결할 수 없습니다.';
  if (out.material !== input.material) return '같은 자료 타입끼리 연결하세요.';
  if (graph.connections.some((e) => e.id === edge.id)) return '이미 연결된 포트입니다.';
  if (
    !input.multiple &&
    graph.connections.some((e) => e.to.node === edge.to.node && e.to.port === edge.to.port)
  )
    return '이 입력에는 연결을 하나만 받을 수 있습니다.';
}
export function absolute(graph: Graph, entity: Entity): Point {
  const parent = graph.entities.find((item) => item.id === entity.parent);
  const offset = parent ? absolute(graph, parent) : { x: 0, y: 0 };
  return { x: offset.x + entity.position.x, y: offset.y + entity.position.y };
}
export function signature(graph: Graph) {
  return JSON.stringify([
    graph.entities
      .map((entity) => ({
        id: entity.id,
        kind: entity.kind,
        parent: entity.parent,
        name: entity.name,
        enabled: entity.enabled,
        ...(entity.type === 'system' && entity.kubernetes && { kubernetes: entity.kubernetes }),
        ...(entity.type === 'system' && entity.ports && { ports: entity.ports }),
        ...(entity.type === 'resource' && {
          ports: entity.ports,
          version: entity.version,
          replicas: entity.replicas,
          ...(entity.appLabel !== undefined && { appLabel: entity.appLabel }),
        }),
      }))
      .sort((a, b) => a.id.localeCompare(b.id)),
    graph.connections.map((edge) => edge.id).sort(),
  ]);
}
