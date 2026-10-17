import Link from 'next/link';
import { Eye } from 'lucide-react';
import type { ProfileCard as Card } from '@/features/profiles/service';
import { getScenePreset, LAYOUT_INFO } from '@/features/themes/presets';
import type { LayoutId } from '@/features/themes/schema';

export function ProfileCard({ card, rank }: { card: Card; rank?: number }) {
  const scene = getScenePreset(card.preset);
  return (
    <Link
      href={`/@${card.username}`}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-line bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-line-strong hover:shadow-[0_24px_60px_-24px_var(--accent)]"
      style={{ '--accent': card.accent } as React.CSSProperties}
    >
      <div className="relative h-28 overflow-hidden" style={{ background: `linear-gradient(135deg, ${scene.swatch[0]}, ${scene.swatch[1]} 65%, ${scene.swatch[2]})` }}>
        <div className="absolute inset-0 opacity-50 transition-opacity group-hover:opacity-80" style={{ background: `radial-gradient(circle at 75% 20%, ${card.accent}55, transparent 60%)` }} />
        {rank !== undefined && <span className="absolute left-4 top-3 font-mono text-xs font-bold text-white/80">#{rank}</span>}
        {card.isDemo && <span className="absolute right-3 top-3 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white/85 backdrop-blur">Demo</span>}
      </div>
      <div className="-mt-9 flex flex-1 flex-col px-5 pb-5">
        {card.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- user media
          <img src={card.avatarUrl} alt="" className="size-16 rounded-full border-4 border-surface object-cover" loading="lazy" />
        ) : (
          <div className="flex size-16 items-center justify-center rounded-full border-4 border-surface text-xl font-bold" style={{ background: card.accent }}>
            {card.displayName.slice(0, 1).toUpperCase()}
          </div>
        )}
        <p className="mt-3 truncate font-display text-lg font-semibold">{card.displayName}</p>
        <p className="truncate font-mono text-xs text-muted">@{card.username}</p>
        {card.description && <p className="mt-2 line-clamp-2 text-sm text-muted">{card.description}</p>}
        <div className="mt-auto flex items-center justify-between pt-4 text-xs text-faint">
          <span>{LAYOUT_INFO[card.layout as LayoutId]?.name ?? 'Custom'} · {scene.name}</span>
          <span className="inline-flex items-center gap-1">
            <Eye className="size-3.5" aria-hidden /> {new Intl.NumberFormat('en', { notation: 'compact' }).format(card.viewCount)}
          </span>
        </div>
      </div>
    </Link>
  );
}
