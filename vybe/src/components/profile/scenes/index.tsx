'use client';

import dynamic from 'next/dynamic';
import type { ScenePresetId } from '@/features/themes/schema';
import { RainforestScene } from './Rainforest';
import { NebulaScene } from './Nebula';
import { CyberpunkScene } from './Cyberpunk';
import { ObsidianScene } from './Obsidian';
import { GlacierScene } from './Glacier';
import { OceanScene } from './Ocean';
import { StudioScene } from './Studio';
import { BACKGROUND_MANIFEST } from '@/features/backgrounds/manifest';

// three.js only loads for the one scene that needs it.
const ParticlesScene = dynamic(() => import('./Particles').then((m) => m.ParticlesScene), {
  ssr: false,
  loading: () => <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 45%, #0d1030 0%, #05060f 60%, #020208 100%)' }} />,
});

export function Scene({ id, animate, accent, secondary }: { id: ScenePresetId; animate: boolean; accent: string; secondary: string }) {
  const footage = BACKGROUND_MANIFEST[id];
  if (footage?.video) {
    // Generated loop, when available. Reduced motion shows the poster frame only.
    return animate ? (
      <video className="absolute inset-0 h-full w-full object-cover" src={footage.video} poster={footage.poster ?? undefined} autoPlay muted loop playsInline aria-hidden />
    ) : (
      // eslint-disable-next-line @next/next/no-img-element -- static poster
      <img className="absolute inset-0 h-full w-full object-cover" src={footage.poster ?? ''} alt="" />
    );
  }
  switch (id) {
    case 'nebula':
      return <NebulaScene />;
    case 'cyberpunk':
      return <CyberpunkScene />;
    case 'obsidian':
      return <ObsidianScene />;
    case 'glacier':
      return <GlacierScene />;
    case 'ocean':
      return <OceanScene />;
    case 'studio':
      return <StudioScene />;
    case 'particles':
      return <ParticlesScene animate={animate} accent={accent} secondary={secondary} />;
    default:
      return <RainforestScene />;
  }
}
