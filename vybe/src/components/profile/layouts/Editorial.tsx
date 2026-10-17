'use client';

import { ArrowUpRight } from 'lucide-react';
import { getPlatform } from '@/features/socials/platforms';
import { useProfile } from '../context';
import { AudioPlayer } from '../AudioPlayer';
import { Avatar, Badges, Banner, Description, IdentityFlags, MetaRow, SocialIcons, ViewCounter, enter } from '../parts';
import { WidgetList } from '../widgets/WidgetView';

/** Layout E — magazine composition: wide banner, oversized name, link index. */
export function EditorialLayout() {
  const { profile, theme, onLinkClick } = useProfile();
  const p = profile.doc.profile;
  const name = (theme.visibility.displayName && p.displayName) || profile.username;
  const links = profile.doc.links.filter((l) => l.visible && (l.kind === 'button' || l.displayMode !== 'icon'));
  const kicker = theme.layoutOptions.editorialKicker;
  return (
    <article className="p-card w-full max-w-[1040px] !p-0" data-gradient={theme.gradient.card}>
      <Banner className="rounded-t-[calc(var(--p-card-radius)-1px)]" />
      <div className="p-[var(--p-card-pad)] @3xl:p-[calc(var(--p-card-pad)*1.6)]">
        <div {...enter(0, 'flex items-center justify-between gap-4')}>
          <p className="p-muted font-mono text-[11px] uppercase tracking-[0.3em]">{kicker || `@${profile.username}`}</p>
          <div className="flex items-center gap-2">
            <IdentityFlags />
            <ViewCounter compact />
          </div>
        </div>
        <h1
          {...enter(
            1,
            `p-username mt-4 !leading-[0.95] ${theme.typography.usernameEffect !== 'none' ? `p-fx-${theme.typography.usernameEffect}` : ''} ${theme.typography.uppercase ? 'uppercase' : ''}`,
            { fontSize: 'clamp(40px, 11cqi, calc(var(--p-username-size) * 2.4))' },
          )}
        >
          {name}
        </h1>
        <div className="mt-6 grid gap-8 @3xl:grid-cols-[1fr_1.2fr]">
          <div {...enter(2, 'space-y-4')}>
            <div className="flex items-center gap-4">
              <Avatar size={72} />
              <Badges />
            </div>
            <Description className="p-heading text-[1.15em] leading-snug" />
            <MetaRow />
            <SocialIcons align="start" />
            {theme.audio.placement === 'card' && <AudioPlayer />}
          </div>
          {links.length > 0 && (
            <ol {...enter(3, 'divide-y divide-[var(--p-line)] border-y border-[var(--p-line)]')}>
              {links.map((link, i) => (
                <li key={link.id}>
                  <a href={link.url} target={link.newTab ? '_blank' : undefined} rel="noopener noreferrer nofollow ugc" onClick={() => onLinkClick(link.id)} className="group flex items-center gap-4 py-3.5">
                    <span className="p-muted font-mono text-xs">{String(i + 1).padStart(2, '0')}</span>
                    <span className="p-heading flex-1 text-[1.15em] transition-transform group-hover:translate-x-1">{link.label || getPlatform(link.platform).label}</span>
                    <ArrowUpRight className="size-5 opacity-50 transition-opacity group-hover:opacity-100" aria-hidden />
                  </a>
                </li>
              ))}
            </ol>
          )}
        </div>
        <WidgetList widgets={profile.doc.widgets.filter((w) => w.visible)} className="mt-10" tile="none" />
      </div>
    </article>
  );
}
