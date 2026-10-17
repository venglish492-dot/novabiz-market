import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';

export default function NotFound() {
  return (
    <main id="main" className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 text-center">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_40%,rgb(182_92_255/0.18),transparent_60%)]" aria-hidden />
      <Logo />
      <p className="mt-10 font-mono text-sm text-lavender">404</p>
      <h1 className="mt-3 text-4xl font-bold">Nothing lives here — yet.</h1>
      <p className="mt-3 max-w-md text-muted">This page or profile doesn’t exist, isn’t published, or was moved. If it’s a username you like, it might still be available.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn btn-secondary">
          Go home
        </Link>
        <Link href="/signup" className="btn btn-primary">
          Claim a username
        </Link>
      </div>
    </main>
  );
}
