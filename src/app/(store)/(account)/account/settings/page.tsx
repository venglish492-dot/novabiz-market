import type { Metadata } from 'next';
import { getI18n } from '@/i18n/server';
import { requireUser } from '@/lib/auth/session';
import { getProfile } from '@/lib/account/queries';
import { pageMetadata } from '@/lib/seo/metadata';
import { SettingsForm } from '@/components/account/AccountForms';
import { AccountSection } from '../../AccountSection';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return pageMetadata({ title: t.account.settingsTitle, description: t.account.settingsSubtitle, path: '/account/settings', noIndex: true });
}

export default async function SettingsPage() {
  const { t, locale } = await getI18n();
  const user = await requireUser('/account/settings');
  const profile = await getProfile(user.id);
  return (
    <AccountSection title={t.account.settingsTitle} subtitle={t.account.settingsSubtitle}>
      <SettingsForm locale={profile?.locale ?? locale} marketing={profile?.marketingOptIn ?? false} />
    </AccountSection>
  );
}
