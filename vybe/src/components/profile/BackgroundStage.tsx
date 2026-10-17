'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import type { ProfileTheme, ScenePresetId } from '@/features/themes/schema';
import type { AssetMap } from '@/features/profiles/types';
import { Scene } from './scenes';
import { Layer } from './scenes/shared';
import { EffectsCanvas } from './EffectsCanvas';
import { rgba } from './theme-vars';

const POSITION: Record<string, string> = { center: '50% 50%', top: '50% 15%', bottom: '50% 85%', left: '15% 50%', right: '85% 50%' };

/**
 * Renders the full background stack: base (scene / image / video / gradient /
 * solid) → tint & dimming → fog → particles & rain → vignette & grain.
 * Pointer parallax writes CSS variables directly (no React re-renders).
 */
export function BackgroundStage({
  theme,
  assets,
  sceneOverride,
  motion,
  dim = 0,
}: {
  theme: ProfileTheme;
  assets: AssetMap;
  sceneOverride: ScenePresetId | null;
  motion: boolean;
  dim?: number;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const { background: bg, effects } = theme;
  const parallax = motion ? effects.parallax : 0;

  useEffect(() => {
    const root = rootRef.current;
    if (!root || parallax <= 0 || !window.matchMedia('(pointer: fine)').matches) return;
    let frame = 0;
    let x = 0;
    let y = 0;
    const onMove = (event: PointerEvent) => {
      x = (event.clientX / window.innerWidth - 0.5) * 2 * parallax;
      y = (event.clientY / window.innerHeight - 0.5) * 2 * parallax;
      if (!frame)
        frame = requestAnimationFrame(() => {
          frame = 0;
          root.style.setProperty('--px', x.toFixed(3));
          root.style.setProperty('--py', y.toFixed(3));
        });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(frame);
    };
  }, [parallax]);

  const asset = bg.assetId ? assets[bg.assetId] : undefined;
  const type = sceneOverride ? 'preset' : bg.type === 'image' || bg.type === 'video' ? (asset ? bg.type : 'preset') : bg.type;
  const sceneId = sceneOverride ?? bg.presetId;
  const filter = `blur(${bg.blur}px) brightness(${bg.brightness}) saturate(${bg.saturation})`;
  const mediaStyle: CSSProperties = { objectPosition: POSITION[bg.position], transform: `scale(${bg.zoom})` };

  let base: React.ReactNode;
  if (type === 'image' && asset) {
    // eslint-disable-next-line @next/next/no-img-element -- user media served from our own file route
    base = <img src={asset.url} alt="" className="absolute inset-0 h-full w-full object-cover" style={mediaStyle} fetchPriority="high" />;
  } else if (type === 'video' && asset) {
    base = (
      <video
        key={asset.url}
        className="absolute inset-0 h-full w-full object-cover"
        style={mediaStyle}
        src={asset.url}
        poster={asset.posterUrl ?? undefined}
        autoPlay={motion}
        muted
        loop
        playsInline
        preload={motion ? 'auto' : 'metadata'}
        aria-hidden
      />
    );
  } else if (type === 'gradient') {
    base = (
      <div
        className={`absolute inset-0 ${bg.animateGradient && motion ? 'scene-anim scene-gradient-anim' : ''}`}
        style={{ backgroundImage: `linear-gradient(${bg.gradientAngle}deg, ${bg.gradientFrom}, ${bg.gradientVia}, ${bg.gradientTo})` }}
      />
    );
  } else if (type === 'solid') {
    base = <div className="absolute inset-0" style={{ background: bg.color }} />;
  } else {
    base = <Scene id={sceneId} animate={motion} accent={theme.colors.accent} secondary={theme.colors.secondary} />;
  }

  const overlay = Math.min(0.95, bg.overlay + dim);
  return (
    <div ref={rootRef} className="absolute inset-0 overflow-hidden" aria-hidden>
      <div key={`${type}-${sceneId}-${asset?.id ?? ''}`} className="absolute inset-0 animate-[p-fade_0.9s_ease-out_both]" style={{ filter }}>
        {type === 'image' || type === 'video' ? <Layer depth={0.15}>{base}</Layer> : base}
      </div>
      {bg.tintStrength > 0 && <div className="absolute inset-0" style={{ background: rgba(bg.tint, bg.tintStrength), mixBlendMode: 'color' }} />}
      {overlay > 0 && <div className="absolute inset-0" style={{ background: `rgb(0 0 0 / ${overlay.toFixed(2)})` }} />}
      {effects.fog && (
        <Layer depth={0.25}>
          <div className={motion ? 'scene-anim scene-fog' : 'scene-fog'} style={{ '--fog': rgba(effects.fogColor, 0.04 + effects.fogDensity * 0.2), animationPlayState: motion ? undefined : 'paused' } as CSSProperties} />
        </Layer>
      )}
      <EffectsCanvas
        rain={effects.rain}
        rainIntensity={effects.rainIntensity}
        particles={effects.particles}
        particleColor={effects.particleColor}
        density={effects.particleDensity}
        speed={effects.speed}
        animate={motion}
      />
      {effects.vignette > 0 && <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at center, transparent 45%, rgb(0 0 0 / ${(effects.vignette * 0.85).toFixed(2)}) 100%)` }} />}
      {effects.grain > 0 && <div className="scene-grain" style={{ opacity: effects.grain * 0.5 }} />}
    </div>
  );
}
