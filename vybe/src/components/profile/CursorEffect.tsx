'use client';

import { useEffect, useRef } from 'react';
import { hexToRgb } from './theme-vars';

/**
 * Pointer effects drawn on one canvas inside the profile frame. Only active
 * for fine pointers (mouse/trackpad); touch devices never pay for it.
 */
export function CursorEffect({ kind, color }: { kind: 'glow' | 'spotlight' | 'trail' | 'sparkle' | 'ring'; color: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !window.matchMedia('(pointer: fine)').matches) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const [r, g, b] = hexToRgb(color);
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let w = 0;
    let h = 0;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const pos = { x: -999, y: -999, tx: -999, ty: -999 };
    const trail: { x: number; y: number; life: number; vx: number; vy: number }[] = [];
    let active = false;
    let frame = 0;

    const onMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pos.tx = event.clientX - rect.left;
      pos.ty = event.clientY - rect.top;
      if (pos.x < -900) {
        pos.x = pos.tx;
        pos.y = pos.ty;
      }
      if (kind === 'trail' || kind === 'sparkle') {
        trail.push({ x: pos.tx, y: pos.ty, life: 1, vx: (Math.random() - 0.5) * 40, vy: (Math.random() - 0.5) * 40 - (kind === 'sparkle' ? 20 : 0) });
        if (trail.length > 60) trail.shift();
      }
      if (!active) {
        active = true;
        frame = requestAnimationFrame(loop);
      }
    };
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      pos.x += (pos.tx - pos.x) * 0.22;
      pos.y += (pos.ty - pos.y) * 0.22;
      ctx.clearRect(0, 0, w, h);
      if (kind === 'spotlight') {
        const grad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 260);
        grad.addColorStop(0, `rgb(${r} ${g} ${b} / 0.18)`);
        grad.addColorStop(1, 'rgb(0 0 0 / 0)');
        ctx.fillStyle = 'rgb(0 0 0 / 0.35)';
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'destination-out';
        const hole = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 240);
        hole.addColorStop(0, 'rgb(0 0 0 / 1)');
        hole.addColorStop(1, 'rgb(0 0 0 / 0)');
        ctx.fillStyle = hole;
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      } else if (kind === 'glow') {
        const grad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 180);
        grad.addColorStop(0, `rgb(${r} ${g} ${b} / 0.28)`);
        grad.addColorStop(1, `rgb(${r} ${g} ${b} / 0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(pos.x - 180, pos.y - 180, 360, 360);
      } else if (kind === 'ring') {
        ctx.strokeStyle = `rgb(${r} ${g} ${b} / 0.85)`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 16, 0, Math.PI * 2);
        ctx.stroke();
      }
      for (let i = trail.length - 1; i >= 0; i--) {
        const p = trail[i];
        p.life -= dt * (kind === 'sparkle' ? 1.4 : 2.2);
        if (p.life <= 0) {
          trail.splice(i, 1);
          continue;
        }
        if (kind === 'sparkle') {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          const s = 2.5 * p.life;
          ctx.fillStyle = `rgb(${r} ${g} ${b} / ${p.life.toFixed(2)})`;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y - s * 2);
          ctx.lineTo(p.x + s * 0.5, p.y);
          ctx.lineTo(p.x, p.y + s * 2);
          ctx.lineTo(p.x - s * 0.5, p.y);
          ctx.fill();
        } else {
          ctx.fillStyle = `rgb(${r} ${g} ${b} / ${(p.life * 0.6).toFixed(2)})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 6 * p.life, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      const settled = Math.abs(pos.tx - pos.x) < 0.5 && Math.abs(pos.ty - pos.y) < 0.5 && trail.length === 0;
      if (settled && kind !== 'spotlight') active = false;
      else frame = requestAnimationFrame(loop);
      if (settled && kind === 'spotlight') active = false;
    };
    const host = canvas.parentElement;
    host?.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      host?.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(frame);
      ro.disconnect();
    };
  }, [kind, color]);

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-30 h-full w-full" aria-hidden />;
}
