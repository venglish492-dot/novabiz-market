import type { Metadata } from 'next';
import { Search } from 'lucide-react';
import { getI18n } from '@/i18n/server';
import { interpolate } from '@/i18n/config';
import { getCatalog, searchCatalog } from '@/lib/catalog/repository';
import { parseCatalogParams, type RawParams } from '@/lib/catalog/params';
import { browse } from '@/lib/catalog/browse';
import { pageMetadata } from '@/lib/seo/metadata';
import { PageHeader } from '@/components/layout/PageHeader';
import { CatalogView } from '@/components/catalog/CatalogView';
import { buttonClasses } from '@/components/ui/Button';

type Props = { searchParams: Promise<RawParams> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { t } = await getI18n();
  const q = (await searchParams).q;
  const query = typeof q === 'string' ? q.slice(0, 100) : '';
  return {
    ...pageMetadata({
      title: query ? interpolate(t.search.resultsFor, { query }) : t.search.title,
      description: t.catalog.subtitle,
      path: '/search',
    }),
    // Search result pages should not be indexed.
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const { t, locale } = await getI18n();
  const { categories } = await getCatalog();
  const state = parseCatalogParams(await searchParams, categories);
  const matches = state.query.trim() ? await searchCatalog(state.query) : [];
  const result = browse(matches, categories, state, matches);

  return (
    <>
      <PageHeader
        eyebrow={t.search.title}
        title={state.query ? interpolate(t.search.resultsFor, { query: state.query }) : t.search.title}
        crumbs={[
          { name: t.nav.home, href: '/' },
          { name: t.search.title, href: '/search' },
        ]}
        crumbLabel={t.product.breadcrumb}
      >
        <form action="/search" role="search" className="mt-8 flex max-w-2xl gap-2">
          <label htmlFor="search-page-input" className="sr-only">
            {t.search.label}
          </label>
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" aria-hidden />
            <input
              id="search-page-input"
              name="q"
              type="search"
              defaultValue={state.query}
              placeholder={t.search.placeholder}
              className="h-12 w-full rounded-full border border-line-strong bg-surface pl-11 pr-4 text-[15px] text-fg outline-none placeholder:text-fg-subtle focus:border-accent"
            />
          </div>
          <button type="submit" className={buttonClasses({ size: 'lg' })}>
            {t.search.title}
          </button>
        </form>
      </PageHeader>
      <div className="container-page py-10 lg:py-14">
        {state.query ? (
          <CatalogView
            result={result}
            state={state}
            t={t}
            locale={locale}
            emptyTitle={interpolate(t.search.noResults, { query: state.query })}
            emptyBody={t.search.noResultsHint}
          />
        ) : (
          <p className="text-fg-muted">{t.search.emptyQuery}</p>
        )}
      </div>
    </>
  );
}
