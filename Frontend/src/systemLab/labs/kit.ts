import type { Artifact, DataArtifact, StepContext } from '../engine';
import {
  makeEntity,
  signature,
  type Connection,
  type Entity,
  type Graph,
  type Kind,
  type LabConfig,
  type LabPersistence,
  type Point,
  type PortSpec,
  type ResourceEntity,
  type SettingSpec,
  type SettingValue,
  type SystemEntity,
} from '../lab';

/** 변환할 이전 저장 형식이 없는 실습이 쓰는 저장 검증. */
export const plainPersistence: LabPersistence = {
  validateEntity: () => true,
  restoreFixed(entity, fixed) {
    if (
      signature({ entities: [entity], connections: [] }) !==
      signature({ entities: [fixed], connections: [] })
    )
      return undefined;
    return {
      ...fixed,
      position: fixed.kind === 'root' ? fixed.position : entity.position,
    };
  },
  normalizeEntity: (entity) => entity,
  allowsPort: (lab, kind, direction, material) =>
    !!(lab.portTypes[kind]?.[direction] as readonly string[] | undefined)?.includes(material),
  migrate: () => ({ compatible: true, migrated: false }),
};

type Defaults =
  | 'fixedKinds'
  | 'toolPosition'
  | 'managedPorts'
  | 'multipleInput'
  | 'routeSources'
  | 'autoInput'
  | 'entryKinds'
  | 'systemDefaults'
  | 'resourceDefaults'
  | 'requestIds'
  | 'requiredPods'
  | 'routes'
  | 'manualIssue'
  | 'canMove'
  | 'canLoad'
  | 'persistence'
  | 'aiHint'
  | 'settingSpecs'
  | 'onSetting'
  | 'normalize'
  | 'requiredObservations'
  | 'observationLabels'
  | 'resourceRoles';

/** 새 실습이 선언하지 않은 규칙은 가장 단순한 기본값을 쓴다. */
export function defineLab(
  config: Omit<LabConfig, Defaults> & Partial<Pick<LabConfig, Defaults>>,
): LabConfig {
  const lab: LabConfig = {
    fixedKinds: ['root', 'start', 'end'],
    // 서비스는 가로로 나란히 놓이므로 새 노드는 아래로 쌓아 서로 겹치지 않게 한다.
    toolPosition: (index) => ({ x: 24, y: 52 + index * 150 }),
    managedPorts: {},
    multipleInput: [],
    routeSources: [],
    autoInput: () => false,
    entryKinds: [],
    systemDefaults: () => ({}),
    resourceDefaults: () => ({}),
    requestIds: [],
    requiredPods: 0,
    routes: () => [],
    manualIssue: () => undefined,
    canMove: (parent, item) => !!config.tools[parent.kind]?.includes(item.kind),
    canLoad: (parent, item) => !!config.tools[parent.kind]?.includes(item.kind),
    persistence: plainPersistence,
    aiHint: true,
    settingSpecs: {},
    onSetting: (graph) => graph,
    normalize: (graph) => graph,
    requiredObservations: [],
    observationLabels: {},
    resourceRoles: {},
    ...config,
  };
  return lab;
}

/** 노드의 기본 포트. 포트 ID는 연결 저장에 쓰이므로 바꾸지 않는다. */
export const port = (
  direction: 'in' | 'out',
  id: string,
  material: string,
  multiple = false,
  label?: string,
): PortSpec => ({
  id: direction + '-' + id,
  direction,
  material,
  multiple,
  ...(label && { label }),
});

export const wired = (from: string, out: string, to: string, input: string): Connection => ({
  id: from + ':out-' + out + '>' + to + ':in-' + input,
  from: { node: from, port: 'out-' + out },
  to: { node: to, port: 'in-' + input },
});

interface Layout {
  system: (
    kind: Kind,
    id: string,
    parent: string,
    at: Point,
    width: number,
    height: number,
  ) => SystemEntity;
  node: (
    kind: Kind,
    id: string,
    parent: string,
    at: Point,
    options?: { name?: string; settings?: Record<string, SettingValue> },
  ) => ResourceEntity;
}
/** 초기 그래프의 서비스와 작업 노드를 만든다. */
export function layout(lab: LabConfig): Layout {
  return {
    system: (kind, id, parent, at, width, height) => ({
      ...(makeEntity(lab, kind, id, parent, at) as SystemEntity),
      width,
      height,
    }),
    node: (kind, id, parent, at, options = {}) => {
      const entity = makeEntity(lab, kind, id, parent, at) as ResourceEntity;
      return {
        ...entity,
        name: options.name ?? entity.name,
        ...(options.settings && { settings: { ...entity.settings, ...options.settings } }),
      };
    },
  };
}

export const datum = (
  material: string,
  summary: string,
  data: Record<string, unknown> = {},
): DataArtifact => ({ type: 'data', material, summary, data });

/** 입력 포트에 도착한 자료 중 해당 타입의 것만 꺼낸다. */
export const received = (inputs: Artifact[], material: string): DataArtifact[] =>
  inputs.filter((a): a is DataArtifact => a.type === 'data' && a.material === material);
export function need(
  ctx: Pick<StepContext, 'inputs' | 'lab'>,
  material: string,
  label?: string,
): DataArtifact {
  const found = received(ctx.inputs, material);
  if (!found.length) throw new Error((label ?? ctx.lab.materials[material]) + ' 입력이 없습니다.');
  if (found.length > 1)
    throw new Error((label ?? ctx.lab.materials[material]) + ' 입력은 하나만 연결하세요.');
  return found[0];
}
export const setting = (entity: Entity | undefined, key: string): SettingValue => {
  const value = entity?.settings?.[key];
  if (value === undefined) throw new Error('설정 ' + key + '을 찾을 수 없습니다.');
  return value;
};
export const parentOf = (graph: Graph, entity: Entity) =>
  graph.entities.find((e) => e.id === entity.parent);

export const choice = (
  key: string,
  label: string,
  initial: string,
  options: [string, string][],
  help?: string,
): SettingSpec => ({
  key,
  label,
  type: 'choice',
  initial,
  options: options.map(([value, text]) => ({ value, label: text })),
  help,
});

export function numbers(data: Record<string, unknown>, key: string): number[] {
  const values = data[key];
  if (!Array.isArray(values) || !values.every((value) => typeof value === 'number'))
    throw new Error('자료에 필요한 숫자 목록이 없습니다.');
  return values;
}

export { josa } from '../josa';
