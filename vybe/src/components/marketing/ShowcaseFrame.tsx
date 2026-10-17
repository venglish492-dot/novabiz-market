'use client';

import { useMemo } from 'react';
import { ProfileView } from '@/components/profile/ProfileView';
import type { RenderableProfile } from '@/features/profiles/types';
import { applyScenePreset } from '@/features/themes/presets';
import { mergeTheme, parseTheme, type LayoutId, type ScenePresetId } from '@/features/themes/schema';

/** A real, live profile rendered inside a framed "screen" for marketing pages. */
export function ShowcaseFrame({
  profile,
  layout,
  scene,
  className = '',
  height = 560,
  label,
}: {
  profile: RenderableProfile;
  layout?: LayoutId;
  scene?: ScenePresetId;
  className?: string;
  height?: number | string;
  label?: string;
}) {
  const view = useMemo(() => {
    let theme = parseTheme(profile.doc.theme);
    if (scene) theme = applyScenePreset(theme, scene);
    if (layout) theme = mergeTheme(theme, { layout });
    theme = mergeTheme(theme, { effects: { intro: 'none', cursor: 'none' }, visibility: { controls: false } });
    return { ...profile, doc: { ...profile.doc, theme } };
  }, [profile, layout, scene]);

  return (
    <div className={`relative overflow-hidden rounded-[28px] border border-white/12 bg-black shadow-[0_40px_120px_-30px_rgb(96_165_250/0.45),0_0_0_1px_rgb(255_255_255/0.04)] ${className}`} style={{ height }}>
      <div className="absolute inset-x-0 top-0 z-20 flex h-9 items-center gap-1.5 border-b border-white/10 bg-black/55 px-4 backdrop-blur-md">
        <span className="size-2.5 rounded-full bg-white/20" />
        <span className="size-2.5 rounded-full bg-white/20" />
        <span className="size-2.5 rounded-full bg-white/20" />
        <span className="ml-3 truncate font-mono text-[11px] text-white/55">{label ?? `vybe/@${profile.username}`}</span>
      </div>
      <div className="absolute inset-x-0 bottom-0 top-9">
        <ProfileView profile={view} mode="showcase" />
      </div>
    </div>
  );
}
