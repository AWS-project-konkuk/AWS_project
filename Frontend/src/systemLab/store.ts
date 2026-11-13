import { create } from 'zustand';
import { applyCommand, type Command } from './commands';
import {
  connection,
  connectionIssue,
  definition,
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
} from './model';
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
          !(portTypes[kind][p.direction] as readonly string[]).includes(p.material)
        )
          return fail();
        ports.add(p.id);
      }
    }
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
    if (required.has(item.id) && item.type === 'resource') restoreMissing(item);
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
          !(current.kind === 'model' && parent.kind !== 'ec2'))
      )
        return fail();
      seen.add(current.id);
      current = parent;
    }
  }
  const graph: Graph = { entities, connections: [] };
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
    if (connectionIssue(graph, edge)) return fail();
    graph.connections.push(edge);
  }
  const previousSignature = signature(graph);
  const compatibleModels = migrateModelSource(graph);
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
    proof: compatibleModels && saved.proof === previousSignature ? signature(graph) : null,
  };
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
