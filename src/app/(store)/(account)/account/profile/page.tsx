import type { Metadata } from 'next';
import { getI18n } from '@/i18n/server';
import { requireUser } from '@/lib/auth/session';
import { getProfile } from '@/lib/account/queries';
import { pageMetadata } from '@/lib/seo/metadata';
import { ProfileForm } from '@/components/account/AccountForms';
import { AccountSection } from '../../AccountSection';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return pageMetadata({ title: t.account.profileTitle, description: t.account.profileSubtitle, path: '/account/profile', noIndex: true });
}

export default async function ProfilePage() {
  const { t } = await getI18n();
  const user = await requireUser('/account/profile');
  const profile = await getProfile(user.id);
  return (
    <AccountSection title={t.account.profileTitle} subtitle={t.account.profileSubtitle}>
      <ProfileForm name={profile?.fullName ?? user.name ?? ''} email={user.email} />
    </AccountSection>
  );
}
