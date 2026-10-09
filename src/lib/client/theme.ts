'use client';

import { useSyncExternalStore } from 'react';

import { THEME_STORAGE_KEY, type ThemeMode } from '@/lib/config/theme';

export type { ThemeMode } from '@/lib/config/theme';

function read(): ThemeMode {
  const value = document.documentElement.getAttribute('data-theme');
  return value === 'light' || value === 'neon' ? value : 'dark';
}

function subscribe(listener: () => void) {
  const observer = new MutationObserver(listener);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => observer.disconnect();
}

export function useTheme(): ThemeMode {
  return useSyncExternalStore(subscribe, read, () => 'dark');
}

export function setTheme(mode: ThemeMode) {
  document.documentElement.setAttribute('data-theme', mode);
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    // Preference simply won't persist.
  }
}
