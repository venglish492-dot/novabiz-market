import Link from 'next/link';
import { pick } from '@/i18n/config';
import { requireAdmin } from '@/lib/auth/session';
import { adminOrders } from '@/lib/admin/queries';
import { refundOrderAction } from '@/lib/actions/admin';
import { formatDate, formatMoney } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';
import { ActionForm } from '@/components/admin/ActionForm';
import { AdminPage, EmptyRow, Table, Td, Th } from '@/components/admin/ui';
import { getAdminI18n } from '../admin-i18n';

const STATUSES = ['pending', 'payment_pending', 'paid', 'failed', 'cancelled', 'refunded'] as const;

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdmin();
  const { a, t, locale } = await getAdminI18n();
  const { status } = await searchParams;
  const active = STATUSES.find((s) => s === status);
  const orders = await adminOrders(active);

  return (
    <AdminPage title={a.nav.orders}>
      <nav className="mb-5 flex flex-wrap gap-1.5" aria-label={a.common.status}>
        <Link href="/admin/orders" aria-current={!active ? 'page' : undefined} className="rounded-full border border-line px-3 py-1.5 text-xs text-fg-muted aria-[current=page]:border-accent aria-[current=page]:text-fg">
          {a.common.all}
        </Link>
        {STATUSES.map((s) => (
          <Link key={s} href={`/admin/orders?status=${s}`} aria-current={active === s ? 'page' : undefined} className="rounded-full border border-line px-3 py-1.5 text-xs text-fg-muted aria-[current=page]:border-accent aria-[current=page]:text-fg">
            {t.orderStatus[s]}
          </Link>
        ))}
      </nav>
      <Table minWidth={900}>
        <thead>
          <tr>
            <Th>{a.orders.number}</Th>
            <Th>{a.orders.customer}</Th>
            <Th>{a.orders.items}</Th>
            <Th>{a.common.status}</Th>
            <Th className="text-right">{a.orders.total}</Th>
            <Th>{a.common.actions}</Th>
          </tr>
        </thead>
        <tbody>
          {orders.length ? (
            orders.map((order) => (
              <tr key={String(order.id)}>
                <Td className="t-mono text-xs">
                  {String(order.order_number)}
                  {Boolean(order.is_test) && <Badge tone="warning" className="ml-2">{a.common.test}</Badge>}
                  <div className="mt-1 font-sans text-fg-subtle">{formatDate(String(order.created_at), locale, 'datetime')}</div>
                  <div className="font-sans text-fg-subtle">{String(order.provider ?? '—')}</div>
                </Td>
                <Td className="text-fg-muted">{String(order.email)}</Td>
                <Td className="max-w-[260px] text-fg-muted">
                  {((order.items ?? []) as Array<{ title_snapshot: Record<string, string> }>).map((item) => pick(item.title_snapshot as never, locale)).join(', ')}
                  {order.coupon_code ? <div className="text-xs text-fg-subtle">{String(order.coupon_code)}</div> : null}
                </Td>
                <Td>
                  <Badge tone={order.status === 'paid' ? 'success' : order.status === 'refunded' ? 'neutral' : order.status === 'failed' || order.status === 'cancelled' ? 'danger' : 'warning'}>
                    {t.orderStatus[order.status as keyof typeof t.orderStatus]}
                  </Badge>
                </Td>
                <Td className="text-right tabular-nums">{formatMoney(Number(order.total_amount), String(order.currency).trim(), locale)}</Td>
                <Td>
                  {order.status === 'paid' && (
                    <ActionForm action={refundOrderAction} submitLabel={a.orders.refund} variant="danger" confirmMessage={a.orders.refundConfirm}>
                      <input type="hidden" name="order_id" value={String(order.id)} />
                    </ActionForm>
                  )}
                </Td>
              </tr>
            ))
          ) : (
            <EmptyRow colSpan={6} label={a.common.empty} />
          )}
        </tbody>
      </Table>
    </AdminPage>
  );
}
