'use client';

/**
 * A tiny external store backed by localStorage, designed for
 * `useSyncExternalStore`: the server snapshot is always the fallback, so
 * hydration never mismatches; the client snapshot is read lazily.
 * Used only for non-critical convenience state (guest cart, wishlist).
 */
export interface PersistentStore<T> {
  getSnapshot: () => T;
  getServerSnapshot: () => T;
  subscribe: (listener: () => void) => () => void;
  set: (next: T | ((previous: T) => T)) => void;
}

export function createPersistentStore<T>(key: string, fallback: T, validate: (value: unknown) => T): PersistentStore<T> {
  let state = fallback;
  let loaded = false;
  const listeners = new Set<() => void>();

  const load = () => {
    if (loaded || typeof window === 'undefined') return;
    loaded = true;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) state = validate(JSON.parse(raw));
    } catch {
      state = fallback;
    }
  };

  const emit = () => listeners.forEach((listener) => listener());

  return {
    getSnapshot() {
      load();
      return state;
    },
    getServerSnapshot() {
      return fallback;
    },
    subscribe(listener) {
      listeners.add(listener);
      const onStorage = (event: StorageEvent) => {
        if (event.key !== key) return;
        loaded = false;
        load();
        emit();
      };
      window.addEventListener('storage', onStorage);
      return () => {
        listeners.delete(listener);
        window.removeEventListener('storage', onStorage);
      };
    },
    set(next) {
      load();
      state = typeof next === 'function' ? (next as (previous: T) => T)(state) : next;
      try {
        window.localStorage.setItem(key, JSON.stringify(state));
      } catch {
        // Storage may be unavailable (private mode, quota); state still updates in memory.
      }
      emit();
    },
  };
}
