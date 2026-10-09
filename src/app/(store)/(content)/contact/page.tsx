import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, Mail, Phone } from 'lucide-react';
import { getI18n } from '@/i18n/server';
import { getPageContent } from '@/content/pages';
import { siteConfig } from '@/lib/config/site';
import { pageMetadata } from '@/lib/seo/metadata';
import { PageHeader } from '@/components/layout/PageHeader';

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getI18n();
  const c = getPageContent(locale).contact;
  return pageMetadata({ title: c.title, description: c.description, path: '/contact' });
}

export default async function ContactPage() {
  const { t, locale } = await getI18n();
  const c = getPageContent(locale).contact;
  const topics = [
    { href: '/refunds', label: t.footer.refunds },
    { href: '/licenses', label: t.footer.licenses },
    { href: '/library', label: t.nav.library },
    { href: '/account/purchases', label: t.account.purchases },
  ];
  return (
    <>
      <PageHeader
        eyebrow={t.nav.contact}
        title={c.title}
        description={c.lead}
        crumbs={[{ name: t.nav.home, href: '/' }, { name: c.title, href: '/contact' }]}
        crumbLabel={t.product.breadcrumb}
      />
      <div className="container-page grid gap-6 py-14 md:grid-cols-2 lg:py-20">
        <a href={`mailto:${siteConfig.email}`} className="group flex flex-col rounded-2xl border border-line bg-surface p-7 transition-colors hover:border-line-strong">
          <Mail className="h-5 w-5 text-accent" aria-hidden />
          <span className="t-eyebrow mt-8">{t.common.email}</span>
          <span className="mt-2 text-2xl font-semibold tracking-tight text-fg group-hover:underline">{siteConfig.email}</span>
        </a>
        <a href={siteConfig.phoneHref} className="group flex flex-col rounded-2xl border border-line bg-surface p-7 transition-colors hover:border-line-strong">
          <Phone className="h-5 w-5 text-accent" aria-hidden />
          <span className="t-eyebrow mt-8">{t.common.phone}</span>
          <span className="mt-2 text-2xl font-semibold tracking-tight text-fg group-hover:underline">{siteConfig.phone}</span>
        </a>
        <p className="text-sm text-fg-muted md:col-span-2">{c.orderTip}</p>
        <div className="md:col-span-2">
          <p className="t-eyebrow mb-4 mt-6">{c.topicsTitle}</p>
          <ul className="flex flex-wrap gap-2">
            {topics.map((topic) => (
              <li key={topic.href}>
                <Link href={topic.href} className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm text-fg-muted hover:border-line-strong hover:text-fg">
                  {topic.label}
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
