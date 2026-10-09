import type { Metadata } from 'next';
import Link from 'next/link';
import { Newspaper } from 'lucide-react';
import { getI18n } from '@/i18n/server';
import { pick } from '@/i18n/config';
import { getPageContent } from '@/content/pages';
import { getPublishedPosts } from '@/lib/content/blog';
import { formatDate } from '@/lib/format';
import { pageMetadata } from '@/lib/seo/metadata';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ButtonLink } from '@/components/ui/Button';

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getI18n();
  const c = getPageContent(locale).blog;
  const posts = await getPublishedPosts(1);
  return pageMetadata({ title: c.title, description: c.description, path: '/blog', noIndex: posts.length === 0 });
}

export default async function BlogPage() {
  const { t, locale } = await getI18n();
  const c = getPageContent(locale).blog;
  const posts = await getPublishedPosts();
  return (
    <>
      <PageHeader
        eyebrow={t.nav.resources}
        title={c.title}
        description={c.description}
        crumbs={[{ name: t.nav.home, href: '/' }, { name: c.title, href: '/blog' }]}
        crumbLabel={t.product.breadcrumb}
      />
      <div className="container-page py-14 lg:py-20">
        {posts.length ? (
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <li key={post.id}>
                <Link href={`/blog/${post.slug}`} className="flex h-full flex-col rounded-2xl border border-line bg-surface p-6 transition-colors hover:border-line-strong">
                  {post.publishedAt && <p className="t-mono text-xs text-fg-subtle">{formatDate(post.publishedAt, locale, 'long')}</p>}
                  <h2 className="mt-4 text-xl font-semibold tracking-tight text-fg">{pick(post.title, locale)}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-fg-muted">{pick(post.excerpt, locale)}</p>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={<Newspaper className="h-5 w-5" />} title={c.empty} body={c.emptyBody} action={<ButtonLink href="/products">{t.nav.allProducts}</ButtonLink>} />
        )}
      </div>
    </>
  );
}
