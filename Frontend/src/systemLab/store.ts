import { create } from 'zustand';
import { applyCommand, type Command } from './commands';
import {
  connection,
  connectionIssue,
  definition,
  defaultClusterPorts,
  defaultKubernetes,
  endpointId,
  clusterImages,
  makeEntity,
  manualConnectionIssue,
  hasRunState,
  isSystemKind,
  labels,
  pilotLesson,
  portTypes,
  protectedKind,
  requiredLabEntities,
  rootId,
  signature,
  tools,
  type Connection,
  type Entity,
  type Graph,
  type Kind,
  type KubernetesSettings,
} from './model';
import { runLab } from './engine';
import type { LearningData } from '../curriculum/types';

export const storageKey = 'blockml:system-lab:week2-workflow:v1';
interface Saved {
  version: 1;
  graph: Graph;
  quiz: boolean;
  proof: string | null;
}
const fresh = (): Saved => ({
  version: 1,
  graph: definition.initial(),
  quiz: false,
  proof: null,
});
const fail = () => {
  throw new Error('실습 저장 데이터를 읽을 수 없습니다.');
};
const record = (x: unknown): x is Record<string, unknown> =>
  !!x && typeof x === 'object' && !Array.isArray(x);
const number = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);
type LegacyKubernetes = KubernetesSettings & { imageInput?: boolean };
export function parseSaved(raw: string): Saved {
  const saved: unknown = JSON.parse(raw);
  if (
    !record(saved) ||
    saved.version !== 1 ||
    typeof saved.quiz !== 'boolean' ||
    !(saved.proof === null || typeof saved.proof === 'string') ||
    !record(saved.graph) ||
    !Array.isArray(saved.graph.entities) ||
    !Array.isArray(saved.graph.connections)
  )
    return fail();
  const base = definition.initial();
  const entities: Entity[] = [];
  const ids = new Set<string>();
  for (const item of saved.graph.entities as unknown[]) {
    if (
      !record(item) ||
      typeof item.id !== 'string' ||
      !item.id ||
      ids.has(item.id) ||
      typeof item.name !== 'string' ||
      !item.name.trim() ||
      item.name.length > 63 ||
      typeof item.kind !== 'string' ||
      !Object.hasOwn(labels, item.kind) ||
      typeof item.parent !== 'string' ||
      (item.enabled !== undefined && typeof item.enabled !== 'boolean') ||
      !record(item.position) ||
      !number(item.position.x) ||
      !number(item.position.y)
    )
      return fail();
    const kind = item.kind as Kind;
    if (hasRunState(kind) && typeof item.enabled !== 'boolean') return fail();
    if (isSystemKind(kind)) {
      if (
        item.type !== 'system' ||
        !number(item.width) ||
        !number(item.height) ||
        item.width < 0 ||
        item.height < 0
      )
        return fail();
      if (item.ports !== undefined) {
        if (kind !== 'kubernetes' || !Array.isArray(item.ports)) return fail();
        const ids = new Set<string>();
        for (const port of item.ports as unknown[]) {
          if (
            !record(port) ||
            typeof port.id !== 'string' ||
            !port.id ||
            ids.has(port.id) ||
            port.direction !== 'in' ||
            port.material !== 'image' ||
            typeof port.multiple !== 'boolean'
          )
            return fail();
          ids.add(port.id);
        }
      }
    } else {
      if (
        item.type !== 'resource' ||
        !Array.isArray(item.ports) ||
        !['v1', 'v2'].includes(String(item.version)) ||
        typeof item.replicas !== 'number' ||
        !Number.isSafeInteger(item.replicas) ||
        item.replicas < 1 ||
        item.replicas > 10
      )
        return fail();
      const ports = new Set<string>();
      for (const p of item.ports as unknown[]) {
        if (
          !record(p) ||
          typeof p.id !== 'string' ||
          !p.id ||
          ports.has(p.id) ||
          (p.direction !== 'in' && p.direction !== 'out') ||
          typeof p.multiple !== 'boolean' ||
          typeof p.material !== 'string' ||
          (!(portTypes[kind][p.direction] as readonly string[]).includes(p.material) &&
            !(kind === 'service' && p.direction === 'out' && p.material === 'request'))
        )
          return fail();
        ports.add(p.id);
      }
    }
    if (kind === 'kubernetes' && item.kubernetes !== undefined) {
      const cfg = item.kubernetes;
      if (
        !record(cfg) ||
        typeof cfg.imageId !== 'string' ||
        (cfg.imageInput !== undefined && typeof cfg.imageInput !== 'boolean') ||
        typeof cfg.workloadLabel !== 'string' ||
        typeof cfg.serviceSelector !== 'string' ||
        !number(cfg.replicas) ||
        !Number.isInteger(cfg.replicas) ||
        cfg.replicas < 1 ||
        cfg.replicas > 10 ||
        !number(cfg.servicePort) ||
        !Number.isInteger(cfg.servicePort) ||
        cfg.servicePort < 1 ||
        cfg.servicePort > 65535
      )
        return fail();
    }
    if (kind === 'pod' && item.appLabel !== undefined && typeof item.appLabel !== 'string')
      return fail();
    const entity = item as unknown as Entity;
    if (protectedKind(kind)) {
      const fixed = base.entities.find((e) => e.kind === kind);
      if (!fixed || entity.id !== fixed.id) return fail();
      const start =
        fixed.type === 'resource' && fixed.kind === 'start' && entity.type === 'resource';
      const comparable = {
        ...entity,
        enabled: undefined,
        ...(start && { version: fixed.version }),
      };
      const expected =
        start && entity.ports.length === 1
          ? { ...fixed, ports: fixed.ports.filter((port) => port.material !== 'model') }
          : fixed;
      if (
        signature({ entities: [comparable], connections: [] }) !==
        signature({ entities: [expected], connections: [] })
      )
        return fail();
      entities.push(
        start
          ? {
              ...fixed,
              position: entity.position,
              ports: entity.ports,
              version: entity.version,
              enabled: entity.enabled,
            }
          : {
              ...fixed,
              position: fixed.kind === 'root' ? fixed.position : entity.position,
              enabled: entity.enabled,
            },
      );
    } else entities.push(entity);
    ids.add(entity.id);
  }
  if (!base.entities.filter((e) => protectedKind(e.kind)).every((e) => ids.has(e.id)))
    return fail();
  const lookup = new Map(entities.map((e) => [e.id, e]));
  const required = requiredLabEntities(base.entities);
  const defaults = new Map(base.entities.map((e) => [e.id, e]));
  // Earlier saves may have deleted a required node or its original system.
  const restoreMissing = (item: Entity) => {
    const existing = lookup.get(item.id);
    if (existing) {
      if (existing.kind !== item.kind) fail();
      return;
    }
    const parent = defaults.get(item.parent);
    if (parent) restoreMissing(parent);
    lookup.set(item.id, item);
    entities.push(item);
  };
  for (const item of base.entities) {
    if (required.has(item.id) && item.type === 'resource' && item.kind !== 'service')
      restoreMissing(item);
  }
  for (const item of entities) {
    const seen = new Set<string>();
    let current = item;
    while (current.id !== rootId) {
      const parent = lookup.get(current.parent);
      if (
        seen.has(current.id) ||
        parent?.type !== 'system' ||
        (!protectedKind(current.kind) &&
          !tools[parent.kind].includes(current.kind) &&
          !(current.kind === 'model' && parent.kind !== 'ec2') &&
          !(
            (current.kind === 'deployment' || current.kind === 'service') &&
            parent.kind === 'kubernetes'
          ))
      )
        return fail();
      seen.add(current.id);
      current = parent;
    }
  }
  const graph: Graph = {
    entities: entities.map((entity) => {
      if (entity.type !== 'system' || entity.kind !== 'kubernetes') return entity;
      const legacy: LegacyKubernetes = entity.kubernetes ?? defaultKubernetes;
      const { imageInput, ...settings } = legacy;
      return {
        ...entity,
        ports: entity.ports ?? (imageInput === false ? [] : defaultClusterPorts()),
        ...(entity.kubernetes && { kubernetes: settings }),
      };
    }),
    connections: [],
  };
  for (const item of saved.graph.connections as unknown[]) {
    if (
      !record(item) ||
      !record(item.from) ||
      !record(item.to) ||
      typeof item.from.node !== 'string' ||
      typeof item.from.port !== 'string' ||
      typeof item.to.node !== 'string' ||
      typeof item.to.port !== 'string'
    )
      return fail();
    const edge: Connection = connection(item.from.node, item.from.port, item.to.node, item.to.port);
    if (
      connectionIssue(graph, edge) &&
      !(
        edge.to.port === 'in-request' &&
        entities.some((e) => e.id === edge.to.node && e.kind === 'kubernetes') &&
        edge.from.node === 'start'
      )
    )
      return fail();
    graph.connections.push(edge);
  }
  const previousSignature = signature({ ...graph, entities });
  const compatibleModels = migrateModelSource(graph);
  const migrated = migrateKubernetes(graph);
  const foldedLegacy = migrateClusterPorts(graph);
  const movedPorts = restoreServiceNodes(graph);
  // Old saves recorded an execution flag for resources that are applied automatically.
  graph.entities = graph.entities.map((entity) => {
    if (hasRunState(entity.kind) || !Object.hasOwn(entity, 'enabled')) return entity;
    const normalized = { ...entity };
    delete normalized.enabled;
    return normalized;
  });
  return {
    version: 1,
    graph,
    quiz: saved.quiz,
    proof:
      compatibleModels &&
      saved.proof === previousSignature &&
      (!(migrated || foldedLegacy || movedPorts) || runLab(graph, 'migration').success)
        ? signature(graph)
        : null,
  };
}
function migrateKubernetes(graph: Graph): boolean {
  const legacy = graph.entities.some(
    (e) =>
      e.kind === 'deployment' || (e.kind === 'kubernetes' && e.type === 'system' && !e.kubernetes),
  );
  if (!legacy) return false;
  const original = [...graph.entities];
  const endpoints = new Map<string, string>();
  for (const cluster of original) {
    if (cluster.type !== 'system' || cluster.kind !== 'kubernetes' || cluster.kubernetes) continue;
    const local = original.filter((e) => e.parent === cluster.id);
    const deployment = local.find((e) => e.kind === 'deployment');
    const entries = local.filter((e) => e.kind === 'service');
    const entry =
      entries.find((e) =>
        graph.connections.some((wire) => wire.to.node === e.id && wire.from.node === 'start'),
      ) ?? entries[0];
    const id = endpointId(cluster.id);
    if (original.some((e) => e.id === id && (e.kind !== 'service' || e.parent !== cluster.id)))
      fail();
    entries.forEach((e) => endpoints.set(e.id, id));
    const images = clusterImages(graph, cluster);
    const wired = graph.connections.find(
      (edge) =>
        images.some((image) => image.id === edge.from.node) &&
        local.some((pod) => pod.kind === 'pod' && pod.id === edge.to.node),
    );
    const image =
      images.find((e) => e.id === wired?.from.node) ??
      images.find(
        (e) => e.version === (deployment?.type === 'resource' ? deployment.version : 'v1'),
      ) ??
      images[0];
    graph.entities = graph.entities.filter((e) => !entries.some((old) => old.id === e.id));
    graph.entities.push(
      makeEntity('service', id, cluster.id, entry?.position ?? { x: 36, y: 215 }),
    );
    graph.entities = graph.entities.map((e) =>
      e.id === cluster.id
        ? {
            ...cluster,
            kubernetes: {
              ...defaultKubernetes,
              imageId: image?.id ?? '',
              replicas: deployment?.type === 'resource' ? deployment.replicas : 2,
            },
          }
        : e,
    );
  }
  graph.entities = graph.entities
    .filter((e) => e.kind !== 'deployment')
    .map((e) =>
      e.type === 'resource' && e.kind === 'pod'
        ? {
            ...e,
            ports: e.ports.filter((p) => p.material !== 'image' && p.material !== 'control'),
          }
        : e,
    );
  const wires = graph.connections;
  graph.connections = [];
  for (const edge of wires) {
    const next = connection(
      edge.from.node,
      edge.from.port,
      endpoints.get(edge.to.node) ?? edge.to.node,
      edge.to.port,
    );
    if (!manualConnectionIssue(graph, next)) graph.connections.push(next);
  }
  for (const cluster of graph.entities) {
    if (cluster.type !== 'system' || !cluster.kubernetes?.imageId) continue;
    const image = graph.entities.find((e) => e.id === cluster.kubernetes?.imageId);
    const port =
      image?.type === 'resource'
        ? image.ports.find((p) => p.direction === 'out' && p.material === 'image')
        : undefined;
    const input = cluster.ports?.[0];
    if (!image || !port || !input) continue;
    const wire = connection(image.id, port.id, cluster.id, input.id);
    if (!manualConnectionIssue(graph, wire)) graph.connections.push(wire);
  }
  return true;
}
function migrateClusterPorts(graph: Graph): boolean {
  const endpoints = graph.entities.filter((e) => e.kind === 'service');
  if (!endpoints.some((e) => e.type === 'resource' && e.ports.some((p) => p.direction === 'out')))
    return false;
  const parents = new Map(endpoints.map((e) => [e.id, e.parent]));
  const wires = graph.connections;
  graph.entities = graph.entities.filter((e) => !parents.has(e.id));
  graph.connections = [];
  for (const edge of wires) {
    if (parents.has(edge.from.node)) continue;
    const next = connection(
      edge.from.node,
      edge.from.port,
      parents.get(edge.to.node) ?? edge.to.node,
      edge.to.port,
    );
    if (
      !manualConnectionIssue(graph, next) ||
      (next.to.port === 'in-request' && parents.has(edge.to.node))
    )
      graph.connections.push(next);
  }
  for (const cluster of graph.entities) {
    if (cluster.type !== 'system' || !cluster.kubernetes?.imageId) continue;
    const image = graph.entities.find(
      (e) => e.id === cluster.kubernetes?.imageId && e.kind === 'image',
    );
    const output =
      image?.type === 'resource'
        ? image.ports.find((p) => p.direction === 'out' && p.material === 'image')
        : undefined;
    const input = cluster.ports?.[0];
    if (!image || !output || !input) continue;
    const next = connection(image.id, output.id, cluster.id, input.id);
    if (!manualConnectionIssue(graph, next)) graph.connections.push(next);
  }
  return true;
}
function restoreServiceNodes(graph: Graph): boolean {
  let changed = false;
  const redirects = new Map<string, string>();
  for (const cluster of graph.entities.filter((e) => e.kind === 'kubernetes')) {
    const request = graph.connections.find(
      (edge) => edge.to.node === cluster.id && edge.to.port === 'in-request',
    );
    const service = graph.entities.find((e) => e.kind === 'service' && e.parent === cluster.id);
    if (!service && (request || cluster.id === 'kubernetes')) {
      const id = endpointId(cluster.id);
      if (graph.entities.some((e) => e.id === id)) fail();
      graph.entities.push(makeEntity('service', id, cluster.id, { x: 36, y: 215 }));
      changed = true;
    }
    if (request) redirects.set(cluster.id, service?.id ?? endpointId(cluster.id));
  }
  if (redirects.size) {
    graph.connections = graph.connections.map((edge) =>
      redirects.has(edge.to.node) && edge.to.port === 'in-request'
        ? connection(edge.from.node, edge.from.port, redirects.get(edge.to.node)!, 'in-request')
        : edge,
    );
    changed = true;
  }
  return changed;
}
function migrateModelSource(graph: Graph): boolean {
  const start = graph.entities.find(
    (entity) => entity.type === 'resource' && entity.kind === 'start',
  );
  if (start?.type !== 'resource') return false;
  const models = new Map(
    graph.entities.flatMap((entity) =>
      entity.type === 'resource' && entity.kind === 'model'
        ? [[entity.id, entity.version] as const]
        : [],
    ),
  );
  const connectedVersions = new Set(
    graph.connections.flatMap((edge) => {
      const version = models.get(edge.from.node);
      return version ? [version] : [];
    }),
  );
  const hasModelOutput = start.ports.some((port) => port.id === 'out-model');
  const version = hasModelOutput
    ? start.version
    : (connectedVersions.values().next().value ?? models.get('model') ?? start.version);
  graph.entities = graph.entities
    .filter((entity) => entity.kind !== 'model')
    .map((entity) =>
      entity.id === start.id && !hasModelOutput
        ? {
            ...start,
            version,
            ports: [
              ...start.ports,
              { id: 'out-model', material: 'model', direction: 'out', multiple: false },
            ],
          }
        : entity,
    );
  graph.connections = [
    ...new Map(
      graph.connections.map((edge) => {
        const next = models.has(edge.from.node)
          ? connection(start.id, 'out-model', edge.to.node, edge.to.port)
          : edge;
        return [next.id, next] as const;
      }),
    ).values(),
  ];
  return [...connectedVersions].every((oldVersion) => oldVersion === version);
}
function load() {
  try {
    const raw = globalThis.localStorage?.getItem(storageKey);
    return { saved: raw ? parseSaved(raw) : fresh(), blocked: false };
  } catch {
    return { saved: fresh(), blocked: true };
  }
}
interface Store {
  saved: Saved;
  blocked: boolean;
  warning: string;
  past: Graph[];
  future: Graph[];
  dispatch: (command: Command) => boolean;
  undo: () => void;
  redo: () => void;
  prove: (proof: string) => void;
  quiz: (correct: boolean) => void;
  recover: () => void;
}
const update = (saved: Saved, graph: Graph): Saved => ({
  ...saved,
  graph,
  proof: saved.proof && signature(graph) === saved.proof ? saved.proof : null,
});
export const useSystemLab = create<Store>()((set, get) => ({
  ...load(),
  past: [],
  future: [],
  warning: '',
  dispatch(command) {
    const { saved, past } = get();
    try {
      const graph = applyCommand(saved.graph, command);
      if (JSON.stringify(graph) === JSON.stringify(saved.graph) && command.type !== 'restore')
        return false;
      const next = update(saved, graph);
      if (command.type === 'restore') next.proof = null;
      set({ saved: next, past: [...past, saved.graph].slice(-50), future: [], warning: '' });
      return true;
    } catch (error) {
      set({ warning: (error as Error).message });
      return false;
    }
  },
  undo() {
    const { saved, past, future } = get();
    const graph = past.at(-1);
    if (graph)
      set({
        saved: update(saved, graph),
        past: past.slice(0, -1),
        future: [saved.graph, ...future],
        warning: '',
      });
  },
  redo() {
    const { saved, past, future } = get();
    const graph = future[0];
    if (graph)
      set({
        saved: update(saved, graph),
        past: [...past, saved.graph].slice(-50),
        future: future.slice(1),
        warning: '',
      });
  },
  prove(proof) {
    const { saved } = get();
    if (proof === signature(saved.graph)) set({ saved: { ...saved, proof } });
  },
  quiz(correct) {
    set(({ saved }) => ({ saved: { ...saved, quiz: correct } }));
  },
  recover() {
    set({ blocked: false, saved: fresh(), past: [], future: [], warning: '' });
  },
}));
useSystemLab.subscribe((state, previous) => {
  if (state.blocked || state.saved === previous.saved) return;
  try {
    globalThis.localStorage?.setItem(storageKey, JSON.stringify(state.saved));
  } catch {
    if (!state.warning)
      useSystemLab.setState({
        warning: '저장하지 못했습니다. 현재 탭에서는 계속 편집할 수 있습니다.',
      });
  }
});
export function useLessonCompletion(data: LearningData) {
  const pilot = useSystemLab((state) => !!state.saved.proof && state.saved.quiz);
  return (id: string) => (id === pilotLesson ? pilot : !!data.lessons[id]?.completed);
}
