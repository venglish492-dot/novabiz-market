import type { ScenePresetId } from '@/features/themes/schema';

/**
 * Central manifest for generated background footage (see
 * docs/higgsfield-asset-package.md). Each scene ships as a procedural,
 * interactive environment; when an optimized loop is generated, drop the
 * files into public/media/backgrounds/ and fill in `video` + `poster` here.
 * The renderer then plays the footage under the live rain/fog/particle layers.
 *
 * Status today: Higgsfield was reachable from the build session, but its
 * generation endpoints refused this account's plan, so no footage was
 * generated. All slots are intentionally empty — nothing here is simulated.
 */
export type BackgroundAsset = {
  promptId: string;
  video: string | null;
  poster: string | null;
  durationSeconds: number | null;
  generatedBy: string | null;
};

export const BACKGROUND_MANIFEST: Record<ScenePresetId, BackgroundAsset> = {
  rainforest: { promptId: 'BG-01', video: null, poster: null, durationSeconds: null, generatedBy: null },
  nebula: { promptId: 'BG-02', video: null, poster: null, durationSeconds: null, generatedBy: null },
  cyberpunk: { promptId: 'BG-03', video: null, poster: null, durationSeconds: null, generatedBy: null },
  obsidian: { promptId: 'BG-04', video: null, poster: null, durationSeconds: null, generatedBy: null },
  glacier: { promptId: 'BG-05', video: null, poster: null, durationSeconds: null, generatedBy: null },
  ocean: { promptId: 'BG-06', video: null, poster: null, durationSeconds: null, generatedBy: null },
  studio: { promptId: 'BG-07', video: null, poster: null, durationSeconds: null, generatedBy: null },
  particles: { promptId: 'BG-08', video: null, poster: null, durationSeconds: null, generatedBy: null },
};
