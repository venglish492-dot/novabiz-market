import type { Metadata } from 'next';
import { getI18n } from '@/i18n/server';
import { getAdminDictionary } from '@/i18n/admin';
import { requireStaff } from '@/lib/auth/session';
import { isAdminRole } from '@/lib/auth/roles';
import { AdminI18nProvider } from '@/components/admin/AdminI18n';
import { AdminShell } from '@/components/admin/AdminShell';

export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
};

/**
 * Admin area. Access is enforced on the server: unauthenticated visitors are
 * redirected to sign in, and accounts without a staff role receive a 404.
 * Each admin-only page and every action re-checks the role.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff('/admin');
  const { locale } = await getI18n();
  return (
    <AdminI18nProvider dictionary={getAdminDictionary(locale)}>
      <AdminShell isAdmin={isAdminRole(user.role)} email={user.email}>
        {children}
      </AdminShell>
    </AdminI18nProvider>
  );
}
