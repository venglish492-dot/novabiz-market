# VektorLab Instagram Reel — production workspace

This folder holds the reel's pipeline. The website lives in the rest of the repository, and nothing here touches its source, database, auth, payments or deployment.

## Deliverables

| File | What it is |
|---|---|
| `exports/vektorlab_reel_final.mp4` | Main Reel. 30 s, 1080×1920, 30 fps, H.264 High, AAC 320k stereo 48 kHz, −14 LUFS. |
| `exports/vektorlab_reel_15s.mp4` | 15 s alternate cut. Seven segments cut on the beat grid. |
| `previews/vektorlab_reel_review.mp4` | Lightweight 540×960 review copy. |
| `reference-analysis.md` | Frame-level analysis of the supplied reference MP4. |
| `creative-direction.md` | Concept, verified copy, look, motion and sound direction. |
| `shot-list.md` / `timeline.md` | Shot timing, music arrangement and every SFX cue. Generated from `scripts/render/timeline.js`. |
| `prompts/` | Higgsfield prompts for the planned generative shots. |
| `manifest.json` | Shots, sources, Higgsfield job records and costs, captures, audio and licences, export probes. |

## How the reel is made

```
website-captures/   real vektorlab.uz interface (Playwright, EN, dark theme)
        │
scripts/render/     timeline.js (single source of truth) ─┬─► main.js + index.html
        │                                                 │   Three.js scene + DOM typography,
        │                                                 │   deterministic renderFrame(t)
        │                                                 └─► build-cues.mjs → audio/cues.json
scripts/render-frames.mjs  headless Chromium renders each frame → FFmpeg (H.264)
scripts/audio/synth.py     original music + SFX from cues.json → audio/vektorlab_reel_mix.wav
scripts/finalize.sh        loudness-normalize, mux, export final, review and 15 s cut
```

- **Visuals.** A Three.js scene is rendered one frame at a time.
  - It contains the black-chrome "Vektor Core", glass panels textured with the real site captures, light tunnels, beams, dust, bloom and a grading pass (grain, vignette, flashes, chromatic aberration on impacts, directional blur on whip pans).
  - Typography is HTML/CSS in the site's own Geist fonts, positioned per frame.
  - The final export is rendered at 60 fps and folded to 30 fps with a 2-frame blend, which gives natural motion blur.
- **Sound.** Everything is synthesized in NumPy/SciPy at 48 kHz: kick, hats, sub bass, FM plucks, a pad, and 56 sound effects tied to visible events. There are no samples and no third-party music.

## Requirements

- Node 22+ and the repository's `node_modules`, which provide Playwright and three.js.
- Chromium. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` if Playwright's bundled browser isn't installed.
- FFmpeg and FFprobe, plus `bc`.
- Python 3 with `numpy` and `scipy` (`pip install numpy scipy`).

## Run it

From the repository root:

```bash
# 1. Website captures (optional — they're committed). Needs the site built and running:
npm run build && npx next start -p 3400 &
node video-production/scripts/capture-website.mjs http://127.0.0.1:3400

# 2. Serve the repo for the renderer
node video-production/scripts/serve.mjs 4810 &

# 3. Inspect individual frames while iterating
node video-production/scripts/render-frames.mjs --stills 0.6,5.9,17.4,28.5 --out previews/stills

# 4. Render the picture (60 fps with motion blur; about 1.3–2 s per frame with software WebGL)
node video-production/scripts/render-frames.mjs --video previews/master_silent.mp4 --fps 60

# 5. Sound, then mux and export
node video-production/scripts/build-cues.mjs
python3 video-production/scripts/audio/synth.py
sh video-production/scripts/finalize.sh previews/master_silent.mp4

# Docs and manifest
node video-production/scripts/build-docs.mjs && node video-production/scripts/build-manifest.mjs
```

## Making changes

- **Change timing, copy or cues:** edit `scripts/render/timeline.js`.
  - Copy lives in `COPY`. A Russian cut only needs those strings translated.
  - Shot windows are in `SHOTS`, sound cues in `CUES`, and the music arrangement in `MUSIC`.
  - Then re-run steps 4–5 and the docs.
- **Change a shot's look or camera:** each section is one function in `scripts/render/main.js` (`sHook`, `sSeam`, `sSweep`, `sReveal`, `sProducts`, `sVelocity`, `sMessage`, `sEnvironment`, `sClimax`, `sBrand`). Render stills for that time window to check before a full render.
- **Re-render part of the edit:** `--from 11 --to 15` renders only that window. To splice it into a master, cut on a frame boundary with FFmpeg.

## Higgsfield status

Measured on 2026-10-10.

**What happened:**
- The account is on the **free plan**. It had 10 credits and has 8.5 now.
- Every text-to-video model tried (Seedance 2.0 Mini, Grok Video 1.5 Lite) returned **"Requires basic plan or higher"**, so no video clip could be generated.
- One 9:16 keyframe still was generated (job `2e7e6d9f-e1e9-482e-9018-b9f9e0c3d696`, 1.5 credits). It's in your Higgsfield library and matches the hook direction.
- This environment's network policy blocks Higgsfield's CDN (`*.cloudfront.net`), so generated media can't be downloaded into the local edit. The reel's 3D material is therefore rendered locally. No credits were bought and nothing was upgraded.

**To add Higgsfield shots:**
1. Move to a Basic or higher plan.
2. Generate the clips in `prompts/`. Seedance 2.0 Mini costs about 4 credits per 4 s clip at 720p.
3. Run the pipeline where the CDN is reachable.
4. Composite each clip by extracting frames with FFmpeg and drawing them as a background plane for the matching shot window in `main.js`. The hook (S01) and the climax (S09) were planned for this.

## Content accuracy

- **What's shown:** every product, price, format and UI on screen is a real capture of the production build (commit `fdbd095`, identical to vektorlab.uz).
- **What isn't:** no statistics, testimonials or invented features.
- **Deliberately excluded:** the site's real "payment provider is being connected" notice. It's honest, but it's the wrong thing to feature in an ad.
