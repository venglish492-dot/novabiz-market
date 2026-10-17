'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main id="main" className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <p className="font-mono text-sm text-rose-300">Something went wrong</p>
      <h1 className="mt-3 text-3xl font-bold">We couldn’t load this page.</h1>
      <p className="mt-3 max-w-md text-muted">It’s probably temporary. Try again, and if it keeps happening let us know{error.digest ? ` (reference ${error.digest})` : ''}.</p>
      <div className="mt-8 flex gap-3">
        <button type="button" className="btn btn-primary" onClick={reset}>
          Try again
        </button>
        <Link href="/" className="btn btn-secondary">
          Home
        </Link>
      </div>
    </main>
  );
}
