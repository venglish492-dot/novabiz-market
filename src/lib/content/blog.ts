import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { publicSupabase } from '@/lib/config/site';
import { serverConfig } from '@/lib/config/server';
import { asLocalized, asLocalizedOrNull, mediaUrl } from '@/lib/catalog/mappers';
import type { LocalizedText } from '@/i18n/config';

export interface BlogPost {
  id: string;
  slug: string;
  title: LocalizedText;
  excerpt: LocalizedText;
  body: LocalizedText;
  coverUrl: string | null;
  authorName: string;
  relatedProductIds: string[];
  seoTitle: LocalizedText | null;
  seoDescription: LocalizedText | null;
  publishedAt: string | null;
  updatedAt: string;
}

function client() {
  if (!publicSupabase.configured) return null;
  return createClient(publicSupabase.url, publicSupabase.publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

function mapPost(row: Record<string, unknown>): BlogPost {
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: asLocalized(row.title),
    excerpt: asLocalized(row.excerpt),
    body: asLocalized(row.body),
    coverUrl: typeof row.cover_path === 'string' && row.cover_path ? mediaUrl(publicSupabase.url, serverConfig.storage.mediaBucket, row.cover_path) : null,
    authorName: String(row.author_name ?? 'Vektor Lab'),
    relatedProductIds: Array.isArray(row.related_product_ids) ? (row.related_product_ids as string[]) : [],
    seoTitle: asLocalizedOrNull(row.seo_title),
    seoDescription: asLocalizedOrNull(row.seo_description),
    publishedAt: typeof row.published_at === 'string' ? row.published_at : null,
    updatedAt: String(row.updated_at),
  };
}

/** Published posts only (RLS). Empty when no content exists — no placeholder articles. */
export async function getPublishedPosts(limit = 50): Promise<BlogPost[]> {
  const supabase = client();
  if (!supabase) return [];
  const { data } = await supabase.from('blog_posts').select('*').eq('status', 'published').order('published_at', { ascending: false }).limit(limit);
  return (data ?? []).map(mapPost);
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const supabase = client();
  if (!supabase) return null;
  const { data } = await supabase.from('blog_posts').select('*').eq('status', 'published').eq('slug', slug).maybeSingle();
  return data ? mapPost(data) : null;
}
