import { create } from 'zustand';
export type Theme = 'system' | 'light' | 'dark';
/** 실습 실행에서 노드 하나를 처리하는 데 걸리는 시간. */
export type RunSpeed = 'fast' | 'normal' | 'slow' | 'slower';
export const runSpeeds: Record<RunSpeed, { label: string; ms: number }> = {
  fast: { label: '빠르게', ms: 270 },
  normal: { label: '보통', ms: 700 },
  slow: { label: '느리게', ms: 1400 },
  slower: { label: '아주 느리게', ms: 2500 },
};
interface Preferences {
  theme: Theme;
  tour: 'new' | 'done' | 'skipped';
  runSpeed: RunSpeed;
  warning: string;
  setTheme: (theme: Theme) => void;
  setRunSpeed: (speed: RunSpeed) => void;
  setTour: (tour: Preferences['tour']) => void;
}
export const preferencesKey = 'blockml:preferences:v1';
function load(): Pick<Preferences, 'theme' | 'tour' | 'runSpeed' | 'warning'> {
  try {
    const saved = JSON.parse(localStorage.getItem(preferencesKey) ?? '{}');
    return {
      theme: ['light', 'dark', 'system'].includes(saved.theme) ? saved.theme : 'system',
      tour: ['done', 'skipped'].includes(saved.tour) ? saved.tour : 'new',
      runSpeed: saved.runSpeed in runSpeeds ? saved.runSpeed : 'normal',
      warning: '',
    };
  } catch {
    return {
      theme: 'system',
      tour: 'new',
      runSpeed: 'normal',
      warning: '설정을 읽지 못했습니다. 새 선택 전까지 원본을 유지합니다.',
    };
  }
}
export const usePreferences = create<Preferences>()((set) => ({
  ...(typeof localStorage === 'undefined'
    ? { theme: 'system' as const, tour: 'new' as const, runSpeed: 'normal' as const, warning: '' }
    : load()),
  setTheme: (theme) => set({ theme, warning: '' }),
  setTour: (tour) => set({ tour, warning: '' }),
  setRunSpeed: (runSpeed) => set({ runSpeed, warning: '' }),
}));
usePreferences.subscribe((state, previous) => {
  if (
    state.theme === previous.theme &&
    state.tour === previous.tour &&
    state.runSpeed === previous.runSpeed
  )
    return;
  try {
    localStorage.setItem(
      preferencesKey,
      JSON.stringify({ theme: state.theme, tour: state.tour, runSpeed: state.runSpeed }),
    );
  } catch {
    usePreferences.setState({ warning: '사용자 설정 저장 실패 · 현재 선택은 유지됩니다.' });
  }
});
