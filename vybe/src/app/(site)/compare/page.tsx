import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, Minus } from 'lucide-react';
import { PageHeader } from '@/components/marketing/PageHeader';
import { brand } from '@/config/brand';

export const metadata: Metadata = { title: 'Compare', description: `What ${brand.name} includes for free, and how it approaches link-in-bio pages differently.`, alternates: { canonical: '/compare' } };

const ROWS: [string, string][] = [
  ['Multiple profile layouts', 'Often a paid upgrade'],
  ['Custom & uploaded fonts', 'Often a paid upgrade'],
  ['Typewriter / rotating bio', 'Often a paid upgrade'],
  ['Cursor & profile effects', 'Often a paid upgrade'],
  ['Second tab / multi-tab profiles', 'Often a paid upgrade'],
  ['SEO title, description, OG image, favicon', 'Often a paid upgrade'],
  ['Profile analytics', 'Usually free'],
  ['Background images & videos', 'Usually free'],
  ['Music player', 'Usually free'],
  ['Profile aliases', 'Often limited without upgrade'],
  ['Verification', 'Sometimes sold'],
];

export default function ComparePage() {
  return (
    <>
      <PageHeader eyebrow="Compare" title="Everything others upsell, included." description="Typical link-in-bio platforms split features between a free tier and a paid tier. VYBE doesn’t have tiers." />
      <div className="container-page py-14">
        <div className="overflow-x-auto rounded-3xl border border-line">
          <table className="w-full min-w-[560px] text-left text-sm">
            <caption className="sr-only">Feature comparison</caption>
            <thead className="bg-white/[0.03] text-xs uppercase tracking-wider text-muted">
              <tr>
                <th scope="col" className="p-4 font-semibold">Feature</th>
                <th scope="col" className="p-4 font-semibold text-lavender">{brand.name}</th>
                <th scope="col" className="p-4 font-semibold">Typical alternatives</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {ROWS.map(([feature, other]) => (
                <tr key={feature}>
                  <th scope="row" className="p-4 font-medium">{feature}</th>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1.5 text-emerald-300">
                      <Check className="size-4" aria-hidden /> {feature === 'Verification' ? 'Moderator-granted, never sold' : 'Free'}
                    </span>
                  </td>
                  <td className="p-4 text-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <Minus className="size-4" aria-hidden /> {other}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-faint">“Typical alternatives” summarises common industry practice and public pricing pages at the time of writing; individual platforms differ and change over time.</p>
        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {[
            ['Privacy-first analytics', 'No cookies, no fingerprinting, no stored IP addresses. Visitors with Global Privacy Control are counted without referrer or location.'],
            ['Safe by design', 'Only https and mailto links, magic-byte checked uploads, re-encoded images with metadata stripped, and no user HTML or scripts.'],
            ['Accessible motion', 'Every animation respects reduced-motion settings, and creators can switch all motion off with one toggle.'],
          ].map(([title, body]) => (
            <div key={title} className="card p-6">
              <h2 className="font-semibold">{title}</h2>
              <p className="mt-2 text-sm text-muted">{body}</p>
            </div>
          ))}
        </div>
        <div className="mt-14 text-center">
          <Link href="/signup" className="btn btn-primary">Create your free page</Link>
        </div>
      </div>
    </>
  );
}
