import { create } from 'zustand';
export type Theme = 'system' | 'light' | 'dark';
interface Preferences {
  theme: Theme;
  tour: 'new' | 'done' | 'skipped';
  warning: string;
  setTheme: (theme: Theme) => void;
  setTour: (tour: Preferences['tour']) => void;
}
export const preferencesKey = 'blockml:preferences:v1';
function load(): Pick<Preferences, 'theme' | 'tour' | 'warning'> {
  try {
    const saved = JSON.parse(localStorage.getItem(preferencesKey) ?? '{}');
    return {
      theme: ['light', 'dark', 'system'].includes(saved.theme) ? saved.theme : 'system',
      tour: ['done', 'skipped'].includes(saved.tour) ? saved.tour : 'new',
      warning: '',
    };
  } catch {
    return {
      theme: 'system',
      tour: 'new',
      warning: '설정을 읽지 못했습니다. 새 선택 전까지 원본을 유지합니다.',
    };
  }
}
export const usePreferences = create<Preferences>()((set) => ({
  ...(typeof localStorage === 'undefined'
    ? { theme: 'system' as const, tour: 'new' as const, warning: '' }
    : load()),
  setTheme: (theme) => set({ theme, warning: '' }),
  setTour: (tour) => set({ tour, warning: '' }),
}));
usePreferences.subscribe((state, previous) => {
  if (state.theme === previous.theme && state.tour === previous.tour) return;
  try {
    localStorage.setItem(preferencesKey, JSON.stringify({ theme: state.theme, tour: state.tour }));
  } catch {
    usePreferences.setState({ warning: '사용자 설정 저장 실패 · 현재 선택은 유지됩니다.' });
  }
});
