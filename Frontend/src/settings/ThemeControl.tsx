import { useEffect } from 'react';
import { usePreferences, type Theme } from './preferences';
export function ThemeControl() {
  const theme = usePreferences((s) => s.theme);
  const setTheme = usePreferences((s) => s.setTheme);
  const warning = usePreferences((s) => s.warning);
  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      document.documentElement.dataset.theme =
        theme === 'system' ? (media.matches ? 'dark' : 'light') : theme;
      document.documentElement.style.colorScheme = document.documentElement.dataset.theme;
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);
  return (
    <label className="theme-control">
      <span className="sr-only">화면 테마</span>
      <select
        aria-label="화면 테마"
        value={theme}
        onChange={(e) => setTheme(e.target.value as Theme)}
      >
        <option value="system">시스템 설정</option>
        <option value="light">라이트</option>
        <option value="dark">다크</option>
      </select>
      {warning && <small role="status">{warning}</small>}
    </label>
  );
}
