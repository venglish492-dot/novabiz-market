import type { Metadata } from 'next';
import { getI18n } from '@/i18n/server';
import { pick, interpolate } from '@/i18n/config';
import { getCatalog } from '@/lib/catalog/repository';
import { parseCatalogParams, type RawParams } from '@/lib/catalog/params';
import { browse } from '@/lib/catalog/browse';
import { findCategory } from '@/lib/catalog/queries';
import { pageMetadata } from '@/lib/seo/metadata';
import { GOALS } from '@/data/goals';
import { PageHeader } from '@/components/layout/PageHeader';
import { CatalogView } from '@/components/catalog/CatalogView';

type Props = { searchParams: Promise<RawParams> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { t, locale } = await getI18n();
  const goalId = (await searchParams).goal;
  const goal = GOALS.find((g) => g.id === goalId);
  const title = goal ? interpolate(t.catalog.goalTitle, { goal: pick(goal.title, locale) }) : t.catalog.title;
  return pageMetadata({ title, description: t.catalog.subtitle, path: '/products' });
}

export default async function ProductsPage({ searchParams }: Props) {
  const { t, locale } = await getI18n();
  const { products, categories } = await getCatalog();
  const state = parseCatalogParams(await searchParams, categories);
  const result = browse(products, categories, state);
  const goal = GOALS.find((g) => g.id === state.filters.goal);
  const category = state.filters.category ? findCategory(categories, state.filters.category) : undefined;

  return (
    <>
      <PageHeader
        eyebrow={t.catalog.eyebrow}
        title={goal ? pick(goal.title, locale) : category ? pick(category.name, locale) : t.catalog.title}
        description={goal ? pick(goal.description, locale) : t.catalog.subtitle}
        crumbs={[
          { name: t.nav.home, href: '/' },
          { name: t.nav.products, href: '/products' },
        ]}
        crumbLabel={t.product.breadcrumb}
      />
      <div className="container-page py-10 lg:py-14">
        <CatalogView result={result} state={state} t={t} locale={locale} />
      </div>
    </>
  );
}
