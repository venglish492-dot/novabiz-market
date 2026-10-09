import type { Metadata } from 'next';
import { getI18n } from '@/i18n/server';
import { requireUser } from '@/lib/auth/session';
import { getOrders } from '@/lib/account/queries';
import { pageMetadata } from '@/lib/seo/metadata';
import { EmptyState } from '@/components/ui/EmptyState';
import { ButtonLink } from '@/components/ui/Button';
import { AccountSection } from '../../AccountSection';
import { OrdersTable } from '../../OrdersTable';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return pageMetadata({ title: t.account.purchasesTitle, description: t.account.purchasesSubtitle, path: '/account/purchases', noIndex: true });
}

export default async function PurchasesPage() {
  const { t, locale } = await getI18n();
  await requireUser('/account/purchases');
  const orders = await getOrders(100);
  return (
    <AccountSection title={t.account.purchasesTitle} subtitle={t.account.purchasesSubtitle}>
      {orders.length ? (
        <OrdersTable orders={orders} t={t} locale={locale} />
      ) : (
        <EmptyState title={t.account.noOrders} action={<ButtonLink href="/products">{t.account.noOrdersCta}</ButtonLink>} />
      )}
    </AccountSection>
  );
}
