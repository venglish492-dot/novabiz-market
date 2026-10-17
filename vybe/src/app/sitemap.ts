import type { MetadataRoute } from 'next';
import { env } from '@/lib/env';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = ['', '/pricing', '/compare', '/discover', '/leaderboard', '/media', '/help', '/changelog', '/contact', '/privacy', '/terms', '/guidelines'].map((path) => ({
    url: `${env.siteUrl}${path}`,
    changeFrequency: 'weekly' as const,
    priority: path === '' ? 1 : 0.6,
  }));
  // Only public, published, indexable profiles — never unlisted or noindex ones.
  const db = await getDb();
  const profiles = await db.query<{ username: string; published_at: Date }>(
    `select username, published_at from profiles
      where is_published and suspended_at is null and visibility = 'public'
        and coalesce((published_snapshot -> 'doc' -> 'seo' ->> 'noindex')::boolean, false) = false
      order by published_at desc limit 5000`,
  );
  return [...pages, ...profiles.map((p) => ({ url: `${env.siteUrl}/@${p.username}`, lastModified: p.published_at, changeFrequency: 'weekly' as const, priority: 0.5 }))];
}
