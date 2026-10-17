'use client';

import { useProfile } from '../context';
import { AudioPlayer } from '../AudioPlayer';
import { Avatar, Badges, Banner, Description, Handle, LinkButtons, MetaRow, SocialIcons, Username, ViewCounter, enter } from '../parts';
import { WidgetList } from '../widgets/WidgetView';
import { TabbedContent } from './TabbedContent';

/** Layout C — big avatar over a banner, prominent buttons, portfolio grid. */
export function CreatorLayout() {
  const { profile, theme } = useProfile();
  const widgets = profile.doc.widgets.filter((w) => w.visible);
  const hasBanner = Boolean(profile.doc.profile.bannerAssetId && theme.visibility.banner && profile.assets[profile.doc.profile.bannerAssetId]);
  return (
    <article className="p-card w-full max-w-[min(900px,max(var(--p-card-width),680px))] overflow-hidden !p-0" data-gradient={theme.gradient.card}>
      {hasBanner ? <Banner /> : <div className="h-28" style={{ background: 'linear-gradient(120deg, var(--p-grad-from), var(--p-grad-to))', opacity: 0.55 }} />}
      <div className="px-[var(--p-card-pad)] pb-[var(--p-card-pad)]">
        <div className="-mt-[calc(var(--p-avatar-size)*0.55)] flex flex-col items-center gap-4 text-center @xl:flex-row @xl:items-end @xl:text-left">
          <div {...enter(0)}>
            <Avatar size={Math.max(theme.avatar.size, 128)} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 pb-1 @xl:items-start">
            <div {...enter(1, 'flex flex-wrap items-center justify-center gap-2.5 @xl:justify-start')}>
              <Username />
              <Badges />
            </div>
            <div {...enter(1.5)}>
              <Handle />
            </div>
          </div>
          <div {...enter(2)}>
            <ViewCounter />
          </div>
        </div>
        <div className="mt-5 grid gap-6 @3xl:grid-cols-[1.1fr_1fr]">
          <div className="space-y-4">
            <div {...enter(2.5)}>
              <Description className="text-[1.02em]" />
            </div>
            <MetaRow />
            <SocialIcons align="start" />
            {theme.audio.placement === 'card' && <AudioPlayer />}
          </div>
          <div>
            <LinkButtons />
          </div>
        </div>
        {profile.doc.tabs.length ? (
          <TabbedContent includeLinksTab={false} className="mt-8" />
        ) : (
          widgets.length > 0 && (
            <section className="mt-8" aria-label="Portfolio">
              <h2 className="p-heading p-muted mb-3 text-xs font-semibold uppercase tracking-[0.2em]">Featured</h2>
              <WidgetList widgets={widgets} tile="sub" />
            </section>
          )
        )}
      </div>
    </article>
  );
}
