'use client';

import { useEffect, useRef } from 'react';
import { useInView } from '@/lib/client/hooks';
import { hexToRgb } from './theme-vars';

export type ParticleKind = 'none' | 'dust' | 'snow' | 'fireflies' | 'stars' | 'bubbles' | 'embers' | 'petals';

type Props = {
  rain: boolean;
  rainIntensity: number;
  particles: ParticleKind;
  particleColor: string;
  density: number;
  speed: number;
  animate: boolean;
};

type P = { x: number; y: number; vx: number; vy: number; r: number; a: number; phase: number; spin: number };

/**
 * Lightweight 2D canvas for rain and ambient particles. Pixel ratio is capped,
 * particle counts scale with area, and the loop stops when the canvas is
 * off-screen, the tab is hidden, or motion is disabled (one still frame is drawn).
 */
export function EffectsCanvas({ rain, rainIntensity, particles, particleColor, density, speed, animate }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inView = useInView(canvasRef);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || (!rain && particles === 'none')) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let width = 0;
    let height = 0;
    let drops: P[] = [];
    let motes: P[] = [];
    const [cr, cg, cb] = hexToRgb(particleColor);
    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    const spawnMote = (initial: boolean): P => {
      const base: P = { x: rand(0, width), y: initial ? rand(0, height) : 0, vx: 0, vy: 0, r: 1, a: 1, phase: rand(0, Math.PI * 2), spin: rand(-1, 1) };
      switch (particles) {
        case 'snow':
          return { ...base, y: initial ? base.y : -10, vy: rand(18, 50), vx: rand(-8, 8), r: rand(0.8, 2.6), a: rand(0.4, 0.95) };
        case 'fireflies':
          return { ...base, y: rand(height * 0.35, height), vx: rand(-10, 10), vy: rand(-8, 8), r: rand(1, 2.4), a: rand(0.3, 1) };
        case 'stars':
          return { ...base, y: rand(0, height), r: rand(0.4, 1.5), a: rand(0.3, 1) };
        case 'bubbles':
          return { ...base, y: initial ? base.y : height + 10, vy: -rand(14, 42), r: rand(1.5, 5), a: rand(0.25, 0.7) };
        case 'embers':
          return { ...base, y: initial ? base.y : height + 6, vy: -rand(20, 60), vx: rand(-10, 10), r: rand(0.8, 2.2), a: rand(0.5, 1) };
        case 'petals':
          return { ...base, y: initial ? base.y : -10, vy: rand(20, 45), vx: rand(5, 25), r: rand(3, 6), a: rand(0.5, 0.9) };
        default:
          return { ...base, vx: rand(-6, 6), vy: rand(-6, 6), r: rand(0.5, 1.6), a: rand(0.15, 0.6) };
      }
    };

    const spawnDrop = (initial: boolean): P => ({
      x: rand(-width * 0.1, width * 1.1),
      y: initial ? rand(0, height) : rand(-height * 0.2, 0),
      vx: -60,
      vy: rand(700, 1100),
      r: rand(10, 22),
      a: rand(0.08, 0.28),
      phase: 0,
      spin: 0,
    });

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const area = (width * height) / (1280 * 720);
      const moteCount = particles === 'none' ? 0 : Math.round((particles === 'stars' ? 220 : particles === 'snow' ? 160 : 90) * density * Math.min(area, 2.2));
      const dropCount = rain ? Math.round(420 * rainIntensity * Math.min(area, 2.2)) : 0;
      motes = Array.from({ length: moteCount }, () => spawnMote(true));
      drops = Array.from({ length: dropCount }, () => spawnDrop(true));
    };

    const draw = (dt: number, t: number) => {
      ctx.clearRect(0, 0, width, height);
      // Particles
      for (const p of motes) {
        p.phase += dt * (1 + Math.abs(p.spin));
        if (particles === 'stars') {
          const tw = 0.55 + 0.45 * Math.sin(t * 0.0015 * speed + p.phase * 10);
          ctx.fillStyle = `rgb(${cr} ${cg} ${cb} / ${(p.a * tw).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
          continue;
        }
        p.x += (p.vx + (particles === 'snow' || particles === 'petals' ? Math.sin(p.phase) * 12 : 0)) * dt * speed;
        p.y += p.vy * dt * speed;
        if (particles === 'fireflies' || particles === 'dust') {
          p.vx += Math.sin(p.phase * 0.7) * 2 * dt;
          p.vy += Math.cos(p.phase * 0.5) * 2 * dt;
        }
        if (p.y > height + 12 || p.y < -12 || p.x < -20 || p.x > width + 20) Object.assign(p, spawnMote(false));
        let alpha = p.a;
        if (particles === 'fireflies') alpha = p.a * (0.35 + 0.65 * Math.max(0, Math.sin(p.phase * 1.6)));
        if (particles === 'fireflies' || particles === 'embers') {
          const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 6);
          glow.addColorStop(0, `rgb(${cr} ${cg} ${cb} / ${(alpha * 0.9).toFixed(3)})`);
          glow.addColorStop(1, `rgb(${cr} ${cg} ${cb} / 0)`);
          ctx.fillStyle = glow;
          ctx.fillRect(p.x - p.r * 6, p.y - p.r * 6, p.r * 12, p.r * 12);
        }
        if (particles === 'bubbles') {
          ctx.strokeStyle = `rgb(${cr} ${cg} ${cb} / ${alpha.toFixed(3)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(p.x + Math.sin(p.phase) * 3, p.y, p.r, 0, Math.PI * 2);
          ctx.stroke();
          continue;
        }
        if (particles === 'petals') {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.phase * 0.8);
          ctx.fillStyle = `rgb(${cr} ${cg} ${cb} / ${alpha.toFixed(3)})`;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.r, p.r * 0.45, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          continue;
        }
        ctx.fillStyle = `rgb(${cr} ${cg} ${cb} / ${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      // Rain
      if (drops.length) {
        ctx.lineCap = 'round';
        for (const d of drops) {
          d.x += d.vx * dt * speed;
          d.y += d.vy * dt * speed;
          if (d.y > height) Object.assign(d, spawnDrop(false));
          ctx.strokeStyle = `rgb(200 220 255 / ${d.a.toFixed(3)})`;
          ctx.lineWidth = d.r > 18 ? 1.3 : 0.9;
          ctx.beginPath();
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d.x + d.vx * 0.02, d.y - d.r);
          ctx.stroke();
        }
      }
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    let frame = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!document.hidden) draw(dt, now);
      frame = requestAnimationFrame(loop);
    };
    if (animate && inView) frame = requestAnimationFrame(loop);
    else draw(0, 0);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [rain, rainIntensity, particles, particleColor, density, speed, animate, inView]);

  if (!rain && particles === 'none') return null;
  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden />;
}
