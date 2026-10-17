'use client';

import { useProfile } from '../context';
import { Avatar, Badges, Description, Handle, MetaRow, SocialIcons, Username, ViewCounter, enter } from '../parts';
import { TabbedContent } from './TabbedContent';
import { AudioPlayer } from '../AudioPlayer';

/** Layout G — identity panel with tabs for links, widgets and music. */
export function TabsLayout() {
  const { theme } = useProfile();
  return (
    <article className="p-card w-full" style={{ maxWidth: 'max(var(--p-card-width), 560px)' }} data-gradient={theme.gradient.card}>
      <header className="flex flex-col items-center gap-3 text-center">
        <div {...enter(0)}>
          <Avatar />
        </div>
        <div {...enter(1, 'flex flex-wrap items-center justify-center gap-2.5')}>
          <Username />
          <Badges />
        </div>
        <div {...enter(1.5)}>
          <Handle />
        </div>
        <div {...enter(2)}>
          <Description className="p-muted mx-auto max-w-[44ch] text-[0.95em]" />
        </div>
        <MetaRow className="justify-center" />
        <SocialIcons className="mt-1" />
        {theme.audio.placement === 'card' && <AudioPlayer className="mt-2 w-full text-left" />}
      </header>
      <TabbedContent className="mt-6" />
      <div className="mt-5 flex justify-center">
        <ViewCounter />
      </div>
    </article>
  );
}
