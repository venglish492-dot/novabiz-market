import type { Metadata } from 'next';
import { getI18n } from '@/i18n/server';
import { pageMetadata } from '@/lib/seo/metadata';
import { ForgotPasswordForm } from '@/components/auth/AuthForms';
import { AuthShell } from '../AuthShell';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return pageMetadata({ title: t.auth.forgotTitle, description: t.auth.forgotSubtitle, path: '/forgot-password', noIndex: true });
}

export default async function ForgotPasswordPage() {
  const { t } = await getI18n();
  return (
    <AuthShell title={t.auth.forgotTitle} subtitle={t.auth.forgotSubtitle}>
      <ForgotPasswordForm />
    </AuthShell>
  );
}
