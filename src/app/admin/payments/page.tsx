import { requireAdmin } from '@/lib/auth/session';
import { adminPayments } from '@/lib/admin/queries';
import { formatDate, formatMoney } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';
import { AdminPage, EmptyRow, Table, Td, Th } from '@/components/admin/ui';
import { getAdminI18n } from '../admin-i18n';

export default async function AdminPaymentsPage() {
  await requireAdmin();
  const { a, locale } = await getAdminI18n();
  const { payments, events } = await adminPayments();
  return (
    <AdminPage title={a.nav.payments}>
      <Table minWidth={820}>
        <thead>
          <tr>
            <Th>{a.orders.number}</Th>
            <Th>{a.orders.provider}</Th>
            <Th>{a.common.status}</Th>
            <Th className="text-right">{a.orders.total}</Th>
            <Th>{a.common.created}</Th>
          </tr>
        </thead>
        <tbody>
          {payments.length ? (
            payments.map((payment) => (
              <tr key={String(payment.id)}>
                <Td className="t-mono text-xs">{String((payment.order as Record<string, unknown> | null)?.order_number ?? '—')}</Td>
                <Td className="text-fg-muted">
                  {String(payment.provider)}
                  <div className="t-mono truncate text-xs text-fg-subtle">{String(payment.provider_payment_id ?? payment.provider_session_id ?? '')}</div>
                </Td>
                <Td>
                  <Badge tone={payment.status === 'succeeded' ? 'success' : payment.status === 'failed' ? 'danger' : 'neutral'}>{String(payment.status)}</Badge>
                  {payment.failure_reason ? <div className="mt-1 text-xs text-fg-subtle">{String(payment.failure_reason)}</div> : null}
                </Td>
                <Td className="text-right tabular-nums">{formatMoney(Number(payment.amount), String(payment.currency).trim(), locale)}</Td>
                <Td className="text-fg-muted">{formatDate(String(payment.created_at), locale, 'datetime')}</Td>
              </tr>
            ))
          ) : (
            <EmptyRow colSpan={5} label={a.common.empty} />
          )}
        </tbody>
      </Table>

      <h2 className="mb-4 mt-10 text-base font-semibold text-fg">{a.payments.events}</h2>
      <Table minWidth={720}>
        <thead>
          <tr>
            <Th>{a.payments.eventId}</Th>
            <Th>{a.payments.type}</Th>
            <Th>{a.payments.received}</Th>
            <Th>{a.payments.processed}</Th>
          </tr>
        </thead>
        <tbody>
          {events.length ? (
            events.map((event) => (
              <tr key={String(event.id)}>
                <Td className="t-mono text-xs">
                  {String(event.event_id)}
                  <div className="font-sans text-fg-subtle">{String(event.provider)}</div>
                </Td>
                <Td className="text-fg-muted">{String(event.event_type)}</Td>
                <Td className="text-fg-muted">{formatDate(String(event.received_at), locale, 'datetime')}</Td>
                <Td className="text-fg-muted">{event.processed_at ? formatDate(String(event.processed_at), locale, 'datetime') : '—'}</Td>
              </tr>
            ))
          ) : (
            <EmptyRow colSpan={4} label={a.common.empty} />
          )}
        </tbody>
      </Table>
    </AdminPage>
  );
}
