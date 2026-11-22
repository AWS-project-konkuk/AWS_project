import { create } from 'zustand';
import type { Graph } from '../systemLab/lab';
import { readWorkflow } from './workflow';

/** 브라우저에 저장해 둔 내 Playground 한 건. */
export interface SavedPlayground {
  id: string;
  name: string;
  updatedAt: number;
  graph: Graph;
}

export const libraryKey = 'blockml:playground:library:v1';
export const libraryLimit = 30;

/** 저장된 값에서 읽을 수 있는 항목만 고른다. 깨진 항목은 버린다. */
export function parseLibrary(raw: string | null): SavedPlayground[] {
  if (!raw) return [];
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return [];
  }
  const items = value && typeof value === 'object' && 'items' in value ? value.items : null;
  if (!Array.isArray(items)) return [];
  return items.flatMap((item: unknown) => {
    if (!item || typeof item !== 'object') return [];
    const { id, name, updatedAt, graph } = item as Record<string, unknown>;
    if (typeof id !== 'string' || typeof name !== 'string' || typeof updatedAt !== 'number')
      return [];
    try {
      return [{ id, name, updatedAt, graph: readWorkflow({ version: 2, graph }).graph }];
    } catch {
      return [];
    }
  });
}

const read = () => {
  try {
    return parseLibrary(globalThis.localStorage?.getItem(libraryKey) ?? null);
  } catch {
    return [];
  }
};

const newId = () => 'pg-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

/** 같은 이름이 있으면 "이름 (2)"처럼 번호를 붙인다. */
export function uniqueName(name: string, items: SavedPlayground[], exceptId?: string) {
  const taken = new Set(items.filter((item) => item.id !== exceptId).map((item) => item.name));
  const base = name.trim() || '내 Playground';
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(base + ' (' + n + ')')) n++;
  return base + ' (' + n + ')';
}

interface Library {
  items: SavedPlayground[];
  /** 지금 캔버스에 열어 둔 저장 항목. 저장하면 이 항목을 덮어쓴다. */
  openId: string | null;
  warning: string;
  /** 새 항목으로 저장한다. 한도를 넘으면 저장하지 않고 false를 돌려준다. */
  saveAs: (name: string, graph: Graph) => string | null;
  /** 열어 둔 항목을 현재 구성으로 덮어쓴다. */
  overwrite: (id: string, graph: Graph) => void;
  rename: (id: string, name: string) => void;
  duplicate: (id: string) => void;
  remove: (id: string) => void;
  open: (id: string | null) => void;
}

export const usePlaygroundLibrary = create<Library>()((set, get) => {
  const commit = (items: SavedPlayground[], extra: Partial<Library> = {}) => {
    set({ items, warning: '', ...extra });
  };
  return {
    items: read(),
    openId: null,
    warning: '',
    saveAs(name, graph) {
      const { items } = get();
      if (items.length >= libraryLimit) {
        set({ warning: '저장은 ' + libraryLimit + '개까지 가능합니다. 하나를 삭제해 주세요.' });
        return null;
      }
      const id = newId();
      const item = {
        id,
        name: uniqueName(name, items),
        updatedAt: Date.now(),
        graph: structuredClone(graph),
      };
      commit([item, ...items], { openId: id });
      return id;
    },
    overwrite(id, graph) {
      commit(
        get().items.map((item) =>
          item.id === id ? { ...item, updatedAt: Date.now(), graph: structuredClone(graph) } : item,
        ),
      );
    },
    rename(id, name) {
      const { items } = get();
      commit(
        items.map((item) =>
          item.id === id ? { ...item, name: uniqueName(name, items, id) } : item,
        ),
      );
    },
    duplicate(id) {
      const { items } = get();
      const source = items.find((item) => item.id === id);
      if (!source) return;
      if (items.length >= libraryLimit) {
        set({ warning: '저장은 ' + libraryLimit + '개까지 가능합니다. 하나를 삭제해 주세요.' });
        return;
      }
      const copy = {
        ...source,
        id: newId(),
        name: uniqueName(source.name + ' 복사본', items),
        updatedAt: Date.now(),
        graph: structuredClone(source.graph),
      };
      commit([copy, ...items]);
    },
    remove(id) {
      const { items, openId } = get();
      commit(
        items.filter((item) => item.id !== id),
        { openId: openId === id ? null : openId },
      );
    },
    open(id) {
      set({ openId: id });
    },
  };
});

usePlaygroundLibrary.subscribe((state, previous) => {
  if (state.items === previous.items) return;
  try {
    globalThis.localStorage?.setItem(
      libraryKey,
      JSON.stringify({ version: 1, items: state.items }),
    );
  } catch {
    usePlaygroundLibrary.setState({
      warning: '저장하지 못했습니다. 브라우저 저장 공간을 확인해 주세요.',
    });
  }
});
