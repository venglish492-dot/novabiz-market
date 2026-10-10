# Creative direction — VektorLab Instagram Reel

## What we are selling

VektorLab (vektorlab.uz) is a marketplace of ready-made professional digital products: financial models, Notion workspaces, playbooks and presentation kits for founders, teams and specialists. Every claim in the reel was checked against the live product. The figures below are from the production build, commit `fdbd095`, captured on 2026-10-10:

- **Categories with products:** Spreadsheets, Notion, Business, Marketing & Sales, Product, Presentations.
- **Products shown:**
  - SaaS Unit Economics & 5-Year Financial Model (₽3,490)
  - Startup OS — Notion Workspace (₽2,990)
  - Venture Pitch Deck Kit (₽3,890)
  - E-commerce & Marketplaces: Unit Economics, P&L and Cash Flow
  - B2B Cold Outreach & ABM Playbook
  - Product Manager Playbook
  - HR & Team Scaling System
  - Freelance & Agency OS
- **Formats shown:** XLSX, Notion, PPTX and PDF. These are the site's own format marks.
- **Features shown:** the Ctrl+K catalog search and the product pages.
- **Brand line on the site:** "Start with a system, not a blank page."

There are no statistics, testimonials, guarantees or invented features.

## Concept: the Vektor Core

The site's own 3D emblem is the "Vektor Core": stacked glass layers threaded by a vector beam. The reel turns it into a black-chrome macro object.

1. **Hook.** We start pressed against the chrome layers. A cyan seam glows between two of them.
2. **Transformation.** The seam opens, and the layers separate and become glass panels.
3. **Reveal.** Those panels carry the real website and the real product cards.
4. **Environment.** The catalog becomes the environment: a helix of products orbiting the core.
5. **Climax.** Everything converges back into the core, which collapses into a point of light.
6. **Brand.** A beam reveals the real VektorLab logo.

The abstract 3D world exists to frame the authentic product. It never replaces it.

## Copy (English)

| Moment | Copy | Why |
|---|---|---|
| Hook, 0.5 s | DON'T START FROM ZERO. | The site's own promise, made sharper. |
| Reveal, 4.2 s | READY-MADE SYSTEMS. | Accurate to the catalog. It doesn't repeat the site headline, which appears in frame immediately after. |
| Products, 7.6–10.1 s | FINANCIAL MODELS · NOTION WORKSPACES · PITCH DECKS · PLAYBOOKS | These are real product types. |
| Velocity, 13.2 s | XLSX · NOTION · PPTX · PDF | These are real formats, shown as the site's own format chips. |
| Message, 15–19 s | LESS SEARCHING. / MORE BUILDING. | "Building" matches the brand line "for people who build". |
| Brand, 26.5 s | VEKTOR LAB · vektorlab.uz · EXPLORE VEKTOR LAB ↗ | The real logo mark, wordmark lockup and URL. |

**Language decision.** The site defaults to Russian, with English available. The reel uses English, the brief's default, because these short, bold technology phrases read better and travel further on Instagram. Every string lives in `COPY` in `scripts/render/timeline.js`, so a Russian cut is a one-file change and a re-render.

## Look

- **Palette:** taken from the site's tokens.
  - Background `#07080A`
  - Ink `#EEF0F5`
  - Accent indigo `#8B9CFF`
  - Secondary cyan `#62D6E8`
  - Muted greys `#A7ADBB`, `#6D7380`
- **Colour discipline:** most frames are near-black. Colour appears as hairline seams, panel edges, beams and the occasional flash. Bright moments are rationed so they hit.
- **Materials:**
  - Black chrome (metalness 1, roughness about 0.16, clearcoat), lit by a studio of thin strip lights rather than a softbox, so edges catch crisp highlights.
  - Smoked dark glass for panels, with luminous edges and a narrow travelling sheen.
- **Light:** additive light shafts, hairline seam glow, controlled bloom (threshold 0.9), a vignette and fine grain.
- **Typography:** the brand typefaces, Geist variable and Geist Mono, extracted from the site build.
  - Headlines: weight 760, uppercase, tracking −0.045em, one short phrase at a time.
  - Labels: Geist Mono uppercase with wide tracking, like the site's eyebrows.
  - The wordmark copies the site lockup: "VEKTOR" semibold, "LAB" regular and muted, tracking 0.22em.

## Motion language

- **Camera:** pushes, side tracks, orbits, whip pans (with cuts hidden under directional blur), speed-ramped dives, controlled rolls and fast pull-backs.
- **Object transitions:** layers parting, panels sweeping past the lens, a dark glass slab wiping the frame (used three times), and cards snapping into a grid or flipping on their axis.
- **Graphic transitions:** masked line reveals, depth (Z) moves on type, a mask wipe whose edge reveals the next phrase, tracking-in wordmark, a reflective sweep across the letters, and a beam slice.
- **Editorial accents:** frame-short white or blue flashes, chromatic aberration only on impacts, and a 0.4 s near-silent minimal frame before the brand impact.

Pacing follows the burst-and-breath curve measured in the reference (see `reference-analysis.md`).

## Sound

The soundtrack is original and synthesized in code (`scripts/audio/synth.py`) at 120 BPM in D minor colour:

- **Rhythm:** a four-on-the-floor sub kick, 8th and 16th hats, and a pulsing then driving sub bass.
- **Texture:** an FM pluck arpeggio and a sidechained saw pad (Dm9 · B♭maj7 · Gm9 · A7sus4).
- **Sound effects:** 56 cues placed on visible events (impacts, ticks, metal pings, glass pings, directional whooshes, risers, slides, click runs, a shimmer and the brand drop).

There are no samples or third-party recordings. Loudness is normalized to about −14 LUFS for Instagram.

## Instagram safe area

All type sits between y ≈ 250 and y ≈ 1450 px of 1920, inside x 90–990. The final lockup (mark, wordmark, URL and CTA) sits at y ≈ 640–1290 and is fully static and readable for the last 1.8 s.
