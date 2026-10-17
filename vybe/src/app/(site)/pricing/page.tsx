import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, Heart, Sparkles } from 'lucide-react';
import { FEATURE_GROUPS } from '@/content/features';
import { brand } from '@/config/brand';

export const metadata: Metadata = {
  title: 'Pricing',
  description: `${brand.name} is free forever. Every layout, effect, font, widget and analytics feature is included for every account.`,
  alternates: { canonical: '/pricing' },
};

export default function PricingPage() {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[600px] bg-[radial-gradient(ellipse_at_50%_0%,rgb(182_92_255/0.18),transparent_60%)]" aria-hidden />
      <div className="container-page py-16 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Pricing</p>
          <h1 className="mt-4 text-4xl font-bold sm:text-5xl">$0 forever. Every feature included.</h1>
          <p className="mt-4 text-lg text-muted">No premium tier is required — and none exists. Layouts, fonts, effects, widgets, analytics and media hosting are free for everyone.</p>
        </div>

        <div className="mx-auto mt-14 grid max-w-5xl items-start gap-6 lg:grid-cols-[1.35fr_1fr]">
          {/* The plan */}
          <section aria-labelledby="plan" className="relative overflow-hidden rounded-[28px] border border-primary/35 bg-gradient-to-b from-[#1d1230] via-[#140d22] to-[#0e0c16] p-8 shadow-[0_40px_100px_-40px_rgb(182_92_255/0.6)]">
            <div className="pointer-events-none absolute -right-10 -top-16 size-64 rounded-full bg-primary/20 blur-3xl" aria-hidden />
            <span className="absolute right-6 top-6 rounded-full bg-black/40 px-3 py-1 text-xs font-semibold text-lavender ring-1 ring-primary/40">The only plan</span>
            <h2 id="plan" className="flex items-center gap-2 text-2xl font-semibold">
              <Sparkles className="size-6 text-lavender" aria-hidden /> Everything
            </h2>
            <p className="mt-6 flex items-baseline gap-2">
              <span className="font-display text-6xl font-bold">$0</span>
              <span className="text-lg text-muted">/ forever</span>
            </p>
            <p className="mt-2 font-medium text-lavender">No trial. No card. No upgrade screen.</p>
            <p className="mt-5 max-w-md text-muted">The full creative toolkit for building a page that looks professionally designed.</p>
            <div className="mt-8 grid gap-x-8 gap-y-6 sm:grid-cols-2">
              {FEATURE_GROUPS.map((group) => (
                <div key={group.title}>
                  <h3 className="text-sm font-semibold">{group.title}</h3>
                  <ul className="mt-3 space-y-2.5">
                    {group.items.map((item) => (
                      <li key={item} className="flex gap-2.5 text-[15px]">
                        <Check className="mt-0.5 size-[18px] shrink-0 text-primary" aria-hidden />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <Link href="/signup" className="btn btn-primary mt-10 w-full !min-h-13 text-base">
              Get started — it’s free
            </Link>
          </section>

          {/* Voluntary support, clearly separate */}
          <aside aria-labelledby="support" className="rounded-[28px] border border-line bg-[#111118] p-8">
            <h2 id="support" className="flex items-center gap-2 text-xl font-semibold">
              <Heart className="size-5 text-rose-300" aria-hidden /> Supporting {brand.name}
            </h2>
            <p className="mt-4 text-muted">Voluntary support may be offered in the future to help cover hosting. It will never unlock features, remove limits or change how your page looks.</p>
            <p className="mt-4 text-sm text-muted">There is no checkout on this site today, and nothing on your page depends on paying.</p>
            <div className="mt-8 rounded-2xl border border-line bg-white/[0.03] p-5">
              <h3 className="text-sm font-semibold">Fair-use limits (the same for everyone)</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                <li>Images up to 15 MB · videos up to 80 MB · audio up to 20 MB</li>
                <li>1 GB of media per account</li>
                <li>3 aliases, 40 links, 40 widgets, 6 tabs</li>
              </ul>
              <p className="mt-3 text-xs text-faint">These protect the infrastructure from abuse. They are not upsells.</p>
            </div>
            <Link href="/compare" className="btn btn-secondary mt-8 w-full">
              How we compare
            </Link>
          </aside>
        </div>

        <section className="mx-auto mt-24 max-w-3xl" aria-labelledby="faq">
          <h2 id="faq" className="text-center text-3xl font-bold">
            Questions
          </h2>
          <dl className="mt-10 divide-y divide-line rounded-3xl border border-line bg-white/[0.02]">
            {[
              ['Is it really free?', 'Yes. Every customization and creator feature is available to every account, with no premium tier.'],
              ['How do you keep it running?', 'Efficient infrastructure and fair-use limits. If optional donations are ever added, they will not unlock anything.'],
              ['Do you show ads on my page?', 'No. Your page shows your content, plus a small “Made with VYBE” link in the footer.'],
              ['Can I get verified?', 'Verification is granted by moderators for notable or at-risk accounts. It is never sold. Decorative badges are free and can’t imitate verification.'],
            ].map(([q, a]) => (
              <div key={q} className="p-6">
                <dt className="font-semibold">{q}</dt>
                <dd className="mt-2 text-muted">{a}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </div>
  );
}
