import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, BookOpen, FileText, Newspaper, Scale } from 'lucide-react';
import { getI18n } from '@/i18n/server';
import { getPageContent } from '@/content/pages';
import { pageMetadata } from '@/lib/seo/metadata';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getI18n();
  const c = getPageContent(locale).resources;
  return pageMetadata({ title: c.title, description: c.description, path: '/resources' });
}

export default async function ResourcesPage() {
  const { t, locale } = await getI18n();
  const c = getPageContent(locale).resources;
  return (
    <>
      <PageHeader
        eyebrow={t.nav.resources}
        title={c.title}
        description={c.lead}
        crumbs={[{ name: t.nav.home, href: '/' }, { name: c.title, href: '/resources' }]}
        crumbLabel={t.product.breadcrumb}
      />
      <div className="container-page grid gap-4 py-14 md:grid-cols-2 lg:py-20">
        <div className="flex flex-col rounded-2xl border border-dashed border-line-strong p-7">
          <BookOpen className="h-5 w-5 text-fg-subtle" aria-hidden />
          <h2 className="mt-6 flex items-center gap-3 text-xl font-semibold text-fg">
            {c.guidesTitle}
            <Badge tone="outline">{t.common.comingSoon}</Badge>
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-fg-muted">{c.guidesBody}</p>
        </div>
        <div className="flex flex-col rounded-2xl border border-line bg-surface p-7">
          <FileText className="h-5 w-5 text-accent" aria-hidden />
          <h2 className="mt-6 text-xl font-semibold text-fg">{c.docsTitle}</h2>
          <p className="mt-2 text-sm leading-relaxed text-fg-muted">{c.docsBody}</p>
          <Link href="/library" className="mt-4 inline-flex items-center gap-1 text-sm text-accent hover:underline">
            {t.nav.library}
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
        <Link href="/blog" className="group flex flex-col rounded-2xl border border-line bg-surface p-7 transition-colors hover:border-line-strong">
          <Newspaper className="h-5 w-5 text-accent" aria-hidden />
          <h2 className="mt-6 flex items-center gap-2 text-xl font-semibold text-fg">
            {c.blogTitle}
            <ArrowUpRight className="h-4 w-4 text-fg-subtle group-hover:text-fg" aria-hidden />
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-fg-muted">{c.blogBody}</p>
        </Link>
        <div className="flex flex-col rounded-2xl border border-line bg-surface p-7">
          <Scale className="h-5 w-5 text-accent" aria-hidden />
          <h2 className="mt-6 text-xl font-semibold text-fg">{c.policiesTitle}</h2>
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            {[
              { href: '/licenses', label: t.footer.licenses },
              { href: '/terms', label: t.footer.terms },
              { href: '/privacy', label: t.footer.privacy },
              { href: '/refunds', label: t.footer.refunds },
            ].map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-fg-muted hover:text-fg hover:underline">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
