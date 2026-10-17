import type { Metadata } from 'next';
import Link from 'next/link';
import { ResetForm } from '@/components/auth/AuthForms';

export const metadata: Metadata = { title: 'Choose a new password', robots: { index: false } };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const token = String((await searchParams).token ?? '');
  return (
    <div className="glass rounded-3xl p-6 sm:p-8">
      <h1 className="text-2xl font-bold">Choose a new password</h1>
      {token ? (
        <div className="mt-6">
          <ResetForm token={token} />
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted">
          This page needs a reset link.{' '}
          <Link href="/forgot-password" className="text-lavender hover:underline">
            Request one
          </Link>
          .
        </p>
      )}
    </div>
  );
}
