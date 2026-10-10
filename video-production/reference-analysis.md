# Reference analysis

## Source and access

- **Instagram URL** (`https://www.instagram.com/reel/Dcwwxl2NXHa/`): not accessed. This container's network policy allows only package registries and a few APIs.
- **Analysed instead:** the local MP4 supplied with the brief, `references/reference.mp4`. Its specs:
  - 16.85 s, 1276×720 landscape, 24 fps
  - H.264 video with AAC stereo audio at 44.1 kHz
- **Is it the same video?** I can't confirm that from here. The content is a BLACKBOX.AI launch spot ending on "BLACKBOX.AI / where the future gets built".
- **How it was analysed:** contact sheets at 2 fps and 8 fps (`references/seg_*.png`), FFmpeg scene-change detection (threshold 0.18) and an audio waveform (`references/waveform.png`).
- **What was used from it:** observations only. No footage or audio from the reference is used anywhere in the VektorLab reel.

## Observed structure (timestamps from the file)

| Time | What happens |
|---|---|
| 0.00–0.13 | Opens on the white BLACKBOX hexagon logo on black. No fade from black: the mark is visible at frame 1. |
| 0.13–0.38 | The logo smears into a horizontal light streak (directional blur). It hard-cuts at 0.375 into a white-on-black skeletal/spine render. |
| 0.38–0.63 | Rapid cuts (detected at 0.21, 0.25, 0.29, 0.38, 0.46, 0.63): the spine, then an inverted white sculpture, then a white studio. Three images in about 0.4 s. |
| 0.63–1.90 | **The first hold.** A clean white set with two mechanical drafting instruments and long hard shadows. About 1.3 s of near-stillness after the frantic open, with small grey labels in the frame. |
| 1.92–2.92 | A dense burst of about 12 cuts in 1 s (2.00 → 2.92): a flower dissolving into a code/character matrix, Earth, a red/blue ring target, an aerial city, Michelangelo-style hands, then a dark UI screenshot. Each image lasts 2–3 frames. |
| 2.92–4.30 | **Product reveal.** Real product UI screenshots float as tilted 3D panels on black ("Every agent harness. One platform.", "Dispatch from anywhere…", "Same model. 3X faster. 3X cheaper."). The camera drifts and panels overlap at different depths. |
| 3.75–4.25 | A horizontal glitch/scanline smear wipes into a perspective code editor, then a white flash frame at about 4.25–4.37. |
| 4.37–7.90 | **The long breath (about 3.5 s).** A pixel-dot halftone ring ("O") on black with tiny lowercase labels ("singularity", "hangar/ai"). Very slow motion, mostly negative space. The ring fades out at about 6.9. |
| 7.00–8.25 | Small square "tiles" (icon cards) float in darkness. At about 8.0 they converge and rotate into a cluster. At 8.25 the cluster resolves into the hexagon logo with soft bloom. |
| 8.25–9.50 | The logo holds in near-black space with two tiny corner labels. This is the brand anchor at the mid-point. |
| 9.50–11.0 | Screenshot cards (stage/event photos, UI) fly in from depth over a dark dotted grid with thin connector lines. There is parallax between 4–5 cards and a "All Agents End-to-end Encrypted" card. |
| 11.0–11.2 | Cards dissolve into a pixel/halftone disintegration (black and white). |
| 11.2–13.6 | **High-contrast inverted montage**: doves, an eye, a horse, hands, the planet, a city bokeh, a lightning crack, a crowd. All black/white with thin orange HUD rectangles, each shot about 0.2–0.4 s. One persistent small centred caption, "where the future gets built", stays fixed while the images change underneath. |
| 13.75 | A hard cut to black with the "BLACKBOX.AI" wordmark (small, centred, white). |
| 13.75–16.85 | The wordmark holds for about 3.1 s, static. Audio decays under it. |

## Pacing measurements

- **Cut density:** 42 scene changes detected in 16.85 s.
  - They cluster in three bursts: 0.2–0.6 s, 1.9–2.9 s and 11.2–13.8 s.
  - Between the bursts are long holds: 0.63–1.9 s, 4.4–9.5 s and 13.8–16.85 s.
- **The rhythm is burst → breath → burst.** Roughly half the runtime is calm. That contrast is what makes the bursts feel fast; the spot is not uniformly frantic.
- **Shot lengths** range from 1 frame (flashes and the burst montage) to about 3.5 s (the halftone ring).

## Visual principles

1. **Monochrome discipline.** Almost everything is black, white and grey. Colour appears only in brief accents: blue on Earth and the flower, orange HUD lines, colour inside the UI screenshots. Accents read as events because the base is neutral.
2. **Negative space.** Logos and labels are small, and the frame stays mostly empty during the holds.
3. **Real product UI as hero material**, presented as floating, tilted, layered panels in a dark 3D space rather than as flat screen recordings.
4. **Typography is tiny and calm.** Small lowercase labels, one short tagline and a modest wordmark. There are no giant kinetic headlines.
5. **Transitions.** Light-streak smear, glitch scanline wipe, white flash frame, pixel/halftone disintegration and convergence of elements into the logo. Most cuts are plain hard cuts timed to the audio.
6. **The ending resolves to stillness:** a hard cut to a black frame with the wordmark held for about 3 s.

## Sound (from the waveform)

- **Opening:** a loud transient cluster in the first 0.6 s.
- **Middle:** a pulsing, swelling texture of rhythmic "breaths" at regular intervals, about every 1.1–1.3 s. The amplitude envelopes look like filtered swells rather than drum hits.
- **Accent hits** line up with section changes, at about 4.3 s, 9.6 s and 11.2–12.8 s.
- **Ending:** audio thins out under the wordmark and fades in the last second.

## What VektorLab takes from this, and what it doesn't

**Taken:**
- the burst-and-breath pacing curve;
- monochrome-first grading with a single accent colour (VektorLab's indigo/electric blue);
- real UI floating as layered 3D panels;
- a convergence-into-logo resolve;
- the occasional white flash or light-streak transition;
- a held, readable final wordmark.

**Changed for VektorLab and Reels:**
- vertical 9:16 instead of landscape;
- larger, phone-readable kinetic headlines, as the brief asks;
- 30 s instead of 17 s;
- a synthesized original soundtrack;
- no archival or stock imagery, so no doves, Earth or hands.

**Not copied:** shot order, specific imagery, the halftone-ring motif and the inverted-photo montage.
