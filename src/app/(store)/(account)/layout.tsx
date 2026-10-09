import { getI18n } from '@/i18n/server';
import { requireUser } from '@/lib/auth/session';
import { AccountNav } from '@/components/account/AccountNav';

/** Signed-in area. Every page and action re-checks the session on the server. */
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const { t } = await getI18n();
  const user = await requireUser('/account');
  return (
    <div className="container-page py-10 lg:py-14">
      <div className="mb-8 flex flex-col gap-1 border-b border-line pb-8">
        <p className="t-eyebrow">{t.account.eyebrow}</p>
        <p className="text-sm text-fg-muted">{user.email}</p>
      </div>
      <div className="grid gap-8 lg:grid-cols-[200px_1fr] lg:gap-14">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <AccountNav />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
