'use client';

import { useRef } from 'react';
import { useProfile } from '../context';
import { AudioPlayer } from '../AudioPlayer';
import { Avatar, Badges, Description, LinkButtons, SocialIcons, Username, enter } from '../parts';
import { WidgetList } from '../widgets/WidgetView';
import { useTilt } from './useTilt';

function Corner({ className }: { className: string }) {
  return <span className={`pointer-events-none absolute size-5 border-[var(--p-accent)] ${className}`} aria-hidden />;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-dashed border-[var(--p-line)] py-1.5 last:border-0">
      <dt className="p-muted font-mono text-[10px] uppercase tracking-[0.2em]">{label}</dt>
      <dd className="truncate text-right font-mono text-[0.85em]">{value}</dd>
    </div>
  );
}

/** Layout D — HUD panel with bracket corners, data readouts and a scanline sheen. */
export function FuturisticLayout() {
  const { profile, theme, motion } = useProfile();
  const ref = useRef<HTMLElement>(null);
  useTilt(ref, motion && theme.effects.cardTilt, 3);
  const p = profile.doc.profile;
  const links = profile.doc.links.filter((l) => l.visible);
  return (
    <div className="p-enter w-full" style={{ maxWidth: 'max(var(--p-card-width), 640px)' }}>
      <article ref={ref} className="p-card p-tilt relative overflow-hidden !rounded-[min(var(--p-card-radius),14px)]" data-gradient={theme.gradient.card}>
        <Corner className="left-2 top-2 border-l-2 border-t-2" />
        <Corner className="right-2 top-2 border-r-2 border-t-2" />
        <Corner className="bottom-2 left-2 border-b-2 border-l-2" />
        <Corner className="bottom-2 right-2 border-b-2 border-r-2" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, #fff 0 1px, transparent 1px 4px)' }} aria-hidden />
        <div className="p-muted mb-4 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.25em]">
          <span>ID // {profile.username}</span>
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 animate-pulse rounded-full bg-[var(--p-accent)]" aria-hidden /> online
          </span>
        </div>
        <div className="grid gap-6 @xl:grid-cols-[auto_1fr]">
          <div {...enter(1, 'flex flex-col items-center gap-3')}>
            <Avatar />
            <Badges />
          </div>
          <div className="min-w-0 space-y-3">
            <div {...enter(2)}>
              <Username />
            </div>
            <div {...enter(3)}>
              <Description className="text-[0.95em]" />
            </div>
            <dl {...enter(4, 'p-sub px-3 py-1')}>
              {theme.visibility.status && p.statusText && <Row label="Status" value={p.statusText} />}
              {theme.visibility.location && p.location && <Row label="Location" value={p.location} />}
              {theme.visibility.views && <Row label="Views" value={new Intl.NumberFormat('en').format(profile.viewCount)} />}
              <Row label="Links" value={String(links.length).padStart(2, '0')} />
            </dl>
          </div>
        </div>
        <div className="my-5 h-px" style={{ background: 'linear-gradient(90deg, var(--p-accent), transparent)' }} />
        <SocialIcons />
        {theme.audio.placement === 'card' && <AudioPlayer className="mt-5" />}
        <LinkButtons className="mt-5" />
        <WidgetList widgets={profile.doc.widgets.filter((w) => w.visible)} className="mt-5" />
      </article>
    </div>
  );
}
