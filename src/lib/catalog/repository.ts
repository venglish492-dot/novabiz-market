import 'server-only';
import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { publicSupabase } from '@/lib/config/site';
import { serverConfig } from '@/lib/config/server';
import { logger } from '@/lib/logger';
import { CATEGORIES } from '@/data/categories';
import { COLLECTIONS } from '@/data/collections';
import { PRODUCTS } from '@/data/products';
import type { Catalog, Category, Collection, Product } from '@/types';
import { COLLECTION_SELECT, PRODUCT_SELECT, mapCategoryRow, mapCollectionRow, mapProductRow } from './mappers';
import { buildSearchIndex, searchIndex, type IndexedProduct } from './search';
import { findCategory } from './queries';

export const CATALOG_TAG = 'catalog';

function staticCatalog(): Catalog {
  return {
    products: PRODUCTS.filter((p) => p.status === 'published'),
    categories: CATEGORIES,
    collections: COLLECTIONS,
    source: 'static',
  };
}

/**
 * Published catalog from Supabase, read with the publishable key (no user
 * session), so RLS guarantees only published content is returned.
 */
async function loadFromDatabase(): Promise<Catalog> {
  const supabase = createClient(publicSupabase.url, publicSupabase.publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const [productsResult, categoriesResult, collectionsResult] = await Promise.all([
    supabase.from('products').select(PRODUCT_SELECT).eq('status', 'published').order('sort_order'),
    supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
    supabase.from('collections').select(COLLECTION_SELECT).eq('is_published', true).order('sort_order'),
  ]);

  const error = productsResult.error ?? categoriesResult.error ?? collectionsResult.error;
  if (error) {
    logger.error('catalog.load_failed', { code: error.code, message: error.message });
    throw new Error('Catalog could not be loaded');
  }

  const ctx = { supabaseUrl: publicSupabase.url, mediaBucket: serverConfig.storage.mediaBucket };
  const products = (productsResult.data ?? []).map((row) => mapProductRow(row, ctx));
  const publishedIds = new Set(products.map((p) => p.id));
  const collections = (collectionsResult.data ?? []).map(mapCollectionRow).map((collection) => ({
    ...collection,
    productIds: collection.productIds.filter((id) => publishedIds.has(id)),
  }));

  return {
    products,
    categories: (categoriesResult.data ?? []).map(mapCategoryRow),
    collections,
    source: 'database',
  };
}

const loadCachedCatalog = unstable_cache(loadFromDatabase, ['vektor-catalog-v1'], {
  revalidate: 300,
  tags: [CATALOG_TAG],
});

/** The published catalog for this request (deduplicated per render). */
export const getCatalog = cache(async (): Promise<Catalog> => {
  if (!publicSupabase.configured) return staticCatalog();
  return loadCachedCatalog();
});

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const { products } = await getCatalog();
  return products.find((p) => p.slug === slug);
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  const { products } = await getCatalog();
  const byId = new Map(products.map((p) => [p.id, p]));
  return ids.map((id) => byId.get(id)).filter((p): p is Product => Boolean(p));
}

export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  const { categories } = await getCatalog();
  return findCategory(categories, slug);
}

export async function getCollectionBySlug(slug: string): Promise<Collection | undefined> {
  const { collections } = await getCatalog();
  return collections.find((c) => c.slug === slug);
}

let indexCache: { key: string; index: IndexedProduct[] } | null = null;

function catalogKey(catalog: Catalog): string {
  return `${catalog.source}:${catalog.products.length}:${catalog.products.map((p) => `${p.id}@${p.updatedAt}`).join('|')}`;
}

/** Search the published catalog. The index is rebuilt only when the catalog changes. */
export async function searchCatalog(query: string): Promise<Product[]> {
  const catalog = await getCatalog();
  const key = catalogKey(catalog);
  if (!indexCache || indexCache.key !== key) {
    indexCache = { key, index: buildSearchIndex(catalog.products, catalog.categories) };
  }
  return searchIndex(indexCache.index, query).map((hit) => hit.product);
}
