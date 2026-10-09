import { requireAdmin } from '@/lib/auth/session';
import { adminAudit } from '@/lib/admin/queries';
import { formatDate } from '@/lib/format';
import { AdminPage, EmptyRow, Table, Td, Th } from '@/components/admin/ui';
import { getAdminI18n } from '../admin-i18n';

export default async function AdminAuditPage() {
  await requireAdmin();
  const { a, locale } = await getAdminI18n();
  const entries = await adminAudit();
  return (
    <AdminPage title={a.nav.audit}>
      <Table minWidth={760}>
        <thead>
          <tr>
            <Th>{a.audit.when}</Th>
            <Th>{a.audit.actor}</Th>
            <Th>{a.audit.action}</Th>
            <Th>{a.audit.entity}</Th>
          </tr>
        </thead>
        <tbody>
          {entries.length ? (
            entries.map((entry) => (
              <tr key={String(entry.id)}>
                <Td className="whitespace-nowrap text-fg-muted">{formatDate(String(entry.created_at), locale, 'datetime')}</Td>
                <Td className="text-fg-muted">{String(entry.actor_email ?? '—')}</Td>
                <Td className="t-mono text-xs text-fg">{String(entry.action)}</Td>
                <Td className="text-fg-muted">
                  <span className="t-mono text-xs">
                    {String(entry.entity_type)}:{String(entry.entity_id ?? '')}
                  </span>
                  {entry.summary ? <div className="text-xs">{String(entry.summary)}</div> : null}
                </Td>
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
