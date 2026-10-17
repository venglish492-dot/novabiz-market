import type { Metadata } from 'next';
import Link from 'next/link';
import { ForgotForm } from '@/components/auth/AuthForms';

export const metadata: Metadata = { title: 'Reset your password', robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <div className="glass rounded-3xl p-6 sm:p-8">
      <h1 className="text-2xl font-bold">Reset your password</h1>
      <p className="mt-1.5 text-sm text-muted">We’ll email you a link that works for 30 minutes.</p>
      <div className="mt-6">
        <ForgotForm />
      </div>
      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="text-lavender hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
