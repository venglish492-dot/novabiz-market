'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'dark' | 'light' | 'neon';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('novabiz-theme') as ThemeMode;
    if (savedTheme && (savedTheme === 'dark' || savedTheme === 'light' || savedTheme === 'neon')) {
      setThemeState(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
      document.documentElement.classList.remove('theme-dark', 'theme-light', 'theme-neon');
      document.documentElement.classList.add(`theme-${savedTheme}`);
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('theme-dark');
    }
  }, []);

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    localStorage.setItem('novabiz-theme', mode);
    document.documentElement.setAttribute('data-theme', mode);
    document.documentElement.classList.remove('theme-dark', 'theme-light', 'theme-neon');
    document.documentElement.classList.add(`theme-${mode}`);
  };

  const toggleTheme = () => {
    const nextTheme: ThemeMode = theme === 'dark' ? 'neon' : theme === 'neon' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
