/**
 * Hook for initializing and managing the application color theme.
 * Reads from localStorage on mount, falls back to prefers-color-scheme,
 * and applies the 'dark' class to the document root.
 */

import { useEffect } from 'react';
import { useAppStore } from '../store';

const STORAGE_KEY = 'claude-manager-theme';

/**
 * Initializes the theme from localStorage or system preference,
 * and keeps the document's `dark` class in sync with the store.
 * Call this once at the app root.
 */
export function useTheme(): void {
  const { theme, setTheme } = useAppStore();

  // On mount: read stored preference or detect system preference
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') {
      setTheme(stored);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Apply the class and persist whenever theme changes
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);
}
