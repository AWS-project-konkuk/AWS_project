import { josa } from './josa';
import type { Strategy } from './engine';

/**
 * 시스템 실습의 공통 모델과 실습별 설정(LabConfig).
 * 종류·자료 타입은 실습이 선언하는 문자열이며, 규칙은 모두 LabConfig에서 읽는다.
 * 종류별 세부 설정(kubernetes, version, replicas, appLabel)은 1단원이 쓰는 필드이며
 * 다른 실습이 필요로 할 때 일반 설정으로 확장한다.
 */
export const rootId = 'root';
export type SystemKind = string;
export type ResourceKind = string;
export type Kind = string;
export type Material = string;
export type Direction = 'in' | 'out';
export type Version = 'v1' | 'v2';
export interface PortSpec {
  id: string;
  direction: Direction;
  material: Material;
  multiple: boolean;
  /** 같은 타입의 포트를 구분할 이름. 없으면 타입 이름을 쓴다. */
  label?: string;
}
export interface Point {
  x: number;
  y: number;
}
export type SettingValue = string | number;
/** 노드·서비스 설정 항목의 정의. 값은 entity.settings에 저장한다. */
export interface SettingSpec {
  key: string;
  label: string;
  help?: string;
  type: 'number' | 'choice';
  initial: SettingValue;
  min?: number;
  max?: number;
  step?: number;
  options?: readonly { value: string; label: string }[];
}
interface EntityBase {
  id: string;
  name: string;
  parent: string;
  position: Point;
  settings?: Record<string, SettingValue>;
}
export interface KubernetesSettings {
  imageId: string;
  replicas: number;
  workloadLabel: string;
  serviceSelector: string;
  servicePort: number;
}
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

/** 저장 데이터를 읽을 때 실습별로 필요한 검증과 이전 형식 변환. */
export interface LabPersistence {
  /** 이전 노드 종류나 설정을 현재 형식으로 읽는다. */
  readEntity?: (item: Record<string, unknown>) => Record<string, unknown>;
  /** 공통 필드 검사 뒤에 종류별 필드를 검사한다. */
  validateEntity: (item: Record<string, unknown>, kind: Kind) => boolean;
  /** 고정 노드를 기준 정의와 비교해 복원한다. 맞지 않으면 undefined. */
  restoreFixed: (entity: Entity, fixed: Entity) => Entity | undefined;
  /** 이 종류가 해당 방향·타입의 포트를 가질 수 있는지. */
  allowsPort: (lab: LabConfig, kind: Kind, direction: Direction, material: Material) => boolean;
  /** 이전 저장 형식을 현재 형식으로 바꾼다. */
  migrate: (lab: LabConfig, graph: Graph) => { compatible: boolean; migrated: boolean };
  /** 불러온 시스템 항목의 기본 필드를 채운다. */
  normalizeEntity: (entity: Entity) => Entity;
}

export interface LabConfig {
  id: string;
  storageKey: string;
  labels: Record<Kind, string>;
  materials: Record<Material, string>;
  resourceRoles: Partial<Record<Kind, string>>;
  /** 시스템 종류가 키이며, 값은 그 시스템에서 만들 수 있는 항목. */
  tools: Record<SystemKind, readonly Kind[]>;
  portTypes: Record<Kind, Record<Direction, readonly Material[]>>;
  /** 삭제·이동이 막히는 고정 종류(루트, 시작, 도착). */
  fixedKinds: readonly Kind[];
  /** 서비스 안에서 도구로 만든 index번째 노드의 위치. */
  toolPosition: (index: number) => Point;
  /** 도구로 만든 노드를 켠 상태로 시작할지. 1단원은 직접 켜는 과제라 false이다. */
  /** 서비스 설정이 관리해 학습자가 포트를 바꾸지 않는 자료 타입. */
  managedPorts: Partial<Record<Kind, readonly Material[]>>;
  /** 입력 포트가 여러 연결을 받는 종류. */
  multipleInput: readonly Kind[];
  /** 학습자가 직접 선을 그을 수 없는 출력 핸들을 가진 종류(자동 라우팅 출발점). */
  routeSources: readonly Kind[];
  /** 자동 라우팅 입력이라 선을 직접 그을 수 없는 포트. */
  autoInput: (entity: Entity, port: PortSpec) => boolean;
  /** 이 종류의 노드가 있고 시작에 연결되면 실행 대상이 되는 진입 종류. */
  entryKinds: readonly Kind[];
  systemDefaults: (kind: SystemKind) => Partial<SystemEntity>;
  resourceDefaults: (kind: ResourceKind) => Partial<ResourceEntity>;
  initial: () => Graph;
  starterTasks: Connection[];
  requiredNodeIds: ReadonlySet<string>;
  requestIds: readonly number[];
  requiredPods: number;
  /** 설정에서 파생되는 자동 연결. */
  routes: (graph: Graph) => Connection[];
  /** 학습자가 선을 직접 그을 때의 추가 규칙. */
  manualIssue: (graph: Graph, edge: Connection) => string | undefined;
  /** 항목을 다른 시스템으로 옮길 수 있는지. */
  canMove: (parent: SystemEntity, item: Entity) => boolean;
  /** 저장된 배치가 유효한지. 이전 저장 형식의 배치도 허용한다. */
  canLoad: (parent: SystemEntity, item: Entity) => boolean;
  /** 같은 종류의 노드가 하나만 허용되는 영역 등의 경우를 위한 이름 규칙은 두지 않는다. */
  strategies: Record<Kind, Strategy>;
  persistence: LabPersistence;
  /** AI 조언 요청을 지원하는지. */
  aiHint: boolean;
  /** 종류별 설정 항목. */
  settingSpecs: Record<Kind, readonly SettingSpec[]>;
  /** 설정이 바뀔 때 포트 같은 파생 구성을 맞춘다. */
  onSetting: (graph: Graph, id: string, key: string, value: SettingValue) => Graph;
  /** 모든 편집 뒤에 파생 구성(예: 분할 방식에 따른 포트 타입)을 맞춘다. 같은 입력에 같은 결과여야 한다. */
  normalize: (graph: Graph) => Graph;
  /** 실습 완료에 필요한 실행 관찰. 실행이 남긴 태그로 기록한다. */
  requiredObservations: readonly string[];
  observationLabels: Record<string, string>;
  /**
   * 시작·도착 노드 없이 연결된 노드를 모두 실행하는 자유 구성 실습(플레이그라운드).
   * 연결이 하나라도 있는 노드가 실행 대상이며, 모두 성공해야 성공이다.
   */
  freeform?: boolean;
}

export const defaultSettings = (
  lab: LabConfig,
  kind: Kind,
): Record<string, SettingValue> | undefined => {
  const specs = lab.settingSpecs[kind];
  return specs?.length
    ? Object.fromEntries(specs.map((spec) => [spec.key, spec.initial]))
    : undefined;
};
export function settingIssue(spec: SettingSpec, value: unknown): string | undefined {
  if (spec.type === 'number') {
    if (
      typeof value !== 'number' ||
      !Number.isFinite(value) ||
      value < (spec.min ?? -Infinity) ||
      value > (spec.max ?? Infinity)
    )
      return josa(spec.label, '은/는') + ' ' + spec.min + '~' + spec.max + ' 범위로 입력하세요.';
    return;
  }
  if (typeof value !== 'string' || !spec.options?.some((option) => option.value === value))
    return spec.label + ' 선택지 중에서 고르세요.';
}
export const isComplete = (
  lab: LabConfig,
  saved: { proof: string | null; quiz: boolean; observed?: string[] },
) =>
  !!saved.proof &&
  saved.quiz &&
  lab.requiredObservations.every((tag) => saved.observed?.includes(tag));

export const isSystemKind = (lab: LabConfig, kind: Kind) => Object.hasOwn(lab.tools, kind);
export const protectedKind = (lab: LabConfig, kind: Kind) => lab.fixedKinds.includes(kind);
export const editablePortTypes = (lab: LabConfig, kind: Kind, direction: Direction) =>
  (lab.portTypes[kind]?.[direction] ?? []).filter(
    (material) => !lab.managedPorts[kind]?.includes(material),
  );
export const portLabel = (lab: LabConfig, ports: PortSpec[], port: PortSpec) => {
  if (port.label) return port.label;
  const peers = ports.filter((p) => p.material === port.material && p.direction === port.direction);
  return lab.materials[port.material] + (peers.length > 1 ? ' ' + (peers.indexOf(port) + 1) : '');
};
export function makeEntity(
  lab: LabConfig,
  kind: Kind,
  id: string,
  parent: string,
  position: Point,
): Entity {
  const settings = defaultSettings(lab, kind);
  const base = {
    id,
    name: lab.labels[kind],
    parent,
    position,
    ...(settings && { settings }),
  };
  if (isSystemKind(lab, kind))
    return {
      ...base,
      type: 'system',
      kind,
      width: 300,
      height: 200,
      ...lab.systemDefaults(kind),
    };
  const ports = (['in', 'out'] as const).flatMap((direction) =>
    editablePortTypes(lab, kind, direction).map((material) => ({
      id: direction + '-' + material,
      direction,
      material,
      multiple: direction === 'in' && lab.multipleInput.includes(kind),
    })),
  );
  return {
    ...base,
    type: 'resource',
    kind,
    ports,
    version: 'v1',
    replicas: 2,
    ...lab.resourceDefaults(kind),
  };
}
export function connection(from: string, out: string, to: string, input: string): Connection {
  return {
    id: from + ':' + out + '>' + to + ':' + input,
    from: { node: from, port: out },
    to: { node: to, port: input },
  };
}
export const wire = (from: string, to: string, material: Material) =>
  connection(from, 'out-' + material, to, 'in-' + material);
export function requiredLabEntities(lab: LabConfig, entities: readonly Entity[]): Set<string> {
  const parents = new Map(entities.map((entity) => [entity.id, entity.parent]));
  const ids = new Set([rootId]);
  for (const id of lab.requiredNodeIds) {
    let current = id;
    while (current && !ids.has(current)) {
      ids.add(current);
      current = parents.get(current) ?? '';
    }
  }
  return ids;
}
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
/** 단일 입력 포트가 이미 차 있으면 새 연결이 기존 연결을 대신한다. */
export const withoutOccupant = (graph: Graph, edge: Connection): Graph => {
  const input = findPort(graph, edge.to);
  if (!input || input.multiple) return graph;
  const connections = graph.connections.filter(
    (e) => e.id === edge.id || e.to.node !== edge.to.node || e.to.port !== edge.to.port,
  );
  return connections.length === graph.connections.length ? graph : { ...graph, connections };
};
export const manualConnectionIssue = (lab: LabConfig, graph: Graph, edge: Connection) => {
  const target = withoutOccupant(graph, edge);
  return lab.manualIssue(target, edge) ?? connectionIssue(target, edge);
};
export function absolute(graph: Graph, entity: Entity): Point {
  const parent = graph.entities.find((item) => item.id === entity.parent);
  const offset = parent ? absolute(graph, parent) : { x: 0, y: 0 };
  return { x: offset.x + entity.position.x, y: offset.y + entity.position.y };
}
export function signature(graph: Graph, legacyRunFlags?: ReadonlyMap<string, boolean>) {
  return JSON.stringify([
    graph.entities
      .map((entity) => ({
        id: entity.id,
        kind: entity.kind,
        parent: entity.parent,
        name: entity.name,
        enabled: legacyRunFlags?.get(entity.id),
        ...(entity.settings && { settings: entity.settings }),
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
