import { create } from 'zustand';
import type { Dispatch, SetStateAction } from 'react';
import { emptyPlayground, parsePlayground, playgroundKey, type PlaygroundData } from './model';
function initial() {
  try {
    const raw = typeof localStorage === 'undefined' ? null : localStorage.getItem(playgroundKey);
    return {
      data: raw ? parsePlayground(raw) : emptyPlayground(),
      blocked: false,
      status: 'Playground 자동 저장',
    };
  } catch {
    return {
      data: emptyPlayground(),
      blocked: true,
      status: '저장 데이터를 읽지 못했습니다. 원본을 보존합니다.',
    };
  }
}
interface State {
  data: PlaygroundData;
  blocked: boolean;
  status: string;
  setData: Dispatch<SetStateAction<PlaygroundData>>;
  reset: () => void;
}
export const usePlaygroundStore = create<State>()((set) => ({
  ...initial(),
  setData: (change) =>
    set((s) => ({ data: typeof change === 'function' ? change(s.data) : change })),
  reset: () => {
    if (confirm('Playground의 노드와 연결을 초기화할까요? 학습 진행은 유지됩니다.'))
      set({ data: emptyPlayground(), blocked: false });
  },
}));
let timer: ReturnType<typeof setTimeout>;
usePlaygroundStore.subscribe((s, previous) => {
  if (s.blocked || s.data === previous.data || typeof localStorage === 'undefined') return;
  clearTimeout(timer);
  timer = setTimeout(() => {
    try {
      localStorage.setItem(playgroundKey, JSON.stringify(s.data));
      usePlaygroundStore.setState({ status: 'Playground 저장됨' });
    } catch {
      usePlaygroundStore.setState({ status: '저장 실패 · 편집은 계속할 수 있습니다.' });
    }
  }, 300);
});
export function usePlayground() {
  return usePlaygroundStore();
}
