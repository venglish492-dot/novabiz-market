import type { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/config/site';
import { getCatalog } from '@/lib/catalog/repository';
import { productsInCategory } from '@/lib/catalog/queries';
import { getPublishedPosts } from '@/lib/content/blog';

/** Published, public routes only — no account, checkout, admin or auth pages. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { products, categories, collections } = await getCatalog();
  const posts = await getPublishedPosts(500);
  const url = (path: string) => `${siteConfig.url}${path}`;

  const staticRoutes = ['', '/products', '/categories', '/collections', '/about', '/contact', '/resources', '/licenses', '/terms', '/privacy', '/refunds'];

  return [
    ...staticRoutes.map((path) => ({ url: url(path || '/'), changeFrequency: 'weekly' as const, priority: path === '' ? 1 : 0.6 })),
    ...(posts.length ? [{ url: url('/blog'), changeFrequency: 'weekly' as const, priority: 0.5 }] : []),
    ...products.map((p) => ({ url: url(`/products/${p.slug}`), lastModified: p.updatedAt || p.lastUpdated, changeFrequency: 'weekly' as const, priority: 0.9 })),
    ...categories
      .filter((c) => productsInCategory(products, categories, c.id).length > 0)
      .map((c) => ({ url: url(`/categories/${c.slug}`), changeFrequency: 'weekly' as const, priority: 0.7 })),
    ...collections.map((c) => ({ url: url(`/collections/${c.slug}`), changeFrequency: 'weekly' as const, priority: 0.7 })),
    ...posts.map((p) => ({ url: url(`/blog/${p.slug}`), lastModified: p.updatedAt, changeFrequency: 'monthly' as const, priority: 0.5 })),
  ];
}
