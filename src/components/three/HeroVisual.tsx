'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { SceneFallback } from './SceneFallback';

const HeroScene = dynamic(() => import('./HeroScene'), {
  ssr: false,
  loading: () => null,
});

/**
 * The static composition renders immediately (and is the permanent fallback
 * without WebGL); the WebGL scene loads after hydration and fades in on top.
 */
export function HeroVisual({ label }: { label: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div role="img" aria-label={label} className="group/hero relative h-full w-full">
      <SceneFallback className="transition-opacity duration-700 group-has-[[data-ready]]/hero:opacity-0" />
      {!failed && <HeroScene onError={() => setFailed(true)} />}
    </div>
  );
}
