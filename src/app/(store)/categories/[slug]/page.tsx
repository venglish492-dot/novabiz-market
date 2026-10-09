import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getI18n } from '@/i18n/server';
import { pick } from '@/i18n/config';
import { getCatalog } from '@/lib/catalog/repository';
import { categoryLineage, countByCategory, findCategory, productsInCategory } from '@/lib/catalog/queries';
import { parseCatalogParams, type RawParams } from '@/lib/catalog/params';
import { browse } from '@/lib/catalog/browse';
import { pageMetadata } from '@/lib/seo/metadata';
import { PageHeader } from '@/components/layout/PageHeader';
import { CatalogView } from '@/components/catalog/CatalogView';
import { EmptyState } from '@/components/ui/EmptyState';
import { ButtonLink } from '@/components/ui/Button';

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<RawParams> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { t, locale } = await getI18n();
  const { categories, products } = await getCatalog();
  const category = findCategory(categories, slug);
  if (!category) return {};
  const count = productsInCategory(products, categories, category.id).length;
  return pageMetadata({
    title: pick(category.name, locale),
    description: pick(category.description, locale) || t.catalog.categoriesSubtitle,
    path: `/categories/${category.slug}`,
    noIndex: count === 0,
  });
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { t, locale } = await getI18n();
  const { products, categories } = await getCatalog();
  const category = findCategory(categories, slug);
  if (!category) notFound();

  const scope = productsInCategory(products, categories, category.id);
  const state = parseCatalogParams(await searchParams, categories);
  state.filters.category = undefined;
  const result = browse(scope, categories, state);
  const lineage = categoryLineage(categories, category.id);
  const counts = countByCategory(products, categories);
  const children = categories.filter((c) => c.parentId === category.id && (counts.get(c.id) ?? 0) > 0);
  const siblings = category.parentId
    ? categories.filter((c) => c.parentId === category.parentId && c.id !== category.id && (counts.get(c.id) ?? 0) > 0)
    : [];
  const related = [...children, ...siblings];

  return (
    <>
      <PageHeader
        eyebrow={t.nav.categories}
        title={pick(category.name, locale)}
        description={pick(category.description, locale) || undefined}
        crumbs={[
          { name: t.nav.home, href: '/' },
          { name: t.nav.categories, href: '/categories' },
          ...lineage.map((c) => ({ name: pick(c.name, locale), href: `/categories/${c.slug}` })),
        ]}
        crumbLabel={t.product.breadcrumb}
      >
        {related.length > 0 && (
          <ul className="mt-8 flex flex-wrap gap-2">
            {related.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/categories/${c.slug}`}
                  className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-[13px] text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
                >
                  {pick(c.name, locale)}
                  <span className="text-xs text-fg-subtle">{counts.get(c.id)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PageHeader>
      <div className="container-page py-10 lg:py-14">
        {scope.length ? (
          <CatalogView result={result} state={state} t={t} locale={locale} hideCategory />
        ) : (
          <EmptyState
            title={t.common.comingSoon}
            body={t.catalog.categoryEmpty}
            action={
              <ButtonLink href="/products" variant="secondary">
                {t.nav.allProducts}
              </ButtonLink>
            }
          />
        )}
      </div>
    </>
  );
}
