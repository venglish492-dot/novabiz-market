import type { Metadata } from 'next';
import { getI18n } from '@/i18n/server';
import { getPageContent } from '@/content/pages';
import { pageMetadata } from '@/lib/seo/metadata';
import { PageHeader } from '@/components/layout/PageHeader';
import { ButtonLink } from '@/components/ui/Button';

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getI18n();
  const c = getPageContent(locale).about;
  return pageMetadata({ title: c.title, description: c.description, path: '/about' });
}

export default async function AboutPage() {
  const { t, locale } = await getI18n();
  const c = getPageContent(locale).about;
  return (
    <>
      <PageHeader
        eyebrow={t.nav.about}
        title={c.title}
        description={c.lead}
        crumbs={[{ name: t.nav.home, href: '/' }, { name: c.title, href: '/about' }]}
        crumbLabel={t.product.breadcrumb}
      />
      <div className="container-page grid gap-14 py-14 lg:grid-cols-[1.4fr_1fr] lg:py-20">
        <div className="flex flex-col gap-12">
          {c.sections.map((section, index) => (
            <section key={section.title}>
              <p className="t-mono text-[11px] text-accent">{String(index + 1).padStart(2, '0')}</p>
              <h2 className="t-h3 mt-3 text-fg">{section.title}</h2>
              <p className="mt-3 max-w-2xl text-[16px] leading-[1.75] text-fg-muted">{section.body}</p>
            </section>
          ))}
          <div className="flex flex-wrap gap-2">
            <ButtonLink href="/products">{t.hero.primaryCta}</ButtonLink>
            <ButtonLink href="/contact" variant="secondary">
              {t.footer.contactUs}
            </ButtonLink>
          </div>
        </div>
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-line bg-surface p-6">
            <p className="t-eyebrow mb-4">{c.principlesTitle}</p>
            <ul className="flex flex-col divide-y divide-line">
              {c.principles.map((principle) => (
                <li key={principle} className="py-3 text-[15px] text-fg first:pt-0 last:pb-0">
                  {principle}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </>
  );
}
