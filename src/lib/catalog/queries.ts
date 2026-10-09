import type { Category, Collection, FormatId, GoalId, LicenseTier, Product } from '../../types/index.ts';

/* Pure catalog helpers. No I/O — safe for server, client and unit tests. */

export interface CategoryNode extends Category {
  children: Category[];
}

export function categoryTree(categories: Category[]): CategoryNode[] {
  const roots = categories.filter((c) => !c.parentId).sort((a, b) => a.sortOrder - b.sortOrder);
  return roots.map((root) => ({
    ...root,
    children: categories.filter((c) => c.parentId === root.id).sort((a, b) => a.sortOrder - b.sortOrder),
  }));
}

export function findCategory(categories: Category[], idOrSlug: string): Category | undefined {
  return categories.find((c) => c.id === idOrSlug || c.slug === idOrSlug);
}

/** Root → leaf chain for breadcrumbs. */
export function categoryLineage(categories: Category[], categoryId: string): Category[] {
  const chain: Category[] = [];
  let current = findCategory(categories, categoryId);
  let guard = 0;
  while (current && guard < 8) {
    chain.unshift(current);
    current = current.parentId ? findCategory(categories, current.parentId) : undefined;
    guard += 1;
  }
  return chain;
}

export function rootCategoryOf(categories: Category[], categoryId: string): Category | undefined {
  return categoryLineage(categories, categoryId)[0];
}

function descendantIds(categories: Category[], categoryId: string): Set<string> {
  const ids = new Set<string>([categoryId]);
  let added = true;
  while (added) {
    added = false;
    for (const category of categories) {
      if (category.parentId && ids.has(category.parentId) && !ids.has(category.id)) {
        ids.add(category.id);
        added = true;
      }
    }
  }
  return ids;
}

/** Products whose primary or secondary category is within `categoryId`'s subtree. */
export function productsInCategory(products: Product[], categories: Category[], categoryId: string): Product[] {
  const ids = descendantIds(categories, categoryId);
  return products.filter((p) => ids.has(p.categoryId) || p.secondaryCategoryIds.some((id) => ids.has(id)));
}

export function countByCategory(products: Product[], categories: Category[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const category of categories) {
    counts.set(category.id, productsInCategory(products, categories, category.id).length);
  }
  return counts;
}

export function collectionsForProduct(collections: Collection[], productId: string): Collection[] {
  return collections.filter((c) => c.productIds.includes(productId));
}

export function collectionProducts(collection: Collection, products: Product[]): Product[] {
  const byId = new Map(products.map((p) => [p.id, p]));
  return collection.productIds.map((id) => byId.get(id)).filter((p): p is Product => Boolean(p));
}

/** Related products by shared taxonomy — deterministic, never random. */
export function relatedProducts(product: Product, products: Product[], limit = 4): Product[] {
  const productCategories = new Set([product.categoryId, ...product.secondaryCategoryIds]);
  const scored = products
    .filter((p) => p.id !== product.id && p.productType !== 'bundle')
    .map((candidate) => {
      let score = 0;
      if (candidate.categoryId === product.categoryId) score += 4;
      for (const id of [candidate.categoryId, ...candidate.secondaryCategoryIds]) {
        if (productCategories.has(id)) score += 2;
      }
      score += candidate.goals.filter((g) => product.goals.includes(g)).length * 1.5;
      score += candidate.formats.filter((f) => product.formats.includes(f)).length * 0.5;
      return { candidate, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.candidate.sortOrder - b.candidate.sortOrder);
  return scored.slice(0, limit).map(({ candidate }) => candidate);
}

export type ProductBadgeKind = 'featured' | 'new' | 'updated';

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

/** Badges come only from configuration (featured) or real dates (new/updated). */
export function productBadges(product: Product, now: Date = new Date()): ProductBadgeKind[] {
  const badges: ProductBadgeKind[] = [];
  const published = product.publishedAt ? Date.parse(product.publishedAt) : Number.NaN;
  const updated = Date.parse(product.lastUpdated);
  if (!Number.isNaN(published) && now.getTime() - published < THIRTY_DAYS) badges.push('new');
  else if (!Number.isNaN(updated) && now.getTime() - updated < THIRTY_DAYS) badges.push('updated');
  if (product.isFeatured) badges.push('featured');
  return badges;
}

/* ------------------------------------------------------------------ */
/* Filtering & sorting                                                 */
/* ------------------------------------------------------------------ */

export type SortKey = 'recommended' | 'newest' | 'price-asc' | 'price-desc' | 'rating';
export const SORT_KEYS: SortKey[] = ['recommended', 'newest', 'price-asc', 'price-desc', 'rating'];

export interface CatalogFilters {
  category?: string;
  formats?: FormatId[];
  software?: string;
  goal?: GoalId;
  license?: LicenseTier;
  minPrice?: number;
  maxPrice?: number;
}

export function applyFilters(products: Product[], categories: Category[], filters: CatalogFilters): Product[] {
  let result = products;
  if (filters.category) {
    const allowed = new Set(productsInCategory(products, categories, filters.category).map((p) => p.id));
    result = result.filter((p) => allowed.has(p.id));
  }
  if (filters.formats?.length) {
    result = result.filter((p) => filters.formats!.some((f) => p.formats.includes(f)));
  }
  if (filters.software) {
    const needle = filters.software.toLowerCase();
    result = result.filter((p) => p.software.some((s) => s.toLowerCase() === needle));
  }
  if (filters.goal) result = result.filter((p) => p.goals.includes(filters.goal!));
  if (filters.license) result = result.filter((p) => p.license === filters.license);
  if (typeof filters.minPrice === 'number') result = result.filter((p) => p.price.amount >= filters.minPrice!);
  if (typeof filters.maxPrice === 'number') result = result.filter((p) => p.price.amount <= filters.maxPrice!);
  return result;
}

/** Whether any product has real rating data (rating sort is offered only then). */
export function hasRatings(products: Product[]): boolean {
  return products.some((p) => p.rating && p.rating.count > 0);
}

export function sortProducts(products: Product[], sort: SortKey): Product[] {
  const list = [...products];
  switch (sort) {
    case 'newest':
      return list.sort((a, b) => Date.parse(b.publishedAt ?? b.createdAt) - Date.parse(a.publishedAt ?? a.createdAt));
    case 'price-asc':
      return list.sort((a, b) => a.price.amount - b.price.amount);
    case 'price-desc':
      return list.sort((a, b) => b.price.amount - a.price.amount);
    case 'rating':
      return list.sort(
        (a, b) => (b.rating?.average ?? 0) - (a.rating?.average ?? 0) || (b.rating?.count ?? 0) - (a.rating?.count ?? 0),
      );
    case 'recommended':
    default:
      // Curated order: featured first, then the configured sort order.
      return list.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || a.sortOrder - b.sortOrder);
  }
}

export function availableFacets(products: Product[]) {
  const formats = new Map<FormatId, number>();
  const software = new Map<string, number>();
  const goals = new Map<GoalId, number>();
  const licenses = new Map<LicenseTier, number>();
  for (const product of products) {
    for (const f of product.formats) formats.set(f, (formats.get(f) ?? 0) + 1);
    for (const s of product.software) software.set(s, (software.get(s) ?? 0) + 1);
    for (const g of product.goals) goals.set(g, (goals.get(g) ?? 0) + 1);
    licenses.set(product.license, (licenses.get(product.license) ?? 0) + 1);
  }
  const prices = products.map((p) => p.price.amount);
  return {
    formats,
    software,
    goals,
    licenses,
    priceRange: prices.length ? { min: Math.min(...prices), max: Math.max(...prices) } : null,
  };
}

export function bundleSavings(bundle: Product, products: Product[]): { separate: number; savings: number } | null {
  if (bundle.productType !== 'bundle' || !bundle.bundleProductIds.length) return null;
  const items = bundle.bundleProductIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p) && p!.price.currency === bundle.price.currency);
  if (items.length !== bundle.bundleProductIds.length) return null;
  const separate = items.reduce((sum, p) => sum + p.price.amount, 0);
  const savings = Math.round((separate - bundle.price.amount) * 100) / 100;
  return { separate, savings: savings > 0 ? savings : 0 };
}
