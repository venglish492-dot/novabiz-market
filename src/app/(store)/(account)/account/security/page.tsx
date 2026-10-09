import type { Metadata } from 'next';
import { getI18n } from '@/i18n/server';
import { requireUser } from '@/lib/auth/session';
import { signOutAction } from '@/lib/actions/auth';
import { pageMetadata } from '@/lib/seo/metadata';
import { PasswordForm } from '@/components/account/AccountForms';
import { Button } from '@/components/ui/Button';
import { AccountSection } from '../../AccountSection';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return pageMetadata({ title: t.account.securityTitle, description: t.account.securitySubtitle, path: '/account/security', noIndex: true });
}

export default async function SecurityPage() {
  const { t } = await getI18n();
  await requireUser('/account/security');
  return (
    <AccountSection title={t.account.securityTitle} subtitle={t.account.securitySubtitle}>
      <PasswordForm />
      <div className="mt-12 max-w-md border-t border-line pt-8">
        <h2 className="text-base font-semibold text-fg">{t.account.signOutTitle}</h2>
        <p className="mt-1 text-sm text-fg-muted">{t.account.signOutBody}</p>
        <form action={signOutAction} className="mt-4">
          <Button type="submit" variant="secondary">
            {t.nav.signOut}
          </Button>
        </form>
      </div>
    </AccountSection>
  );
}
