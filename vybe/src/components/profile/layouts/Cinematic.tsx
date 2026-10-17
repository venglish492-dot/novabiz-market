'use client';

import { useRef } from 'react';
import { useProfile } from '../context';
import { AudioPlayer } from '../AudioPlayer';
import { Avatar, Badges, Banner, Description, Divider, Handle, LinkButtons, MetaRow, SocialIcons, Username, ViewCounter, enter } from '../parts';
import { WidgetList } from '../widgets/WidgetView';
import { TabbedContent } from './TabbedContent';
import { useTilt } from './useTilt';

/** Layout A — the centred translucent glass panel (default). */
export function CinematicLayout() {
  const { profile, theme, motion } = useProfile();
  const ref = useRef<HTMLElement>(null);
  useTilt(ref, motion && theme.effects.cardTilt, 4);
  const centered = theme.card.align === 'center';
  const hasTabs = profile.doc.tabs.length > 0;
  const widgets = profile.doc.widgets.filter((w) => w.visible);

  return (
    <div className="p-enter w-full" style={{ maxWidth: 'var(--p-card-width)', '--i': 0 } as React.CSSProperties}>
    <article ref={ref} className="p-card p-tilt w-full" data-gradient={theme.gradient.card}>
      <Banner className="-mx-[var(--p-card-pad)] -mt-[var(--p-card-pad)] mb-5 rounded-t-[calc(var(--p-card-radius)-1px)]" />
      <header className={`flex gap-5 ${centered ? 'flex-col items-center text-center' : 'flex-col items-center text-center @md:flex-row @md:items-start @md:text-left'}`}>
        <div {...enter(1)}>
          <Avatar />
        </div>
        <div className={`flex min-w-0 flex-1 flex-col gap-2 ${centered ? 'items-center' : 'items-center @md:items-start'}`}>
          <div {...enter(2, `flex flex-wrap items-center gap-2.5 ${centered ? 'justify-center' : 'justify-center @md:justify-start'}`)}>
            <Username />
            <Badges />
          </div>
          <div {...enter(2.5)}>
            <Handle />
          </div>
          <div {...enter(3)}>
            <Description className="p-muted text-[0.95em]" />
          </div>
          <div {...enter(3.5)}>
            <MetaRow className={centered ? 'justify-center' : 'justify-center @md:justify-start'} />
          </div>
        </div>
      </header>

      <Divider className="my-[var(--p-card-gap)]" />
      <SocialIcons className="p-pulsing" />

      {(theme.audio.placement === 'card' || theme.visibility.views) && (
        <div className="mt-[var(--p-card-gap)] flex flex-col gap-3 @md:flex-row @md:items-center">
          <div {...enter(6, 'order-2 @md:order-1')}>
            <ViewCounter />
          </div>
          {theme.audio.placement === 'card' && (
            <div {...enter(6.5, 'order-1 min-w-0 flex-1 @md:order-2')}>
              <AudioPlayer />
            </div>
          )}
        </div>
      )}

      {hasTabs ? (
        <TabbedContent className="mt-[var(--p-card-gap)]" />
      ) : (
        <>
          <LinkButtons className="mt-[var(--p-card-gap)]" />
          <WidgetList widgets={widgets} className="mt-[var(--p-card-gap)]" />
        </>
      )}
    </article>
    </div>
  );
}
