// Writes manifest.json: shots, sources, Higgsfield generation records, captures, audio, exports.
import { readdirSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { SHOTS, FPS } from './render/timeline.js';
const root = new URL('../', import.meta.url).pathname;
const probe = (p) => { try { return JSON.parse(execSync(`ffprobe -v error -show_entries format=duration,size:stream=codec_name,width,height,r_frame_rate,sample_rate,channels -of json "${root}${p}"`).toString()); } catch { return null; } };
const captures = readdirSync(`${root}website-captures`).filter((f) => f.endsWith('.png')).map((f) => ({ file: `website-captures/${f}`, bytes: statSync(`${root}website-captures/${f}`).size, source: 'Local production build of commit fdbd095 (identical to vektorlab.uz production), captured with Playwright, EN locale, dark theme' }));
const manifest = {
  project: 'VektorLab Instagram Reel',
  url: 'https://vektorlab.uz/',
  generated: new Date().toISOString(),
  spec: { width: 1080, height: 1920, fps: FPS, duration_s: 30, video: 'H.264 High yuv420p', audio: 'AAC stereo 48 kHz, -14 LUFS' },
  shots: SHOTS.map((s) => ({ id: s.id, start_s: s.start, end_s: s.end, frames: [Math.round(s.start * FPS), Math.round(s.end * FPS)], section: s.section, description: s.what, source: 'local-render (Three.js + DOM typography)', status: 'rendered' })),
  higgsfield: {
    account: { plan: 'free', credits_before: 10, credits_after: 8.5 },
    attempts: [
      { id: 'H01-video', model: 'seedance_2_0_mini', params: { aspect_ratio: '9:16', duration: 4, resolution: '720p', generate_audio: false }, preflight_cost_credits: 4, status: 'blocked', reason: 'Requires basic plan or higher', prompt_file: 'prompts/H01_hook_macro.md' },
      { id: 'H02-video', model: 'seedance_2_0_mini', params: { aspect_ratio: '9:16', duration: 4, resolution: '720p', generate_audio: false }, preflight_cost_credits: 4, status: 'blocked', reason: 'Requires basic plan or higher', prompt_file: 'prompts/H02_climax_converge.md' },
      { id: 'H01-video-alt', model: 'grok_video_v15_lite', params: { aspect_ratio: '9:16', duration: 4, resolution: '720p' }, preflight_cost_credits: 4, status: 'blocked', reason: 'Requires basic plan or higher' },
      { id: 'H01-keyframe', model: 'nano_banana_2 (served as nano_banana_flash)', job_id: '2e7e6d9f-e1e9-482e-9018-b9f9e0c3d696', params: { aspect_ratio: '9:16', resolution: '1k' }, cost_credits: 1.5, status: 'completed', output: '768x1376 PNG in the Higgsfield library', used_in_edit: false, reason_not_used: 'Higgsfield CDN (*.cloudfront.net) is denied by this environment\'s egress policy, so the file cannot be brought into the local edit', qc: 'Black faceted crystal with a single electric-blue seam, deep black background, fine particles; matches the hook art direction; no text or artefacts visible in the inspection preview' },
    ],
    cost_estimate_full_plan: 'Seedance 2.0 Mini 720p: 4 credits per 4 s clip. A full source library of ~10 clips = ~40 credits plus regenerations; requires a Basic (or higher) plan.',
  },
  captures,
  audio: { file: 'audio/vektorlab_reel_mix.wav', normalized: 'audio/vektorlab_reel_mix_norm.wav', source: 'Synthesized by scripts/audio/synth.py from audio/cues.json — no samples or third-party audio', license: 'Original work created for this project' },
  fonts: [{ file: 'assets/fonts/Geist-Latin-Variable.woff2', license: 'SIL OFL 1.1 (Geist by Vercel)' }, { file: 'assets/fonts/GeistMono-Latin-Variable.woff2', license: 'SIL OFL 1.1' }],
  logo: { file: 'assets/brand/vektorlab-mark.svg', source: 'src/app/icon.svg from the website repository' },
  exports: ['exports/vektorlab_reel_final.mp4', 'exports/vektorlab_reel_15s.mp4', 'previews/vektorlab_reel_review.mp4'].filter((p) => existsSync(root + p)).map((p) => ({ file: p, probe: probe(p) })),
};
writeFileSync(`${root}manifest.json`, JSON.stringify(manifest, null, 2));
console.log('manifest written:', manifest.shots.length, 'shots,', captures.length, 'captures,', manifest.exports.length, 'exports');
