import { Logo } from '@/components/ui/Logo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 py-12">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_50%_40%,#000_10%,transparent_65%)]" />
        <div className="absolute left-1/2 top-1/3 h-[520px] w-[820px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(182_92_255/0.22),transparent)] blur-2xl" />
      </div>
      <div className="mb-8">
        <Logo />
      </div>
      <main id="main" className="w-full max-w-md">
        {children}
      </main>
    </div>
  );
}
