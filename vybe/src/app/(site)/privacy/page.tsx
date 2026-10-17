import type { Metadata } from 'next';
import { LegalPage } from '@/components/marketing/LegalPage';
import { PRIVACY } from '@/content/legal';

export const metadata: Metadata = { title: 'Privacy policy', alternates: { canonical: '/privacy' } };

export default function Page() {
  return <LegalPage doc={PRIVACY} />;
}
