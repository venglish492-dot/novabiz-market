'use client';

import { createContext, useCallback, useContext, useTransition, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { track } from '@/lib/client/analytics';

interface CatalogNav {
  pending: boolean;
  params: URLSearchParams;
  /** Update one or more params (null removes). Keeps scroll position. */
  update: (changes: Record<string, string | string[] | null>) => void;
  reset: (keep?: string[]) => void;
}

const CatalogContext = createContext<CatalogNav | null>(null);

/**
 * Owns URL-driven catalog state. Filter controls call `update`; results are
 * server-rendered from the URL, so every state is shareable and indexable.
 */
export function CatalogShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const navigate = useCallback(
    (next: URLSearchParams) => {
      const query = next.toString();
      startTransition(() => {
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
      });
    },
    [pathname, router],
  );

  const update = useCallback(
    (changes: Record<string, string | string[] | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(changes)) {
        next.delete(key);
        if (value === null) continue;
        for (const item of Array.isArray(value) ? value : [value]) if (item) next.append(key, item);
      }
      track('filter', { props: { keys: Object.keys(changes).join(',') } });
      navigate(next);
    },
    [navigate, searchParams],
  );

  const reset = useCallback(
    (keep: string[] = ['q']) => {
      const next = new URLSearchParams();
      for (const key of keep) {
        const value = searchParams.get(key);
        if (value) next.set(key, value);
      }
      navigate(next);
    },
    [navigate, searchParams],
  );

  return (
    <CatalogContext.Provider value={{ pending, params: new URLSearchParams(searchParams.toString()), update, reset }}>
      {children}
    </CatalogContext.Provider>
  );
}

export function useCatalogNav(): CatalogNav {
  const value = useContext(CatalogContext);
  if (!value) throw new Error('useCatalogNav must be used inside <CatalogShell>');
  return value;
}

/** Dims server-rendered results while a new filter state loads. */
export function CatalogResultsRegion({ children }: { children: ReactNode }) {
  const { pending } = useCatalogNav();
  return (
    <div aria-busy={pending} className={`transition-opacity duration-200 ${pending ? 'pointer-events-none opacity-50' : 'opacity-100'}`}>
      {children}
    </div>
  );
}
