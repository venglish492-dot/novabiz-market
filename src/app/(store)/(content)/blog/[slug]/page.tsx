import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getI18n } from '@/i18n/server';
import { pick } from '@/i18n/config';
import { getPageContent } from '@/content/pages';
import { getPostBySlug } from '@/lib/content/blog';
import { getProductsByIds, getCatalog } from '@/lib/catalog/repository';
import { toProductSummary } from '@/lib/catalog/summary';
import { formatDate } from '@/lib/format';
import { pageMetadata } from '@/lib/seo/metadata';
import { PageHeader } from '@/components/layout/PageHeader';
import { Markdown } from '@/components/content/Markdown';
import { ProductCard } from '@/components/products/ProductCard';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { locale } = await getI18n();
  const post = await getPostBySlug(slug);
  if (!post) return {};
  return pageMetadata({
    title: pick(post.seoTitle ?? post.title, locale),
    description: pick(post.seoDescription ?? post.excerpt, locale),
    path: `/blog/${post.slug}`,
    type: 'article',
    image: post.coverUrl ?? undefined,
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const { t, locale } = await getI18n();
  const post = await getPostBySlug(slug);
  if (!post) notFound();
  const c = getPageContent(locale).blog;
  const { categories } = await getCatalog();
  const related = (await getProductsByIds(post.relatedProductIds)).map((p) => toProductSummary(p, categories));

  return (
    <article>
      <PageHeader
        eyebrow={post.publishedAt ? formatDate(post.publishedAt, locale, 'long') : c.title}
        title={pick(post.title, locale)}
        description={pick(post.excerpt, locale)}
        crumbs={[
          { name: t.nav.home, href: '/' },
          { name: c.title, href: '/blog' },
          { name: pick(post.title, locale), href: `/blog/${post.slug}` },
        ]}
        crumbLabel={t.product.breadcrumb}
      />
      <div className="container-page max-w-3xl py-12 lg:py-16">
        <Markdown source={pick(post.body, locale)} />
        <p className="mt-10 text-sm text-fg-subtle">{post.authorName}</p>
      </div>
      {related.length > 0 && (
        <section className="container-page border-t border-line py-14" aria-labelledby="post-related">
          <h2 id="post-related" className="t-h3 mb-8 text-fg">
            {c.related}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((product) => (
              <ProductCard key={product.id} product={product} locale={locale} t={t} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
