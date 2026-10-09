'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { ProductSummary } from '@/lib/catalog/summary';

interface UIState {
  paletteOpen: boolean;
  openPalette: () => void;
  closePalette: () => void;
  quickView: ProductSummary | null;
  openQuickView: (product: ProductSummary) => void;
  closeQuickView: () => void;
}

const UIContext = createContext<UIState | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [quickView, setQuickView] = useState<ProductSummary | null>(null);

  const openPalette = useCallback(() => setPaletteOpen(true), []);
  const closePalette = useCallback(() => setPaletteOpen(false), []);
  const openQuickView = useCallback((product: ProductSummary) => setQuickView(product), []);
  const closeQuickView = useCallback(() => setQuickView(null), []);

  // Cmd/Ctrl + K opens the command palette from anywhere.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const value = useMemo(
    () => ({ paletteOpen, openPalette, closePalette, quickView, openQuickView, closeQuickView }),
    [paletteOpen, openPalette, closePalette, quickView, openQuickView, closeQuickView],
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI(): UIState {
  const value = useContext(UIContext);
  if (!value) throw new Error('useUI must be used inside <UIProvider>');
  return value;
}
