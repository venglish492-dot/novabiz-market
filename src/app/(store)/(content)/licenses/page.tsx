import type { Metadata } from 'next';
import { Minus, Plus } from 'lucide-react';
import { getI18n } from '@/i18n/server';
import { pick, pickList } from '@/i18n/config';
import { getLegalDocument } from '@/content/legal';
import { pageMetadata } from '@/lib/seo/metadata';
import { LICENSES } from '@/data/licenses';
import { LegalPage } from '@/components/layout/LegalPage';

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getI18n();
  const doc = getLegalDocument('licenses', locale);
  return pageMetadata({ title: doc.title, description: doc.description, path: '/licenses' });
}

export default async function LicensesPage() {
  const { t, locale } = await getI18n();
  return (
    <LegalPage doc={getLegalDocument('licenses', locale)} path="/licenses" t={t} locale={locale}>
      <div className="not-prose mt-8 grid gap-4 sm:grid-cols-2">
        {Object.values(LICENSES).map((license) => (
          <section key={license.id} id={license.id} className="scroll-mt-28 rounded-2xl border border-line bg-surface p-6">
            <h2 className="!mt-0 text-lg font-semibold text-fg">{pick(license.name, locale)}</h2>
            <p className="mt-1 text-sm text-fg-muted">{pick(license.summary, locale)}</p>
            <p className="t-eyebrow mb-2 mt-5">{t.product.allowed}</p>
            <ul className="!m-0 !list-none !p-0">
              {pickList(license.allowed, locale).map((item) => (
                <li key={item} className="flex gap-2 text-sm text-fg-muted">
                  <Plus className="mt-1 h-3.5 w-3.5 shrink-0 text-success" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
            <p className="t-eyebrow mb-2 mt-5">{t.product.notAllowed}</p>
            <ul className="!m-0 !list-none !p-0">
              {pickList(license.notAllowed, locale).map((item) => (
                <li key={item} className="flex gap-2 text-sm text-fg-muted">
                  <Minus className="mt-1 h-3.5 w-3.5 shrink-0 text-danger" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </LegalPage>
  );
}
