import { create } from 'zustand';
export type Theme = 'system' | 'light' | 'dark';
/** 실습 실행 속도 단계. 1은 가장 느리고 10은 가장 빠르다. */
export const runSpeedLevels = { min: 1, max: 10, initial: 5 } as const;
/** 속도 단계를 노드 하나를 처리하는 시간(ms)으로 바꾼다. 3초에서 0.15초까지 지수로 줄어든다. */
export const stepDelay = (level: number) => Math.round(3000 * 0.05 ** ((level - 1) / 9));
const validSpeed = (value: unknown): value is number =>
  Number.isInteger(value) &&
  (value as number) >= runSpeedLevels.min &&
  (value as number) <= runSpeedLevels.max;
interface Preferences {
  theme: Theme;
  tour: 'new' | 'done' | 'skipped';
  runSpeed: number;
  warning: string;
  setTheme: (theme: Theme) => void;
  setRunSpeed: (speed: number) => void;
  setTour: (tour: Preferences['tour']) => void;
}
export const preferencesKey = 'blockml:preferences:v1';
function load(): Pick<Preferences, 'theme' | 'tour' | 'runSpeed' | 'warning'> {
  try {
    const saved = JSON.parse(localStorage.getItem(preferencesKey) ?? '{}');
    return {
      theme: ['light', 'dark', 'system'].includes(saved.theme) ? saved.theme : 'system',
      tour: ['done', 'skipped'].includes(saved.tour) ? saved.tour : 'new',
      runSpeed: validSpeed(saved.runSpeed) ? saved.runSpeed : runSpeedLevels.initial,
      warning: '',
    };
  } catch {
    return {
      theme: 'system',
      tour: 'new',
      runSpeed: runSpeedLevels.initial,
      warning: '설정을 읽지 못했습니다. 새 선택 전까지 원본을 유지합니다.',
    };
  }
}
export const usePreferences = create<Preferences>()((set) => ({
  ...(typeof localStorage === 'undefined'
    ? {
        theme: 'system' as const,
        tour: 'new' as const,
        runSpeed: runSpeedLevels.initial as number,
        warning: '',
      }
    : load()),
  setTheme: (theme) => set({ theme, warning: '' }),
  setTour: (tour) => set({ tour, warning: '' }),
  setRunSpeed: (level) =>
    set({
      runSpeed: Math.min(runSpeedLevels.max, Math.max(runSpeedLevels.min, Math.round(level))),
      warning: '',
    }),
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
