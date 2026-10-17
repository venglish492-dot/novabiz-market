# Higgsfield asset-generation package

## What happened in this build session

- A Higgsfield MCP integration **was connected**. Balance check: 6.5 credits, *free* plan.
- Cost preflight: a 5 s `seedance_2_5` video = **35 credits** (more than the balance);
  an image = 0.12–0.25 credits.
- Submitting the eight background images with both `soul_location` and `gpt_image_2_5`
  returned **“Requires basic plan or higher”** for every request. **No images or videos
  were generated, and none are simulated anywhere in the app.**
- The product therefore ships eight **procedural, interactive** scenes (SVG + CSS + canvas,
  and three.js for the particle scene). Every scene has an empty footage slot in
  `src/features/backgrounds/manifest.ts`; fill it and the renderer plays the loop beneath the
  live rain/fog/particle layers (posters are used for reduced motion).

## Target specifications (all loops)

| Property | Value |
| --- | --- |
| Aspect | 16:9 master (1920×1080); also export 9:16 (1080×1920) for phones if budget allows |
| Duration | 6–10 s, seamless loop (first and last frames match) |
| Motion | slow, continuous; no cuts, no camera shake; centre third calm for UI |
| Delivery | `public/media/backgrounds/<id>.mp4` (H.264, CRF 24–26, `-movflags +faststart`, no audio) and `<id>.webm` (VP9, CRF 34) |
| Poster | `public/media/backgrounds/<id>.webp`, first frame, quality 80 |
| Size budget | ≤ 4 MB per MP4 at 1080p |
| Never | text, logos, watermarks, UI, people’s faces, recognisable brands |

Suggested encode:

```bash
ffmpeg -i raw.mp4 -an -vf "scale=1920:-2,fps=30" -c:v libx264 -crf 25 -preset slow -pix_fmt yuv420p -movflags +faststart rainforest.mp4
ffmpeg -i raw.mp4 -an -vf "scale=1920:-2,fps=30" -c:v libvpx-vp9 -crf 34 -b:v 0 rainforest.webm
ffmpeg -i rainforest.mp4 -frames:v 1 -q:v 80 rainforest.webp
```

Then set, e.g. `rainforest: { promptId: 'BG-01', video: '/media/backgrounds/rainforest.mp4', poster: '/media/backgrounds/rainforest.webp', durationSeconds: 8, generatedBy: 'higgsfield/<model>' }`.

Recommended route on a paid plan: generate a still with an environment model
(`soul_location`), approve it, then animate it image-to-video (e.g. `seedance_2_5`) with the
motion notes below — this keeps composition control. Run `get_cost` first.

## Prompts

### BG-01 · Blue Rainforest (hero / default)
Create a cinematic nocturnal blue forest with tall dark pine silhouettes, atmospheric mist
between distant trees, gentle falling rain, bioluminescent blue flowers on the forest floor,
subtle floating particles, deep atmospheric perspective, restrained luminous accents, and
high-quality environmental detail. Camera: eye level, locked-off with an imperceptible 2%
push-in over the loop. Foreground: the darkest pines framing the left and right edges, a few
glowing flowers at the bottom corners. Midground: misty pines receding. Background: pale
moon glow upper right, faint warm cabin lights far away. Lighting: cold moonlight shafts,
cyan bioluminescence. Motion: rain falling, mist drifting left to right, flowers pulsing very
softly. Palette: midnight navy, deep blue, cyan accents. Stable across frames: tree positions,
moon, horizon. Leave the central third calm and dark enough for readable white UI text.
Seamless loop. Avoid: people, animals, text, logos, watermarks, lens flares, fast motion.

### BG-02 · Purple Nebula
A vast violet and magenta nebula in deep space, slowly rotating gas clouds concentrated at the
edges and corners, two depths of stars with a few gently twinkling, a faint spiral galaxy in
the upper right. Camera: static, very slow rotation of the cloud field (≈3° per loop).
Palette: indigo, violet, magenta, soft lavender highlights. Calm, darker centre for UI. No
planets in the centre, no spaceships, no text. Seamless loop.

### BG-03 · Cyberpunk City at Night
Low wide-angle view down a rain-soaked alley of tall buildings at night. Blurred neon signs in
hot pink and electric cyan on the side facades (no readable letters), wet asphalt reflecting the
neon, steam drifting from vents, hazy skyline at the vanishing point. Camera: static, shallow
depth of field. Motion: heavy rain, neon flicker on two signs, steam rising. Centre recedes into
dark low-contrast haze for UI. Avoid: people, vehicles, readable text, brand names. Seamless loop.

### BG-04 · Obsidian & Violet
Polished black volcanic glass cliffs and shards rising from a dark reflective plain, thin veins
of violet light pulsing slowly through the cracks, faint violet haze on the horizon. Camera:
static with a very slow lateral drift (≈1%). Mostly near-black negative space in the centre.
Palette: black, graphite, deep violet, electric purple. Elegant and minimal. No text. Loop.

### BG-05 · Icy Futuristic Landscape
Blue-hour arctic scene: translucent glacier walls with crisp angular ice on the left and right,
a frozen lake with soft reflections, a slim minimal white light structure far away, drifting snow,
pale green-cyan aurora ribbons slowly waving on the horizon. Camera: static. Palette: ice white,
pale cyan, steel blue, silver. Airy, calm centre sky for UI. No people, no text. Seamless loop.

### BG-06 · Dreamlike Blue Ocean
Just below the water surface: caustic light rays swaying from above, sun shafts, tiny rising
bubbles and particles, coral reef silhouettes at the bottom corners, a faint whale silhouette
crossing very far away in the haze. Camera: static, slight natural sway. Palette: ultramarine,
teal, aqua highlights, deep navy toward the bottom. Ethereal; soft-focus centre. Seamless loop.

### BG-07 · Minimal Dark Studio
A seamless charcoal paper backdrop curving into the floor, one soft overhead spotlight creating
a gentle pool of light and smooth vignette, faint film grain, warm grey tones, almost empty.
Motion: barely perceptible light breathing (±3% intensity). No objects, people or text. Loop.

### BG-08 · Abstract Particle Universe
Millions of tiny glowing particles forming flowing curved streams and a slow vortex around the
edges of the frame, depth of field with bokeh in the corners, dark calm void in the centre.
Palette: near-black, icy blue and electric purple particles, a few warm white sparks. Motion:
slow rotation of the vortex, particles flowing along the arms. Generative art feel. No text. Loop.

## Optional extras (same constraints)

- Avatar art: abstract, non-photographic portraits for demo profiles (no real people).
- Poster stills for marketing: 1600×900 versions of BG-01…08 for the homepage gallery.
