import { createContext, useContext } from 'react';

/**
 * Also hard-coded in the boot script in index.html. That script has to run
 * before the bundle loads (otherwise the page paints dark then flips), so it
 * cannot import this module — keep the two literals in sync.
 */
export const THEME_STORAGE_KEY = 'netcal-theme';

export const ThemeContext = createContext(null);

/** Reads an explicit user choice, or null if they have never picked one. */
export function readStoredTheme() {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : null;
  } catch {
    // Private windows and "block site data" throw on access, not just on write.
    return null;
  }
}

export function getSystemTheme() {
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

/**
 * The boot script has already resolved a theme and written it to <html>, so
 * prefer that — it keeps React from disagreeing with what is on screen.
 */
export function resolveInitialTheme() {
  const applied = document.documentElement.getAttribute('data-theme');
  if (applied === 'light' || applied === 'dark') return applied;
  return readStoredTheme() ?? getSystemTheme();
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside a ThemeProvider');
  return context;
}
