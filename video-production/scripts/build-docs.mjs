// Generates shot-list.md and timeline.md from the shared timeline so docs never drift from the edit.
import { writeFileSync } from 'node:fs';
import { SHOTS, CUES, MUSIC, COPY, FPS, BPM, DURATION } from './render/timeline.js';
const here = (p) => new URL(`../${p}`, import.meta.url).pathname;
const f = (t) => `${t.toFixed(2)}s (f${Math.round(t * FPS)})`;

const shot = [
  '# Shot list',
  '',
  `${DURATION}s · ${FPS} fps · 1080×1920 · ${SHOTS.length} shots / beats. Visual source for every shot: local Three.js render (scripts/render/main.js) using real vektorlab.uz captures (website-captures/) as panel textures; typography is DOM-rendered with the site\'s Geist fonts. Higgsfield generation status per shot is in manifest.json.`,
  '',
  '| # | Shot | In | Out | Dur | Section | What happens |',
  '|---|---|---|---|---|---|---|',
  ...SHOTS.map((s, i) => `| ${i + 1} | ${s.id} | ${f(s.start)} | ${f(s.end)} | ${(s.end - s.start).toFixed(2)}s | ${s.section} | ${s.what} |`),
  '',
].join('\n');
writeFileSync(here('shot-list.md'), shot);

const tl = [
  '# Production timeline',
  '',
  `Tempo ${BPM} BPM (beat = 0.5 s, bar = 2 s). Generated from scripts/render/timeline.js.`,
  '',
  '## Copy',
  '',
  ...Object.entries(COPY).map(([k, v]) => `- **${k}**: ${Array.isArray(v) ? v.join(' / ') : v}`),
  '',
  '## Music arrangement',
  '',
  '| From | To | Section | Kick | Bass | Hats | Pad |',
  '|---|---|---|---|---|---|---|',
  ...MUSIC.map((m) => `| ${m.from.toFixed(2)} | ${m.to.toFixed(2)} | ${m.section} | ${m.kick || '—'} | ${m.bass || '—'} | ${m.hats || '—'} | ${m.pad} |`),
  '',
  '## Sound-design cues (each tied to a visible event)',
  '',
  '| Time | Frame | Type | Detail |',
  '|---|---|---|---|',
  ...CUES.map((c) => `| ${c.t.toFixed(2)} | ${Math.round(c.t * FPS)} | ${c.type}${c.dir ? ` (${c.dir})` : ''} | ${c.note || ''} |`),
  '',
].join('\n');
writeFileSync(here('timeline.md'), tl);
console.log('docs written');
