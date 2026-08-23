import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  THEME_STORAGE_KEY,
  ThemeContext,
  readStoredTheme,
  resolveInitialTheme,
} from './context.js';

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(resolveInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);

    // Keep browser chrome in step. Read the value back off the token rather
    // than repeating the hex here, so the palette stays single-sourced.
    const meta = document.querySelector('meta[name="theme-color"]');
    const background = getComputedStyle(root).getPropertyValue('--bg-base').trim();
    if (meta && background) meta.setAttribute('content', background);
  }, [theme]);

  // Only an explicit choice is persisted. Writing on mount would make every
  // first-time visitor look like they had chosen, and permanently detach the
  // app from the OS setting below.
  const setTheme = useCallback((next) => {
    setThemeState(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Persistence is a convenience; the toggle still works this session.
    }
  }, []);

  // Track the OS until the user overrides it.
  useEffect(() => {
    const media = window.matchMedia?.('(prefers-color-scheme: light)');
    if (!media) return undefined;
    const handleChange = (event) => {
      if (readStoredTheme()) return;
      setThemeState(event.matches ? 'light' : 'dark');
    };
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }, [theme, setTheme]);

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, setTheme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
