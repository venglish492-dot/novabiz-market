'use client';

import { MapPin } from 'lucide-react';
import { getPlatform } from '@/features/socials/platforms';
import { useProfile } from '../context';
import { AudioPlayer } from '../AudioPlayer';
import { PlatformIcon } from '../icons';
import { Avatar, Badges, Description, Handle, Username, ViewCounter } from '../parts';
import { WidgetView } from '../widgets/WidgetView';

/** Layout F — a modular grid of tiles for identity, links, media and widgets. */
export function BentoLayout() {
  const { profile, theme, onLinkClick } = useProfile();
  const cols = theme.layoutOptions.bentoColumns;
  const p = profile.doc.profile;
  const links = profile.doc.links.filter((l) => l.visible);
  const widgets = profile.doc.widgets.filter((w) => w.visible);
  const gridCols = cols === 4 ? '@4xl:grid-cols-4' : cols === 2 ? '' : '@3xl:grid-cols-3';
  let i = 0;
  const tile = (extra = '') => ({ className: `p-tile p-enter p-4 ${extra}`, style: { '--i': i++ } as React.CSSProperties });

  return (
    <div className={`grid w-full max-w-[1000px] grid-flow-row-dense grid-cols-2 gap-3 ${gridCols}`}>
      <section {...tile('col-span-2 flex flex-col justify-between gap-4 @md:flex-row @md:items-center')}>
        <div className="flex items-center gap-4">
          <Avatar size={Math.min(theme.avatar.size, 96)} />
          <div className="min-w-0">
            <Username />
            <Handle />
          </div>
        </div>
        <Badges />
      </section>
      {(p.description || theme.typewriter.enabled) && (
        <section {...tile('col-span-2 flex items-center')}>
          <Description className="text-[1.02em]" />
        </section>
      )}
      {theme.visibility.socials &&
        links.map((link) => {
          const platform = getPlatform(link.platform);
          const color = link.accent ?? platform.color;
          const t = tile('group flex min-h-28 flex-col justify-between transition-transform hover:-translate-y-0.5');
          return (
            <a
              key={link.id}
              href={link.url}
              target={link.newTab ? '_blank' : undefined}
              rel="noopener noreferrer nofollow ugc"
              onClick={() => onLinkClick(link.id)}
              className={t.className}
              style={{ ...t.style, background: `linear-gradient(160deg, color-mix(in srgb, ${color} 22%, transparent), var(--p-surface))` }}
            >
              <PlatformIcon platform={link.platform} className="size-7" />
              <span className="p-btn-font truncate text-sm font-semibold">{link.label || platform.label}</span>
            </a>
          );
        })}
      {theme.visibility.views && (
        <section {...tile('flex flex-col justify-between gap-3 self-start')}>
          <span className="p-muted text-xs uppercase tracking-widest">Views</span>
          <ViewCounter className="self-start" />
        </section>
      )}
      {theme.visibility.location && p.location && (
        <section {...tile('flex flex-col justify-between gap-3 self-start')}>
          <MapPin className="size-5 text-[var(--p-accent)]" aria-hidden />
          <span className="text-sm font-semibold">{p.location}</span>
        </section>
      )}
      {theme.visibility.status && p.statusText && (
        <section {...tile('flex flex-col justify-between gap-3 self-start')}>
          <span className="size-2 rounded-full bg-[var(--p-accent)] shadow-[0_0_10px_var(--p-accent)]" aria-hidden />
          <span className="text-sm font-semibold">{p.statusText}</span>
        </section>
      )}
      {theme.audio.placement === 'card' && profile.doc.tracks.length > 0 && theme.visibility.audio && (
        <section {...tile('col-span-2 !p-2')}>
          <AudioPlayer className="!border-0 !bg-transparent" />
        </section>
      )}
      {widgets.map((widget) => (
        <section key={widget.id} {...tile(widget.size === 'half' ? 'col-span-2 @3xl:col-span-1' : widget.size === 'tall' ? 'col-span-2 row-span-2' : 'col-span-2')}>
          <WidgetView widget={widget} />
        </section>
      ))}
    </div>
  );
}
