import { SearchX } from 'lucide-react';
import type { Dictionary } from '@/i18n/dictionaries/ru';
import type { Locale } from '@/i18n/config';
import { plural } from '@/i18n/plural';
import type { BrowseResult } from '@/lib/catalog/browse';
import type { CatalogState } from '@/lib/catalog/params';
import { ProductCard, ProductGrid } from '@/components/products/ProductCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { CatalogResultsRegion, CatalogShell } from './CatalogShell';
import { CatalogFilters, SortSelect } from './CatalogFilters';
import { ResetFiltersButton } from './ResetFiltersButton';

/** Filters + toolbar + results grid. Server component with client islands. */
export function CatalogView({
  result,
  state,
  t,
  locale,
  hideCategory = false,
  emptyTitle,
  emptyBody,
}: {
  result: BrowseResult;
  state: CatalogState;
  t: Dictionary;
  locale: Locale;
  hideCategory?: boolean;
  emptyTitle?: string;
  emptyBody?: string;
}) {
  return (
    <CatalogShell>
      <div className="grid gap-8 lg:grid-cols-[240px_1fr] lg:gap-12">
        <aside className="lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:self-start lg:overflow-y-auto lg:pr-2">
          <CatalogFilters facets={result.facets} state={state.filters} activeCount={result.activeCount} hideCategory={hideCategory} />
        </aside>
        <div className="min-w-0">
          <div className="mb-6 flex items-center justify-between gap-4 border-b border-line pb-4">
            <p className="text-sm text-fg-muted" aria-live="polite">
              {plural(t.catalog.results, result.total, locale)}
            </p>
            <SortSelect value={state.sort} showRating={result.showRating} />
          </div>
          <CatalogResultsRegion>
            {result.results.length ? (
              <ProductGrid className="xl:!grid-cols-3">
                {result.results.map((product, index) => (
                  <ProductCard key={product.id} product={product} locale={locale} t={t} priority={index < 3} headingLevel={2} />
                ))}
              </ProductGrid>
            ) : (
              <EmptyState
                icon={<SearchX className="h-5 w-5" />}
                title={emptyTitle ?? t.catalog.emptyTitle}
                body={emptyBody ?? t.catalog.emptyBody}
                action={result.activeCount > 0 ? <ResetFiltersButton label={t.catalog.clearFilters} /> : undefined}
              />
            )}
          </CatalogResultsRegion>
        </div>
      </div>
    </CatalogShell>
  );
}
