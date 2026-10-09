import { requireAdmin } from '@/lib/auth/session';
import { adminCustomers } from '@/lib/admin/queries';
import { setRoleAction } from '@/lib/actions/admin';
import { USER_ROLES } from '@/lib/auth/roles';
import { formatDate } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';
import { AdminPage, EmptyRow, Table, Td, Th, inputClass } from '@/components/admin/ui';
import { getAdminI18n } from '../admin-i18n';

/** Minimal customer data: email, name, role, sign-up date and paid order count. */
export default async function AdminCustomersPage() {
  const user = await requireAdmin();
  const { a, locale } = await getAdminI18n();
  const customers = await adminCustomers();
  const canChangeRoles = user.role === 'super_admin';
  return (
    <AdminPage title={a.nav.customers} description={a.customers.roleNote}>
      <Table minWidth={760}>
        <thead>
          <tr>
            <Th>{a.customers.email}</Th>
            <Th>{a.customers.name}</Th>
            <Th>{a.customers.role}</Th>
            <Th className="text-right">{a.customers.orders}</Th>
            <Th>{a.customers.joined}</Th>
          </tr>
        </thead>
        <tbody>
          {customers.length ? (
            customers.map((customer) => (
              <tr key={String(customer.id)}>
                <Td className="text-fg">{String(customer.email)}</Td>
                <Td className="text-fg-muted">{String(customer.full_name ?? '—')}</Td>
                <Td>
                  {canChangeRoles && customer.id !== user.id ? (
                    <form action={setRoleAction} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={String(customer.id)} />
                      <select name="role" defaultValue={String(customer.role)} className={`${inputClass} h-8 w-36 text-xs`} aria-label={a.customers.changeRole}>
                        {USER_ROLES.map((role) => (
                          <option key={role} value={role}>
                            {a.customers.roles[role]}
                          </option>
                        ))}
                      </select>
                      <button type="submit" className="text-xs text-accent hover:underline">
                        {a.common.save}
                      </button>
                    </form>
                  ) : (
                    <Badge tone={customer.role === 'buyer' ? 'neutral' : 'accent'}>{a.customers.roles[customer.role as keyof typeof a.customers.roles]}</Badge>
                  )}
                </Td>
                <Td className="text-right tabular-nums">{customer.paidOrders}</Td>
                <Td className="text-fg-muted">{formatDate(String(customer.created_at), locale, 'short')}</Td>
              </tr>
            ))
          ) : (
            <EmptyRow colSpan={5} label={a.common.empty} />
          )}
        </tbody>
      </Table>
    </AdminPage>
  );
}
