'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, Circle, Globe } from 'lucide-react';
import { useEditor } from '../EditorProvider';
import { CopyButton } from '@/components/media/MediaActions';

export function OverviewSection({ stats }: { stats: { views: number; clicks: number; allTime: number } }) {
  const { doc, published, publish, publishing, username } = useEditor();
  const url = `/@${username}`;
  const steps = [
    { done: Boolean(doc.profile.avatarAssetId), label: 'Add an avatar', href: '/dashboard/profile' },
    { done: Boolean(doc.profile.description || doc.theme.typewriter.strings.length), label: 'Write a description', href: '/dashboard/profile' },
    { done: doc.links.length >= 2, label: 'Add at least two links', href: '/dashboard/socials' },
    { done: doc.theme.background.type !== 'preset' || doc.theme.background.presetId !== 'rainforest' || doc.theme.layout !== 'cinematic', label: 'Make the look your own', href: '/dashboard/layouts' },
    { done: published.isPublished, label: 'Publish your page', href: '#publish' },
  ];
  const done = steps.filter((s) => s.done).length;
  return (
    <div className="space-y-6">
      <section id="publish" className="card relative overflow-hidden p-6">
        <div className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-primary/20 blur-3xl" aria-hidden />
        <p className="eyebrow">{published.isPublished ? 'Live' : 'Draft'}</p>
        <h2 className="mt-2 font-display text-2xl font-bold">
          {published.isPublished ? (published.hasUnpublishedChanges ? 'You have unpublished changes' : 'Your page is live') : 'Your page isn’t published yet'}
        </h2>
        <p className="mt-2 font-mono text-sm text-muted">vybe{url}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" className="btn btn-primary" onClick={publish} disabled={publishing}>
            {publishing && <span className="spinner" />}
            {published.isPublished ? 'Publish changes' : 'Publish now'}
          </button>
          {published.isPublished && (
            <>
              <a href={url} target="_blank" rel="noopener" className="btn btn-secondary">
                <Globe className="size-4" aria-hidden /> Open page
              </a>
              <CopyButton text={url} label="Copy link" className="btn btn-secondary" />
            </>
          )}
        </div>
        {published.publishedAt && <p className="mt-3 text-xs text-faint">Last published {new Date(published.publishedAt).toLocaleString()}</p>}
      </section>

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Last 7 days">
        {[
          ['Views (7 days)', stats.views],
          ['Clicks (7 days)', stats.clicks],
          ['All-time views', stats.allTime],
        ].map(([label, value]) => (
          <div key={label} className="card p-5">
            <p className="text-sm text-muted">{label}</p>
            <p className="mt-1 font-display text-3xl font-bold tabular-nums">{new Intl.NumberFormat('en').format(value as number)}</p>
          </div>
        ))}
      </section>
      <Link href="/dashboard/analytics" className="inline-flex items-center gap-1 text-sm text-lavender hover:underline">
        Full analytics <ArrowRight className="size-4" aria-hidden />
      </Link>

      <section className="card p-6" aria-labelledby="checklist">
        <div className="flex items-center justify-between">
          <h2 id="checklist" className="font-display font-semibold">
            Setup checklist
          </h2>
          <span className="font-mono text-xs text-muted">
            {done}/{steps.length}
          </span>
        </div>
        <ul className="mt-4 space-y-1">
          {steps.map((step) => (
            <li key={step.label}>
              <Link href={step.href} className="flex min-h-11 items-center gap-3 rounded-xl px-2 text-sm hover:bg-white/5">
                {step.done ? <CheckCircle2 className="size-5 text-emerald-300" aria-label="Done" /> : <Circle className="size-5 text-faint" aria-label="To do" />}
                <span className={step.done ? 'text-muted line-through' : ''}>{step.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
