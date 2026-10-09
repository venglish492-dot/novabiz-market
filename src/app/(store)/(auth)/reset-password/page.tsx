import type { Metadata } from 'next';
import Link from 'next/link';
import { getI18n } from '@/i18n/server';
import { getSessionUser } from '@/lib/auth/session';
import { pageMetadata } from '@/lib/seo/metadata';
import { ResetPasswordForm } from '@/components/auth/AuthForms';
import { Notice } from '@/components/ui/Notice';
import { AuthShell } from '../AuthShell';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return pageMetadata({ title: t.auth.resetTitle, description: t.auth.resetSubtitle, path: '/reset-password', noIndex: true });
}

/** Reached via the emailed recovery link (which establishes a short-lived session). */
export default async function ResetPasswordPage() {
  const { t } = await getI18n();
  const user = await getSessionUser();
  return (
    <AuthShell title={t.auth.resetTitle} subtitle={t.auth.resetSubtitle}>
      {user ? (
        <ResetPasswordForm />
      ) : (
        <div className="flex flex-col gap-4">
          <Notice tone="warning">{t.auth.callbackError}</Notice>
          <Link href="/forgot-password" className="text-center text-sm text-fg hover:underline">
            {t.auth.forgotTitle}
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
