import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getI18n } from '@/i18n/server';
import { getSessionUser, safeNextPath } from '@/lib/auth/session';
import { pageMetadata } from '@/lib/seo/metadata';
import { RegisterForm } from '@/components/auth/AuthForms';
import { AuthShell } from '../AuthShell';

type Props = { searchParams: Promise<{ next?: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return pageMetadata({ title: t.auth.registerTitle, description: t.auth.registerSubtitle, path: '/register', noIndex: true });
}

export default async function RegisterPage({ searchParams }: Props) {
  const { t } = await getI18n();
  const next = safeNextPath((await searchParams).next, '/library');
  if (await getSessionUser()) redirect(next);
  return (
    <AuthShell title={t.auth.registerTitle} subtitle={t.auth.registerSubtitle}>
      <RegisterForm next={next} />
    </AuthShell>
  );
}
