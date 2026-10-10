// Drives the deterministic renderer in headless Chromium.
//   Stills:  node render-frames.mjs --stills 0.4,1.2,5.8 [--out previews/stills]
//   Video:   node render-frames.mjs --video previews/silent.mp4 [--fps 60] [--from 0] [--to 30]
// With --fps 60 the frames are rendered at 60 fps and folded to 30 fps with a
// 2-frame temporal blend (≈180° shutter motion blur) during encoding.
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1]?.startsWith('--') ? true : all[i + 1] ?? true]] : acc), []));
const URL_ = args.url || 'http://127.0.0.1:4810/video-production/scripts/render/index.html';
const ROOT = new URL('../', import.meta.url).pathname;

const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-vsync'],
});
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
page.on('console', (m) => { if (m.type() === 'error') console.error('[page]', m.text()); });
page.on('pageerror', (e) => console.error('[pageerror]', e.message));
await page.goto(URL_);
await page.evaluate(() => window.ready);

if (args.stills) {
  const out = resolve(ROOT, args.out || 'previews/stills');
  mkdirSync(out, { recursive: true });
  for (const s of String(args.stills).split(',')) {
    const t = Number(s);
    const t0 = Date.now();
    await page.evaluate((tt) => window.renderTime(tt), t);
    await page.screenshot({ path: `${out}/t_${t.toFixed(2).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 90 });
    console.log(`still ${t}s  ${Date.now() - t0}ms`);
  }
} else if (args.video) {
  const fps = Number(args.fps || 30);
  const from = Number(args.from || 0), to = Number(args.to || 30);
  const out = resolve(ROOT, args.video);
  mkdirSync(dirname(out), { recursive: true });
  const vf = fps === 60 ? ['-vf', 'tmix=frames=2:weights=1 1,fps=30'] : [];
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-', ...vf,
    '-c:v', 'libx264', '-preset', args.preset || 'slow', '-crf', String(args.crf || 14), '-pix_fmt', 'yuv420p', '-r', '30', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const first = Math.round(from * fps), last = Math.round(to * fps);
  const t0 = Date.now();
  for (let f = first; f < last; f++) {
    await page.evaluate((tt) => window.renderTime(tt), f / fps);
    const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if ((f - first) % 60 === 0) console.log(`frame ${f}/${last}  ${((Date.now() - t0) / Math.max(1, f - first + 1)).toFixed(0)} ms/frame`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  console.log(`done ${out} in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
await browser.close();
