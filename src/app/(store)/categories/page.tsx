import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { getI18n } from '@/i18n/server';
import { pick } from '@/i18n/config';
import { plural } from '@/i18n/plural';
import { getCatalog } from '@/lib/catalog/repository';
import { categoryTree, countByCategory } from '@/lib/catalog/queries';
import { pageMetadata } from '@/lib/seo/metadata';
import { PageHeader } from '@/components/layout/PageHeader';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return pageMetadata({ title: t.catalog.categoriesTitle, description: t.catalog.categoriesSubtitle, path: '/categories' });
}

export default async function CategoriesPage() {
  const { t, locale } = await getI18n();
  const { products, categories } = await getCatalog();
  const counts = countByCategory(products, categories);
  const tree = categoryTree(categories);
  const populated = tree.filter((root) => (counts.get(root.id) ?? 0) > 0);
  const roadmap = tree.filter((root) => (counts.get(root.id) ?? 0) === 0);

  return (
    <>
      <PageHeader
        eyebrow={t.catalog.categoriesEyebrow}
        title={t.catalog.categoriesTitle}
        description={t.catalog.categoriesSubtitle}
        crumbs={[
          { name: t.nav.home, href: '/' },
          { name: t.nav.categories, href: '/categories' },
        ]}
        crumbLabel={t.product.breadcrumb}
      />
      <div className="container-page py-12 lg:py-16">
        <ul className="grid gap-4 md:grid-cols-2">
          {populated.map((root) => {
            const children = root.children.filter((child) => (counts.get(child.id) ?? 0) > 0);
            return (
              <li key={root.id} className="flex flex-col rounded-2xl border border-line bg-surface p-6 sm:p-7" style={{ '--tone': `var(--tone-${root.tone})` } as React.CSSProperties}>
                <div className="flex items-center justify-between gap-4">
                  <Link href={`/categories/${root.slug}`} className="group flex items-center gap-3 text-2xl font-semibold tracking-tight text-fg">
                    <span className="h-2 w-2 rounded-full bg-[var(--tone)]" aria-hidden />
                    {pick(root.name, locale)}
                    <ArrowUpRight className="h-5 w-5 text-fg-subtle transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-fg" aria-hidden />
                  </Link>
                  <span className="t-mono text-xs text-fg-subtle">{plural(t.common.products, counts.get(root.id) ?? 0, locale)}</span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-fg-muted">{pick(root.description, locale)}</p>
                {children.length > 0 && (
                  <div className="mt-6 border-t border-line pt-5">
                    <p className="t-eyebrow mb-3">{t.catalog.subcategories}</p>
                    <ul className="flex flex-wrap gap-2">
                      {children.map((child) => (
                        <li key={child.id}>
                          <Link
                            href={`/categories/${child.slug}`}
                            className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-[13px] text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
                          >
                            {pick(child.name, locale)}
                            <span className="text-xs text-fg-subtle">{counts.get(child.id)}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {roadmap.length > 0 && (
          <section className="mt-16 border-t border-line pt-10" aria-labelledby="roadmap-title">
            <h2 id="roadmap-title" className="t-h3 text-fg">
              {t.catalog.roadmapTitle}
            </h2>
            <p className="mt-2 max-w-xl text-sm text-fg-muted">{t.catalog.roadmapBody}</p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {roadmap.map((root) => (
                <li key={root.id} className="rounded-2xl border border-dashed border-line-strong p-5">
                  <p className="flex items-center gap-2 font-medium text-fg">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: `var(--tone-${root.tone})` }} aria-hidden />
                    {pick(root.name, locale)}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-fg-subtle">{pick(root.description, locale)}</p>
                  <p className="mt-3 text-xs text-fg-subtle">{root.children.map((child) => pick(child.name, locale)).join(' · ')}</p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
