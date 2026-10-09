'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CornerDownLeft, Folder, History, Library, Search, ShoppingBag, User, X } from 'lucide-react';
import { useI18n } from '@/i18n/client';
import { interpolate } from '@/i18n/config';
import { Dialog } from '@/components/ui/Dialog';
import { useUI } from '@/components/providers/UIProvider';
import { useCart } from '@/components/providers/CommerceProvider';
import { useSession } from '@/components/providers/SessionProvider';
import { createPersistentStore } from '@/lib/client/persistent-store';
import { track } from '@/lib/client/analytics';

interface SearchResponse {
  products: Array<{ slug: string; title: string; subtitle: string; price: string; formats: string[] }>;
  categories: Array<{ slug: string; name: string }>;
  total: number;
}

type Item = {
  id: string;
  group: 'recent' | 'products' | 'categories' | 'actions';
  label: string;
  detail?: string;
  meta?: string;
  icon: React.ReactNode;
  run: () => void;
};

const recentStore = createPersistentStore<string[]>('vl-recent-searches', [], (value) =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string').slice(0, 5) : [],
);

const SUGGESTIONS = { ru: ['Notion', 'Финмодель', 'Питч-дек', 'Юнит-экономика', 'CRM'], en: ['Notion', 'Financial model', 'Pitch deck', 'Unit economics', 'CRM'] };

export function CommandPalette() {
  const { paletteOpen, closePalette } = useUI();
  const { t } = useI18n();
  return (
    <Dialog open={paletteOpen} onClose={closePalette} label={t.search.label} variant="palette">
      <PaletteBody onClose={closePalette} />
    </Dialog>
  );
}

function PaletteBody({ onClose }: { onClose: () => void }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const cart = useCart();
  const { user, accountsEnabled } = useSession();
  const recent = useSyncExternalStore(recentStore.subscribe, recentStore.getSnapshot, recentStore.getServerSnapshot);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();
  const listRef = useRef<HTMLUListElement>(null);

  const go = useCallback(
    (href: string) => {
      onClose();
      router.push(href);
    },
    [onClose, router],
  );

  const remember = useCallback((value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    recentStore.set((list) => [trimmed, ...list.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())].slice(0, 5));
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (!q) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        if (response.ok) {
          setResults((await response.json()) as SearchResponse);
          setActive(0);
          track('search', { props: { length: q.length } });
        }
      } catch {
        // Aborted or offline — keep previous results.
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 140);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  const items = useMemo<Item[]>(() => {
    const q = query.trim();
    const list: Item[] = [];
    if (!q) {
      for (const term of recent) {
        list.push({ id: `recent-${term}`, group: 'recent', label: term, icon: <History className="h-4 w-4" />, run: () => setQuery(term) });
      }
    } else if (results) {
      for (const product of results.products) {
        list.push({
          id: `product-${product.slug}`,
          group: 'products',
          label: product.title,
          detail: product.subtitle,
          meta: product.price,
          icon: <span className="t-mono text-[9px] font-medium tracking-wider">{product.formats[0] ?? '·'}</span>,
          run: () => {
            remember(q);
            go(`/products/${product.slug}`);
          },
        });
      }
      for (const category of results.categories) {
        list.push({
          id: `category-${category.slug}`,
          group: 'categories',
          label: category.name,
          icon: <Folder className="h-4 w-4" />,
          run: () => go(`/categories/${category.slug}`),
        });
      }
      list.push({
        id: 'search-all',
        group: 'actions',
        label: interpolate(t.search.searchFor, { query: q }),
        icon: <Search className="h-4 w-4" />,
        run: () => {
          remember(q);
          go(`/search?q=${encodeURIComponent(q)}`);
        },
      });
    }
    if (!q) {
      list.push(
        { id: 'a-products', group: 'actions', label: t.search.browseProducts, icon: <ArrowRight className="h-4 w-4" />, run: () => go('/products') },
        { id: 'a-categories', group: 'actions', label: t.search.browseCategories, icon: <Folder className="h-4 w-4" />, run: () => go('/categories') },
        {
          id: 'a-cart',
          group: 'actions',
          label: t.search.openCart,
          icon: <ShoppingBag className="h-4 w-4" />,
          run: () => {
            onClose();
            cart.open();
          },
        },
      );
      if (user || accountsEnabled) {
        list.push(
          { id: 'a-library', group: 'actions', label: t.search.openLibrary, icon: <Library className="h-4 w-4" />, run: () => go('/library') },
          { id: 'a-account', group: 'actions', label: t.search.openAccount, icon: <User className="h-4 w-4" />, run: () => go('/account') },
        );
      }
    }
    return list;
  }, [query, results, recent, t, go, remember, onClose, cart, user, accountsEnabled]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((index) => Math.min(items.length - 1, index + 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((index) => Math.max(0, index - 1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const item = items[active];
      if (item) item.run();
      else if (query.trim()) go(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const groupLabel: Record<Item['group'], string> = {
    recent: t.search.recent,
    products: t.search.productsGroup,
    categories: t.search.categoriesGroup,
    actions: t.search.actionsGroup,
  };

  const showEmpty = query.trim() && results && !loading && results.products.length === 0 && results.categories.length === 0;

  return (
    <div className="flex max-h-[min(640px,80dvh)] flex-col" onKeyDown={onKeyDown}>
      <div className="flex items-center gap-3 border-b border-line px-4">
        <Search className="h-5 w-5 shrink-0 text-fg-subtle" aria-hidden />
        <input
          autoFocus
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-activedescendant={items[active] ? `${listId}-${active}` : undefined}
          aria-autocomplete="list"
          aria-label={t.search.label}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            if (!event.target.value.trim()) setResults(null);
          }}
          placeholder={t.search.placeholder}
          className="h-14 min-w-0 flex-1 bg-transparent text-[15px] text-fg outline-none placeholder:text-fg-subtle"
          spellCheck={false}
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setResults(null);
            }}
            className="rounded-md p-1.5 text-fg-subtle hover:bg-surface-2 hover:text-fg"
            aria-label={t.search.clear}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        )}
        <kbd className="t-mono hidden rounded-md border border-line px-1.5 py-0.5 text-[10px] text-fg-subtle sm:block">ESC</kbd>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {!query.trim() && (
          <div className="px-2 pb-1 pt-2">
            <p className="t-eyebrow mb-2.5">{t.search.suggestions}</p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS[locale].map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => setQuery(term)}
                  className="rounded-full border border-line px-3 py-1 text-xs text-fg-muted hover:border-line-strong hover:text-fg"
                >
                  {term}
                </button>
              ))}
            </div>
            {recent.length > 0 && (
              <button type="button" onClick={() => recentStore.set([])} className="mt-3 text-xs text-fg-subtle hover:text-fg">
                {t.search.clearRecent}
              </button>
            )}
          </div>
        )}

        {showEmpty && (
          <div className="px-4 py-8 text-center">
            <p className="text-sm font-medium text-fg">{interpolate(t.search.noResults, { query: query.trim() })}</p>
            <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-fg-muted">{t.search.noResultsHint}</p>
          </div>
        )}

        <ul ref={listRef} id={listId} role="listbox" aria-label={t.search.label} className="flex flex-col">
          {items.map((item, index) => {
            const startsGroup = index === 0 || items[index - 1].group !== item.group;
            return (
              <li key={item.id} role="presentation">
                {startsGroup && <p className="t-eyebrow px-3 pb-2 pt-4">{groupLabel[item.group]}</p>}
                <div
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={index === active}
                  data-index={index}
                  onMouseMove={() => setActive(index)}
                  onClick={item.run}
                  className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 aria-selected:bg-surface-2"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-2 text-fg-muted">
                    {item.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-fg">{item.label}</span>
                    {item.detail && <span className="block truncate text-xs text-fg-subtle">{item.detail}</span>}
                  </span>
                  {item.meta && <span className="shrink-0 text-xs tabular-nums text-fg-muted">{item.meta}</span>}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="hidden items-center gap-4 border-t border-line px-4 py-2.5 text-[11px] text-fg-subtle sm:flex">
        <span className="flex items-center gap-1.5">
          <kbd className="t-mono rounded border border-line px-1">↑↓</kbd> {t.search.hintNavigate}
        </span>
        <span className="flex items-center gap-1.5">
          <CornerDownLeft className="h-3 w-3" aria-hidden /> {t.search.hintOpen}
        </span>
        <span className="flex items-center gap-1.5">
          <kbd className="t-mono rounded border border-line px-1">esc</kbd> {t.search.hintClose}
        </span>
        {loading && <span className="ml-auto">{t.common.loading}</span>}
      </div>
    </div>
  );
}
