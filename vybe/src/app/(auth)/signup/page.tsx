import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { SignupForm } from '@/components/auth/AuthForms';
import { getCurrentUser } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Create your page', robots: { index: false } };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ username?: string }> }) {
  if (await getCurrentUser()) redirect('/dashboard');
  const initial = String((await searchParams).username ?? '').replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 24);
  return (
    <div className="glass rounded-3xl p-6 sm:p-8">
      <h1 className="text-2xl font-bold">Create your page</h1>
      <p className="mt-1.5 text-sm text-muted">Free forever. Every feature included.</p>
      <div className="mt-6">
        <SignupForm initialUsername={initial} />
      </div>
      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-lavender hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
