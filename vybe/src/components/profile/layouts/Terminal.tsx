'use client';

import { getPlatform } from '@/features/socials/platforms';
import { useProfile } from '../context';
import { AudioPlayer } from '../AudioPlayer';
import { Avatar, Description, IdentityFlags, enter } from '../parts';
import { WidgetView } from '../widgets/WidgetView';

function Prompt({ cmd, i }: { cmd: string; i: number }) {
  const { theme } = useProfile();
  return (
    <p {...enter(i, 'mt-4 first:mt-0')}>
      <span style={{ color: 'var(--p-accent)' }}>{theme.layoutOptions.terminalPrompt}</span> <span>{cmd}</span>
    </p>
  );
}

/** Layout H — a restrained terminal window with monospace output. */
export function TerminalLayout() {
  const { profile, theme, onLinkClick } = useProfile();
  const p = profile.doc.profile;
  const name = (theme.visibility.displayName && p.displayName) || profile.username;
  const links = profile.doc.links.filter((l) => l.visible);
  const badges = profile.doc.badges.filter((b) => b.visible);
  const widgets = profile.doc.widgets.filter((w) => w.visible);
  return (
    <article className="p-card w-full !p-0 font-mono text-[0.9em]" style={{ maxWidth: 'max(var(--p-card-width), 600px)' }}>
      <div className="flex items-center gap-2 border-b border-[var(--p-line)] px-4 py-2.5">
        <span className="size-3 rounded-full bg-[#ff5f57]" aria-hidden />
        <span className="size-3 rounded-full bg-[#febc2e]" aria-hidden />
        <span className="size-3 rounded-full bg-[#28c840]" aria-hidden />
        <span className="p-muted ml-2 truncate text-xs">{profile.username} — vybe — 80×24</span>
      </div>
      <div className="p-[var(--p-card-pad)] leading-relaxed">
        <Prompt cmd="whoami" i={0} />
        <div {...enter(0.5, 'mt-2 flex items-center gap-4')}>
          <Avatar size={64} />
          <div className="min-w-0">
            <h1 className="p-username !font-mono" style={{ fontSize: 'clamp(20px, 6cqi, calc(var(--p-username-size) * 0.85))' }}>
              {name}
            </h1>
            <div className="mt-1 flex items-center gap-2">
              <IdentityFlags />
            </div>
            {theme.visibility.status && p.statusText && <p className="p-muted text-xs">status: {p.statusText}</p>}
          </div>
        </div>
        <Prompt cmd="cat bio.txt" i={1} />
        <div {...enter(1.5, 'mt-1')}>
          <Description />
        </div>
        {theme.visibility.location && p.location && (
          <>
            <Prompt cmd="echo $LOCATION" i={2} />
            <p className="mt-1">{p.location}</p>
          </>
        )}
        {theme.visibility.badges && badges.length > 0 && (
          <>
            <Prompt cmd="badges --list" i={2.5} />
            <p className="mt-1">{badges.map((b) => `[${b.label}]`).join(' ')}</p>
          </>
        )}
        {theme.visibility.socials && links.length > 0 && (
          <>
            <Prompt cmd="ls ./links" i={3} />
            <ul className="mt-1 grid gap-0.5 @md:grid-cols-2">
              {links.map((link) => (
                <li key={link.id}>
                  <a href={link.url} target={link.newTab ? '_blank' : undefined} rel="noopener noreferrer nofollow ugc" onClick={() => onLinkClick(link.id)} className="group inline-flex max-w-full items-center gap-2 hover:underline">
                    <span style={{ color: 'var(--p-accent)' }}>→</span>
                    <span className="truncate">{(link.label || getPlatform(link.platform).label).toLowerCase().replace(/\s+/g, '-')}</span>
                  </a>
                </li>
              ))}
            </ul>
          </>
        )}
        {theme.audio.placement === 'card' && profile.doc.tracks.length > 0 && theme.visibility.audio && (
          <>
            <Prompt cmd="./play --now" i={4} />
            <AudioPlayer className="mt-2 font-sans" />
          </>
        )}
        {widgets.map((widget, i) => (
          <div key={widget.id} {...enter(5 + i, 'mt-4 border border-dashed border-[var(--p-line)] p-3 font-sans')}>
            <WidgetView widget={widget} />
          </div>
        ))}
        {theme.visibility.views && <p className="p-muted mt-4 text-xs">{new Intl.NumberFormat('en').format(profile.viewCount)} visits</p>}
        <p className="mt-4">
          <span style={{ color: 'var(--p-accent)' }}>{theme.layoutOptions.terminalPrompt}</span>{' '}
          <span className="inline-block h-[1.1em] w-[0.6ch] translate-y-[0.15em] animate-[p-breathe_1s_steps(1)_infinite] bg-[var(--p-text)]" aria-hidden />
        </p>
      </div>
    </article>
  );
}
