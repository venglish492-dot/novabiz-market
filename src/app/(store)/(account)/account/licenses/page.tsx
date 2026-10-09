import type { Metadata } from 'next';
import Link from 'next/link';
import { getI18n } from '@/i18n/server';
import { interpolate, pick, pickList } from '@/i18n/config';
import { requireUser } from '@/lib/auth/session';
import { getLibrary } from '@/lib/account/queries';
import { formatDate } from '@/lib/format';
import { pageMetadata } from '@/lib/seo/metadata';
import { LICENSES } from '@/data/licenses';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { AccountSection } from '../../AccountSection';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return pageMetadata({ title: t.account.licensesTitle, description: t.account.licensesSubtitle, path: '/account/licenses', noIndex: true });
}

/** Licenses correspond 1:1 to real entitlements created by verified payments. */
export default async function LicensesPage() {
  const { t, locale } = await getI18n();
  const user = await requireUser('/account/licenses');
  const items = await getLibrary(user.id);
  return (
    <AccountSection title={t.account.licensesTitle} subtitle={t.account.licensesSubtitle}>
      {items.length ? (
        <ul className="grid gap-4">
          {items.map((item) => {
            const license = LICENSES[item.license] ?? LICENSES.commercial;
            return (
              <li key={item.product.id} className="rounded-2xl border border-line bg-surface p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-fg">{interpolate(t.account.licenseFor, { title: pick(item.product.title, locale) })}</p>
                    <p className="mt-1 text-xs text-fg-subtle">
                      {interpolate(t.account.licenseOrder, { order: item.orderNumber, date: formatDate(item.purchasedAt, locale, 'long') })}
                    </p>
                  </div>
                  <Badge tone="accent">{pick(license.name, locale)}</Badge>
                </div>
                <p className="mt-4 text-sm text-fg-muted">{pick(license.summary, locale)}</p>
                <ul className="mt-3 grid gap-1.5 text-sm text-fg-muted sm:grid-cols-2">
                  {pickList(license.allowed, locale).map((rule) => (
                    <li key={rule}>+ {rule}</li>
                  ))}
                </ul>
                <Link href="/licenses" className="mt-4 inline-block text-sm text-accent hover:underline">
                  {t.account.licenseTerms}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState title={t.account.licensesEmpty} />
      )}
    </AccountSection>
  );
}
