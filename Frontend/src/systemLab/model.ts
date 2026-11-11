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
export interface SystemEntity extends EntityBase {
  type: 'system';
  kind: SystemKind;
  width: number;
  height: number;
}
export interface ResourceEntity extends EntityBase {
  type: 'resource';
  kind: ResourceKind;
  ports: PortSpec[];
  version: Version;
  replicas: number;
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
export const materials: Record<Material, string> = {
  request: '요청',
  prediction: '응답',
  model: '모델',
  image: '이미지',
  control: '관리 선언',
};
export const tools: Record<SystemKind, readonly Kind[]> = {
  root: ['ec2', 'model'],
  ec2: ['docker', 'kubernetes'],
  docker: ['image', 'container', 'model'],
  kubernetes: ['deployment', 'service', 'pod', 'model'],
};
export const portTypes: Record<ResourceKind, Record<Direction, readonly Material[]>> = {
  start: { in: [], out: ['request'] },
  end: { in: ['prediction'], out: [] },
  model: { in: [], out: ['model'] },
  image: { in: [], out: ['image'] },
  deployment: { in: [], out: ['control'] },
  service: { in: ['request'], out: ['request'] },
  pod: { in: ['image', 'model', 'control', 'request'], out: ['prediction'] },
  container: { in: ['image', 'model', 'request'], out: ['prediction'] },
};
export const isSystemKind = (kind: Kind): kind is SystemKind => Object.hasOwn(tools, kind);
export const protectedKind = (kind: Kind) => kind === 'root' || kind === 'start' || kind === 'end';
export const hasRunState = (kind: Kind) =>
  !protectedKind(kind) && (isSystemKind(kind) || kind === 'pod' || kind === 'container');
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
  if (isSystemKind(kind)) return { ...base, type: 'system', kind, width: 300, height: 200 };
  const ports = (['in', 'out'] as const).flatMap((direction) =>
    portTypes[kind][direction].map((material) => ({
      id: direction + '-' + material,
      direction,
      material,
      multiple: kind === 'end',
    })),
  );
  return { ...base, type: 'resource', kind, ports, version: 'v1', replicas: 2 };
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
export const starterTasks = (
  [
    ['image', 'image'],
    ['model', 'model'],
    ['deployment', 'control'],
    ['service', 'request'],
  ] as const
)
  .flatMap(([from, material]) => podIds.map((pod) => wire(from, pod, material)))
  .concat(podIds.map((pod) => wire(pod, 'end', 'prediction')));
const requiredNodeIds = new Set([
  'start',
  'model',
  'image',
  'deployment',
  'service',
  ...podIds,
  'end',
]);

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
    node('model', 'model', rootId, 0, 475),
    sys('ec2', 'ec2', rootId, 230, 0, 795, 650),
    sys('docker', 'docker', 'ec2', 22, 46, 230, 154),
    node('image', 'image', 'docker', 26, 47),
    sys('kubernetes', 'kubernetes', 'ec2', 22, 218, 750, 412),
    node('deployment', 'deployment', 'kubernetes', 36, 56),
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
  return node?.type === 'resource'
    ? node.ports.find((port) => port.id === endpoint.port)
    : undefined;
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
        ...(entity.type === 'resource' && {
          ports: entity.ports,
          version: entity.version,
          replicas: entity.replicas,
        }),
      }))
      .sort((a, b) => a.id.localeCompare(b.id)),
    graph.connections.map((edge) => edge.id).sort(),
  ]);
}
