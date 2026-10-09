import type { Metadata } from 'next';
import StoreLayout from './(store)/layout';
import { NotFoundContent } from '@/components/layout/NotFoundContent';

export const metadata: Metadata = { title: '404', robots: { index: false, follow: true } };

/** Unmatched URLs render inside the full store chrome so visitors can recover. */
export default function NotFound() {
  return (
    <StoreLayout>
      <NotFoundContent />
    </StoreLayout>
  );
}
