import type { Metadata } from 'next';
import { LegalPage } from '@/components/marketing/LegalPage';
import { TERMS } from '@/content/legal';

export const metadata: Metadata = { title: 'Terms of service', alternates: { canonical: '/terms' } };

export default function Page() {
  return <LegalPage doc={TERMS} />;
}
