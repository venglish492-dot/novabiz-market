'use client';

import { useProfile } from '../context';
import { AudioPlayer } from '../AudioPlayer';
import { Avatar, Badges, Description, LinkButtons, MetaRow, SocialIcons, Username, ViewCounter, enter } from '../parts';
import { WidgetList } from '../widgets/WidgetView';

/** Layout B — a small, quiet card with lots of negative space. */
export function MinimalLayout() {
  const { profile, theme } = useProfile();
  return (
    <article className="p-card w-full max-w-[min(420px,var(--p-card-width))] text-center" data-gradient={theme.gradient.card}>
      <div className="flex flex-col items-center gap-3">
        <div {...enter(0)}>
          <Avatar size={Math.min(theme.avatar.size, 88)} />
        </div>
        <div {...enter(1, 'flex flex-col items-center gap-2')}>
          <Username className="!text-[clamp(22px,6cqi,calc(var(--p-username-size)*0.8))]" />
          <Badges />
        </div>
        <div {...enter(2)}>
          <Description className="p-muted mx-auto max-w-[32ch] text-[0.92em]" />
        </div>
        <div {...enter(2.5)}>
          <MetaRow className="justify-center" />
        </div>
      </div>
      <div className="mt-6 space-y-5">
        <SocialIcons />
        <LinkButtons />
        <WidgetList widgets={profile.doc.widgets.filter((w) => w.visible)} className="text-left" />
        {theme.audio.placement === 'card' && <AudioPlayer forceStyle="minimal" className="justify-center" />}
      </div>
      <div {...enter(8, 'mt-6 flex justify-center')}>
        <ViewCounter compact />
      </div>
    </article>
  );
}
