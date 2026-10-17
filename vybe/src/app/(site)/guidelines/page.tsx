import type { Metadata } from 'next';
import { LegalPage } from '@/components/marketing/LegalPage';
import { GUIDELINES } from '@/content/legal';

export const metadata: Metadata = { title: 'Community guidelines', alternates: { canonical: '/guidelines' } };

export default function Page() {
  return <LegalPage doc={GUIDELINES} />;
}
