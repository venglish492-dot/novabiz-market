'use client';

import { useState } from 'react';
import type { RenderableProfile } from '@/features/profiles/types';
import { LAYOUT_INFO, SCENE_PRESET_LIST } from '@/features/themes/presets';
import { LAYOUTS, type LayoutId, type ScenePresetId } from '@/features/themes/schema';
import { ShowcaseFrame } from './ShowcaseFrame';

/** Interactive demo: the same profile through every layout and scene. */
export function Playground({ profile }: { profile: RenderableProfile }) {
  const [layout, setLayout] = useState<LayoutId>('cinematic');
  const [scene, setScene] = useState<ScenePresetId>('rainforest');
  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      <div className="space-y-6">
        <fieldset>
          <legend className="eyebrow mb-3">Layout</legend>
          <div className="grid grid-cols-2 gap-2">
            {LAYOUTS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setLayout(id)}
                aria-pressed={layout === id}
                className={`rounded-2xl border px-3 py-2.5 text-left text-sm transition-colors ${layout === id ? 'border-primary/70 bg-primary/15 text-text' : 'border-line bg-white/[0.03] text-muted hover:text-text'}`}
              >
                <span className="block font-semibold">{LAYOUT_INFO[id].name}</span>
              </button>
            ))}
          </div>
          <p className="mt-3 min-h-10 text-sm text-muted">{LAYOUT_INFO[layout].description}</p>
        </fieldset>
        <fieldset>
          <legend className="eyebrow mb-3">Scene</legend>
          <div className="grid grid-cols-4 gap-2">
            {SCENE_PRESET_LIST.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setScene(preset.id)}
                aria-pressed={scene === preset.id}
                aria-label={preset.name}
                title={preset.name}
                className={`aspect-square rounded-xl border-2 transition-transform hover:scale-105 ${scene === preset.id ? 'border-white' : 'border-transparent'}`}
                style={{ background: `linear-gradient(135deg, ${preset.swatch[0]}, ${preset.swatch[1]} 60%, ${preset.swatch[2]})` }}
              />
            ))}
          </div>
          <p className="mt-3 text-sm text-muted">
            <span className="font-semibold text-text">{SCENE_PRESET_LIST.find((p) => p.id === scene)?.name}.</span> {SCENE_PRESET_LIST.find((p) => p.id === scene)?.mood}
          </p>
        </fieldset>
      </div>
      <ShowcaseFrame profile={profile} layout={layout} scene={scene} height={640} />
    </div>
  );
}
