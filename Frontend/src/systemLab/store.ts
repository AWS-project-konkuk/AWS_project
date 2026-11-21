import { create } from 'zustand';
import { applyCommand, type Command } from './commands';
import {
  connection,
  connectionIssue,
  defaultSettings,
  hasRunState,
  isComplete,
  isSystemKind,
  protectedKind,
  requiredLabEntities,
  rootId,
  settingIssue,
  signature,
  type Connection,
  type Entity,
  type Graph,
  type Kind,
  type LabConfig,
} from './lab';
import { labConfigs } from './labs';
import { week2Lab } from './labs/week2';
import { runLab } from './engine';
import type { LearningData } from '../curriculum/types';

export const storageKey = week2Lab.storageKey;
interface Saved {
  version: 1;
  graph: Graph;
  quiz: boolean;
  proof: string | null;
  /** 실행에서 관찰한 조건. 위치 변경이나 확대로 지워지지 않는다. */
  observed: string[];
}
const fresh = (lab: LabConfig): Saved => ({
  version: 1,
  graph: lab.initial(),
  quiz: false,
  proof: null,
  observed: [],
});
const fail = () => {
  throw new Error('실습 저장 데이터를 읽을 수 없습니다.');
};
const record = (x: unknown): x is Record<string, unknown> =>
  !!x && typeof x === 'object' && !Array.isArray(x);
const number = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);
export function parseSaved(raw: string, lab: LabConfig = week2Lab): Saved {
  const saved: unknown = JSON.parse(raw);
  if (
    !record(saved) ||
    saved.version !== 1 ||
    typeof saved.quiz !== 'boolean' ||
    !(saved.proof === null || typeof saved.proof === 'string') ||
    !record(saved.graph) ||
    !Array.isArray(saved.graph.entities) ||
    !Array.isArray(saved.graph.connections) ||
    (saved.observed !== undefined &&
      !(Array.isArray(saved.observed) && saved.observed.every((tag) => typeof tag === 'string')))
  )
    return fail();
  const persistence = lab.persistence;
  const base = lab.initial();
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
      !Object.hasOwn(lab.labels, item.kind) ||
      typeof item.parent !== 'string' ||
      (item.enabled !== undefined && typeof item.enabled !== 'boolean') ||
      !record(item.position) ||
      !number(item.position.x) ||
      !number(item.position.y)
    )
      return fail();
    const kind = item.kind as Kind;
    if (hasRunState(lab, kind) && typeof item.enabled !== 'boolean') return fail();
    if (isSystemKind(lab, kind)) {
      if (
        item.type !== 'system' ||
        !number(item.width) ||
        !number(item.height) ||
        item.width < 0 ||
        item.height < 0
      )
        return fail();
    } else {
      if (item.type !== 'resource' || !Array.isArray(item.ports)) return fail();
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
          !persistence.allowsPort(lab, kind, p.direction, p.material)
        )
          return fail();
        ports.add(p.id);
      }
    }
    if (!persistence.validateEntity(item, kind)) return fail();
    if (item.settings !== undefined) {
      const specs = lab.settingSpecs[kind] ?? [];
      if (!record(item.settings)) return fail();
      for (const [key, value] of Object.entries(item.settings)) {
        const spec = specs.find((candidate) => candidate.key === key);
        if (!spec || settingIssue(spec, value)) return fail();
      }
    }
    const entity = item as unknown as Entity;
    if (protectedKind(lab, kind)) {
      const fixed = base.entities.find((e) => e.kind === kind);
      if (!fixed || entity.id !== fixed.id) return fail();
      const restored = persistence.restoreFixed(entity, fixed);
      if (!restored) return fail();
      entities.push(restored);
    } else entities.push(entity);
    ids.add(entity.id);
  }
  if (!base.entities.filter((e) => protectedKind(lab, e.kind)).every((e) => ids.has(e.id)))
    return fail();
  const lookup = new Map(entities.map((e) => [e.id, e]));
  const required = requiredLabEntities(lab, base.entities);
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
        (!protectedKind(lab, current.kind) && !lab.canLoad(parent, current))
      )
        return fail();
      seen.add(current.id);
      current = parent;
    }
  }
  const graph: Graph = {
    entities: entities.map((entity) => {
      const normalized = persistence.normalizeEntity(entity);
      const defaults = defaultSettings(lab, normalized.kind);
      return defaults
        ? { ...normalized, settings: { ...defaults, ...normalized.settings } }
        : normalized;
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
  const { compatible, migrated } = persistence.migrate(lab, graph);
  // Old saves recorded an execution flag for resources that are applied automatically.
  graph.entities = graph.entities.map((entity) => {
    if (hasRunState(lab, entity.kind) || !Object.hasOwn(entity, 'enabled')) return entity;
    const normalized = { ...entity };
    delete normalized.enabled;
    return normalized;
  });
  return {
    version: 1,
    graph,
    quiz: saved.quiz,
    observed: (saved.observed as string[] | undefined) ?? [],
    proof:
      compatible &&
      saved.proof === previousSignature &&
      (!migrated || runLab(graph, 'migration', lab).success)
        ? signature(graph)
        : null,
  };
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
  observe: (tags: string[]) => void;
  recover: () => void;
}
const update = (saved: Saved, graph: Graph): Saved => ({
  ...saved,
  graph,
  proof: saved.proof && signature(graph) === saved.proof ? saved.proof : null,
});
/** 실습 설정마다 독립된 저장 키와 편집 기록을 가진 스토어를 만든다. */
export function createLabStore(lab: LabConfig) {
  const load = () => {
    try {
      const raw = globalThis.localStorage?.getItem(lab.storageKey);
      return { saved: raw ? parseSaved(raw, lab) : fresh(lab), blocked: false };
    } catch {
      return { saved: fresh(lab), blocked: true };
    }
  };
  const store = create<Store>()((set, get) => ({
    ...load(),
    past: [],
    future: [],
    warning: '',
    dispatch(command) {
      const { saved, past } = get();
      try {
        const graph = applyCommand(saved.graph, command, lab);
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
    observe(tags) {
      const { saved } = get();
      const observed = [...new Set([...saved.observed, ...tags])];
      if (observed.length !== saved.observed.length) set({ saved: { ...saved, observed } });
    },
    recover() {
      set({ blocked: false, saved: fresh(lab), past: [], future: [], warning: '' });
    },
  }));
  store.subscribe((state, previous) => {
    if (state.blocked || state.saved === previous.saved) return;
    try {
      globalThis.localStorage?.setItem(lab.storageKey, JSON.stringify(state.saved));
    } catch {
      if (!state.warning)
        store.setState({
          warning: '저장하지 못했습니다. 현재 탭에서는 계속 편집할 수 있습니다.',
        });
    }
  });
  return store;
}
type LabStore = ReturnType<typeof createLabStore>;
const stores = new Map<string, LabStore>();
export function labStore(lab: LabConfig): LabStore {
  let store = stores.get(lab.id);
  if (!store) {
    store = createLabStore(lab);
    stores.set(lab.id, store);
  }
  return store;
}
/** 1단원 실습의 스토어. 다른 실습은 `labStore(lab)`을 사용한다. */
export const useSystemLab = labStore(week2Lab);
const labList = Object.values(labConfigs);
export function useLessonCompletion(data: LearningData) {
  // 전환한 강의 수는 모듈이 정해 두므로 훅 호출 순서가 바뀌지 않는다.
  const done = labList.map((lab) => labStore(lab)((state) => isComplete(lab, state.saved)));
  return (id: string) => {
    const index = labList.findIndex((lab) => lab.id === id);
    return index >= 0 ? done[index] : !!data.lessons[id]?.completed;
  };
}
