import type { Metadata } from 'next';
import { getI18n } from '@/i18n/server';
import { getLegalDocument } from '@/content/legal';
import { pageMetadata } from '@/lib/seo/metadata';
import { LegalPage } from '@/components/layout/LegalPage';

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getI18n();
  const doc = getLegalDocument('terms', locale);
  return pageMetadata({ title: doc.title, description: doc.description, path: '/terms' });
}

export default async function Page() {
  const { t, locale } = await getI18n();
  return <LegalPage doc={getLegalDocument('terms', locale)} path="/terms" t={t} locale={locale} />;
}
