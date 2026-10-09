import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getI18n } from '@/i18n/server';
import { getSessionUser, safeNextPath } from '@/lib/auth/session';
import { pageMetadata } from '@/lib/seo/metadata';
import { LoginForm } from '@/components/auth/AuthForms';
import { Notice } from '@/components/ui/Notice';
import { AuthShell } from '../AuthShell';

type Props = { searchParams: Promise<{ next?: string; error?: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return pageMetadata({ title: t.auth.loginTitle, description: t.auth.loginSubtitle, path: '/login', noIndex: true });
}

export default async function LoginPage({ searchParams }: Props) {
  const { t } = await getI18n();
  const params = await searchParams;
  const next = safeNextPath(params.next, '/library');
  if (await getSessionUser()) redirect(next);
  return (
    <AuthShell title={t.auth.loginTitle} subtitle={t.auth.loginSubtitle}>
      {params.error && (
        <div className="mb-5">
          <Notice tone="danger" role="alert">
            {t.auth.callbackError}
          </Notice>
        </div>
      )}
      <LoginForm next={next} />
    </AuthShell>
  );
}
