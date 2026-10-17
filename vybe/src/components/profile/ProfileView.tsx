'use client';

import './profile.css';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Eye, Flag } from 'lucide-react';
import Link from 'next/link';
import type { RenderableProfile } from '@/features/profiles/types';
import { parseTheme, type ScenePresetId } from '@/features/themes/schema';
import { CUSTOM_FONT_FAMILY } from '@/features/themes/fonts';
import { brand } from '@/config/brand';
import { usePrefersReducedMotion } from '@/lib/client/hooks';
import { AudioStore, type Track } from './audio-store';
import { AudioPlayer, VolumeControl } from './AudioPlayer';
import { BackgroundStage } from './BackgroundStage';
import { CursorEffect } from './CursorEffect';
import { IntroOverlay } from './IntroOverlay';
import { LayoutRenderer } from './layouts';
import { ProfileContext, type ProfileMode } from './context';
import { themeToVars } from './theme-vars';
import { track } from './tracking';

/**
 * Renders a profile — the public page, the live editor preview and the
 * homepage showcase all use this one component, so what creators see is what
 * visitors get. Layout uses container queries, so the editor's phone/tablet
 * previews are faithful without iframes.
 */
export function ProfileView({
  profile,
  mode,
  onReport,
  className = '',
}: {
  profile: RenderableProfile;
  mode: ProfileMode;
  onReport?: () => void;
  className?: string;
}) {
  const theme = useMemo(() => parseTheme(profile.doc.theme), [profile.doc.theme]);
  const reducedMotion = usePrefersReducedMotion();
  const motion = theme.effects.animate && !reducedMotion;

  // Audio: one store per set of tracks; only public-ready assets become playable.
  const tracks: Track[] = useMemo(
    () =>
      profile.doc.tracks
        .map((t) => {
          const asset = t.assetId ? profile.assets[t.assetId] : undefined;
          const cover = t.coverAssetId ? profile.assets[t.coverAssetId] : undefined;
          return asset ? { id: t.id, title: t.title, artist: t.artist, src: asset.url, cover: cover?.url ?? null } : null;
        })
        .filter((t): t is Track => t !== null),
    [profile.doc.tracks, profile.assets],
  );
  const trackKey = tracks.map((t) => `${t.id}:${t.src}`).join('|');
  // Re-created only when the playlist itself changes; no audio element exists until play.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const audio = useMemo(() => (tracks.length ? new AudioStore(tracks, theme.audio.volume, theme.audio.loop) : null), [trackKey]);
  useEffect(() => () => audio?.destroy(), [audio]);
  useEffect(() => {
    audio?.configure(tracks, theme.audio.loop);
  }, [audio, tracks, theme.audio.loop]);

  // Visitor controls: alternate scenes and background dimming.
  const scenes = theme.scenes;
  const [sceneIndex, setSceneIndex] = useState(0);
  const sceneOverride: ScenePresetId | null = sceneIndex > 0 ? (scenes[sceneIndex - 1] ?? null) : null;
  const [dim, setDim] = useState(0);

  // Analytics: one view beacon per page load on the public page.
  const viewed = useRef(false);
  useEffect(() => {
    if (mode !== 'public' || viewed.current) return;
    viewed.current = true;
    track(profile.id, 'view');
  }, [mode, profile.id]);

  const ctx = useMemo(
    () => ({
      profile,
      theme,
      mode,
      motion,
      audio,
      onLinkClick: (id: string) => mode === 'public' && track(profile.id, 'click', id),
      onWidgetInteract: (id: string) => mode === 'public' && track(profile.id, 'widget', id),
    }),
    [profile, theme, mode, motion, audio],
  );

  const customFont = theme.typography.customFontAssetId ? profile.assets[theme.typography.customFontAssetId] : undefined;
  const position = theme.card.position === 'top' ? 'justify-start pt-[8vh]' : theme.card.position === 'bottom' ? 'justify-end pb-[14vh]' : 'justify-center';
  const showControls = theme.visibility.controls && mode !== 'showcase' && (scenes.length > 0 || Boolean(audio));
  const intro = mode === 'public' && theme.effects.intro !== 'none' ? theme.effects.intro : null;
  const docked = theme.audio.placement === 'dock' && Boolean(audio) && theme.visibility.audio;

  return (
    <ProfileContext.Provider value={ctx}>
      <div
        className={`vybe-profile relative h-full w-full overflow-hidden ${className}`}
        style={themeToVars(theme)}
        data-entrance={motion ? theme.animation.entrance : 'none'}
        data-motion={motion ? 'on' : 'off'}
        data-float={theme.animation.float}
        data-pulse={theme.animation.pulse}
      >
        {customFont && customFont.kind === 'font' && (
          <style>{`@font-face{font-family:'${CUSTOM_FONT_FAMILY}';src:url('${customFont.url}');font-display:swap;}`}</style>
        )}
        <BackgroundStage theme={theme} assets={profile.assets} sceneOverride={sceneOverride} motion={motion} dim={dim} />
        {motion && theme.effects.cursor !== 'none' && mode !== 'showcase' && <CursorEffect kind={theme.effects.cursor} color={theme.effects.cursorColor} />}

        <div className="absolute inset-0 z-10 overflow-y-auto overflow-x-hidden scrollbar-thin">
          <main className={`flex min-h-full flex-col items-center px-4 py-10 @md:px-6 ${position} ${docked ? 'pb-28' : ''}`}>
            <LayoutRenderer layout={theme.layout} />
            {showControls && (
              <div className="mt-6 flex flex-col items-center gap-3 p-enter" style={{ '--i': 9 } as CSSProperties}>
                {scenes.length > 0 && (
                  <div className="p-controls" role="group" aria-label="Background scenes">
                    {[null, ...scenes].map((scene, i) => (
                      <button key={i} type="button" className="p-scene-btn" aria-pressed={sceneIndex === i} onClick={() => setSceneIndex(i)} aria-label={i === 0 ? 'Original background' : `Scene ${i + 1}: ${scene}`}>
                        {i + 1}
                      </button>
                    ))}
                  </div>
                )}
                <div className="p-controls">
                  {audio && <VolumeControl store={audio} compact />}
                  <div className="flex items-center gap-1.5">
                    <Eye className="size-4 opacity-85" aria-hidden />
                    <input
                      type="range"
                      min={0}
                      max={0.6}
                      step={0.01}
                      value={dim}
                      onChange={(event) => setDim(Number(event.target.value))}
                      aria-label="Dim background"
                      style={{ '--fill': `${(dim / 0.6) * 100}%` } as CSSProperties}
                    />
                  </div>
                </div>
              </div>
            )}
            {mode === 'public' && (
              <footer className="mt-10 flex items-center gap-4 text-[11px] text-white/45">
                <Link href="/" className="rounded px-1 hover:text-white/80">
                  Made with {brand.name} — create yours free
                </Link>
                {onReport && (
                  <button type="button" onClick={onReport} className="inline-flex items-center gap-1 rounded px-1 hover:text-white/80">
                    <Flag className="size-3" aria-hidden /> Report
                  </button>
                )}
              </footer>
            )}
          </main>
        </div>

        {docked && (
          <div className="absolute inset-x-0 bottom-0 z-20 flex justify-center px-3 pb-3">
            <div className="w-full max-w-xl rounded-2xl" style={{ background: 'rgb(0 0 0 / 0.55)', backdropFilter: 'blur(16px)' }}>
              <AudioPlayer forceStyle="compact" />
            </div>
          </div>
        )}

        {intro && (
          <IntroOverlay
            mode={intro}
            text={theme.effects.introText || 'click to enter'}
            name={profile.doc.profile.displayName || profile.username}
            profileId={profile.id}
            motion={motion}
            onEnter={() => {
              if (theme.audio.playOnEnter) void audio?.play();
            }}
          />
        )}
      </div>
    </ProfileContext.Provider>
  );
}
