import type { Category, FormatId, GoalId, LicenseTier, Product } from '../../types/index.ts';
import { activeFilterCount, type CatalogState } from './params.ts';
import { applyFilters, availableFacets, categoryTree, hasRatings, productsInCategory, sortProducts } from './queries.ts';
import { toProductSummary, type ProductSummary } from './summary.ts';
import type { LocalizedText } from '../../i18n/config.ts';

export interface BrowseResult {
  results: ProductSummary[];
  total: number;
  facets: {
    categories: Array<{ id: string; name: LocalizedText; count: number }>;
    formats: Array<{ id: FormatId; count: number }>;
    software: Array<{ name: string; count: number }>;
    goals: Array<{ id: GoalId; count: number }>;
    licenses: Array<{ id: LicenseTier; count: number }>;
    currency: string | null;
  };
  activeCount: number;
  showRating: boolean;
}

/**
 * Apply validated catalog state to a scope of products.
 * Facet counts are computed from the scope (before filters), so options never
 * disappear while the user is narrowing results.
 */
export function browse(scope: Product[], categories: Category[], state: CatalogState, ordered?: Product[]): BrowseResult {
  const filtered = applyFilters(scope, categories, state.filters);
  // A search relevance order takes precedence over "recommended".
  const sorted =
    state.sort === 'recommended' && ordered
      ? ordered.filter((p) => filtered.some((f) => f.id === p.id))
      : sortProducts(filtered, state.sort);

  const facets = availableFacets(scope);
  const currencies = new Set(scope.map((p) => p.price.currency));

  return {
    results: sorted.map((p) => toProductSummary(p, categories)),
    total: sorted.length,
    facets: {
      categories: categoryTree(categories)
        .map((root) => ({ id: root.id, name: root.name, count: productsInCategory(scope, categories, root.id).length }))
        .filter((c) => c.count > 0),
      formats: [...facets.formats].map(([id, count]) => ({ id, count })).sort((a, b) => b.count - a.count),
      software: [...facets.software].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      goals: [...facets.goals].map(([id, count]) => ({ id, count })).sort((a, b) => b.count - a.count),
      licenses: [...facets.licenses].map(([id, count]) => ({ id, count })),
      currency: currencies.size === 1 ? [...currencies][0] : null,
    },
    activeCount: activeFilterCount(state.filters),
    showRating: hasRatings(scope),
  };
}
