import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { getI18n } from '@/i18n/server';
import { interpolate } from '@/i18n/config';
import { requireUser } from '@/lib/auth/session';
import { getOrders, getOwnedProductIdsForUser, getProfile } from '@/lib/account/queries';
import { formatDate } from '@/lib/format';
import { pageMetadata } from '@/lib/seo/metadata';
import { EmptyState } from '@/components/ui/EmptyState';
import { ButtonLink } from '@/components/ui/Button';
import { AccountSection } from '../AccountSection';
import { OrdersTable } from '../OrdersTable';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return pageMetadata({ title: t.account.title, description: t.account.title, path: '/account', noIndex: true });
}

export default async function AccountOverviewPage() {
  const { t, locale } = await getI18n();
  const user = await requireUser('/account');
  const [profile, orders, owned] = await Promise.all([getProfile(user.id), getOrders(5), getOwnedProductIdsForUser(user.id)]);
  const name = profile?.fullName || user.name || user.email;

  return (
    <AccountSection
      title={interpolate(t.account.welcome, { name })}
      subtitle={profile ? interpolate(t.account.memberSince, { date: formatDate(profile.createdAt, locale, 'month-year') }) : undefined}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/library" className="group rounded-2xl border border-line bg-surface p-6 transition-colors hover:border-line-strong">
          <p className="flex items-center justify-between text-sm text-fg-muted">
            {t.account.stats.products}
            <ArrowUpRight className="h-4 w-4 text-fg-subtle group-hover:text-fg" aria-hidden />
          </p>
          <p className="mt-3 text-3xl font-semibold tabular-nums text-fg">{owned.length}</p>
        </Link>
        <Link href="/account/purchases" className="group rounded-2xl border border-line bg-surface p-6 transition-colors hover:border-line-strong">
          <p className="flex items-center justify-between text-sm text-fg-muted">
            {t.account.stats.orders}
            <ArrowUpRight className="h-4 w-4 text-fg-subtle group-hover:text-fg" aria-hidden />
          </p>
          <p className="mt-3 text-3xl font-semibold tabular-nums text-fg">{orders.length}</p>
        </Link>
      </div>
      <h2 className="t-h3 mb-5 mt-12 text-fg">{t.account.recentOrders}</h2>
      {orders.length ? (
        <OrdersTable orders={orders} t={t} locale={locale} />
      ) : (
        <EmptyState title={t.account.noOrders} action={<ButtonLink href="/products">{t.account.noOrdersCta}</ButtonLink>} />
      )}
    </AccountSection>
  );
}
