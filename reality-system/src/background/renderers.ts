/**
 * Procedural background environments, drawn with Canvas 2D.
 * Everything is generated locally from math — no images or remote assets.
 */
import type { BackgroundId } from '@/domain/settings'
import { withAlpha } from '@/lib/color'

export interface Palette {
  bg: string
  bg2: string
  accent: string
  accent2: string
  highlight: string
}

export interface Renderer {
  /** t = seconds of animation time (already scaled by the motion setting) */
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void
  /** false = the scene never changes, so it is drawn once */
  animated: boolean
}

/** Deterministic pseudo-random generator so scenes look the same each visit. */
function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

function base(ctx: CanvasRenderingContext2D, w: number, h: number, p: Palette) {
  const g = ctx.createLinearGradient(0, 0, w * 0.3, h)
  g.addColorStop(0, p.bg2)
  g.addColorStop(0.55, p.bg)
  g.addColorStop(1, p.bg)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
}

function glow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, alpha: number) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r)
  g.addColorStop(0, withAlpha(color, alpha))
  g.addColorStop(1, withAlpha(color, 0))
  ctx.fillStyle = g
  ctx.fillRect(x - r, y - r, r * 2, r * 2)
}

export function createRenderer(id: BackgroundId, p: Palette, intensity: number, density: number): Renderer {
  const rand = rng(id.length * 7919 + 17)
  const k = Math.max(0.2, intensity)
  const n = (count: number) => Math.max(4, Math.round(count * density))

  switch (id) {
    case 'gradient':
      return {
        animated: false,
        draw: (ctx, w, h) => {
          base(ctx, w, h, p)
          glow(ctx, w * 0.85, h * 0.1, Math.max(w, h) * 0.6, p.accent2, 0.12 * k)
          glow(ctx, w * 0.1, h * 0.95, Math.max(w, h) * 0.5, p.accent, 0.08 * k)
        },
      }

    case 'nebula': {
      const stars = Array.from({ length: n(140) }, () => ({ x: rand(), y: rand(), r: rand() * 1.2 + 0.2, ph: rand() * 6.28 }))
      const clouds = [
        { c: p.accent, x: 0.25, y: 0.3, r: 0.55, s: 0.05 },
        { c: p.accent2, x: 0.75, y: 0.25, r: 0.6, s: -0.04 },
        { c: p.accent2, x: 0.5, y: 0.85, r: 0.5, s: 0.03 },
        { c: p.highlight, x: 0.85, y: 0.75, r: 0.3, s: 0.06 },
      ]
      return {
        animated: true,
        draw: (ctx, w, h, t) => {
          base(ctx, w, h, p)
          const m = Math.max(w, h)
          ctx.globalCompositeOperation = 'lighter'
          for (const c of clouds) {
            glow(ctx, (c.x + Math.sin(t * c.s) * 0.06) * w, (c.y + Math.cos(t * c.s * 1.3) * 0.05) * h, c.r * m, c.c, (c.c === p.highlight ? 0.06 : 0.14) * k)
          }
          ctx.globalCompositeOperation = 'source-over'
          for (const s of stars) {
            ctx.fillStyle = withAlpha('#ffffff', (0.35 + 0.35 * Math.sin(t * 0.8 + s.ph)) * k)
            ctx.beginPath()
            ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2)
            ctx.fill()
          }
        },
      }
    }

    case 'void':
      return {
        animated: true,
        draw: (ctx, w, h, t) => {
          ctx.fillStyle = p.bg
          ctx.fillRect(0, 0, w, h)
          glow(ctx, w / 2, h / 2, Math.max(w, h) * 0.5, p.accent, 0.08 * k)
          ctx.lineWidth = 1
          for (let i = 1; i <= 7; i++) {
            ctx.strokeStyle = withAlpha(p.accent, (0.1 - i * 0.01) * k + 0.02)
            ctx.setLineDash([4 + i * 2, 10 + i * 4])
            ctx.lineDashOffset = t * (i % 2 ? 6 : -6) * i
            ctx.beginPath()
            ctx.arc(w / 2, h / 2, i * Math.min(w, h) * 0.075, 0, Math.PI * 2)
            ctx.stroke()
          }
          ctx.setLineDash([])
        },
      }

    case 'particles': {
      const ps = Array.from({ length: n(90) }, () => ({ x: rand(), y: rand(), r: rand() * 2 + 0.6, v: rand() * 0.02 + 0.006, d: rand() * 6.28, c: rand() > 0.7 ? p.accent2 : p.accent }))
      return {
        animated: true,
        draw: (ctx, w, h, t) => {
          base(ctx, w, h, p)
          for (const q of ps) {
            const y = (((q.y - t * q.v) % 1) + 1) % 1
            const x = q.x + Math.sin(t * 0.3 + q.d) * 0.01
            ctx.fillStyle = withAlpha(q.c, 0.55 * k)
            ctx.shadowColor = q.c
            ctx.shadowBlur = 8
            ctx.beginPath()
            ctx.arc(x * w, y * h, q.r, 0, Math.PI * 2)
            ctx.fill()
          }
          ctx.shadowBlur = 0
        },
      }
    }

    case 'grid':
      return {
        animated: true,
        draw: (ctx, w, h, t) => {
          base(ctx, w, h, p)
          const horizon = h * 0.42
          glow(ctx, w / 2, horizon, w * 0.6, p.accent2, 0.18 * k)
          ctx.strokeStyle = withAlpha(p.accent, 0.35 * k)
          ctx.lineWidth = 1
          const lines = 22
          for (let i = -lines; i <= lines; i++) {
            ctx.beginPath()
            ctx.moveTo(w / 2 + i * 8, horizon)
            ctx.lineTo(w / 2 + i * w * 0.12, h)
            ctx.stroke()
          }
          const offset = (t * 0.25) % 1
          for (let i = 0; i < 14; i++) {
            const z = (i + offset) / 14
            const y = horizon + (h - horizon) * z * z
            ctx.strokeStyle = withAlpha(p.accent, 0.08 + 0.35 * z * k)
            ctx.beginPath()
            ctx.moveTo(0, y)
            ctx.lineTo(w, y)
            ctx.stroke()
          }
          const fade = ctx.createLinearGradient(0, horizon - 40, 0, horizon + 60)
          fade.addColorStop(0, withAlpha(p.bg, 0))
          fade.addColorStop(0.5, withAlpha(p.bg, 0.7))
          fade.addColorStop(1, withAlpha(p.bg, 0))
          ctx.fillStyle = fade
          ctx.fillRect(0, horizon - 40, w, 100)
        },
      }

    case 'starfield': {
      const stars = Array.from({ length: n(220) }, () => ({ a: rand() * Math.PI * 2, d: rand(), s: rand() * 0.6 + 0.2 }))
      return {
        animated: true,
        draw: (ctx, w, h, t) => {
          ctx.fillStyle = p.bg
          ctx.fillRect(0, 0, w, h)
          glow(ctx, w / 2, h / 2, Math.max(w, h) * 0.45, p.accent2, 0.06 * k)
          const m = Math.hypot(w, h) / 2
          for (const s of stars) {
            const d = (s.d + t * 0.02 * s.s) % 1
            const r = d * d * m
            const x = w / 2 + Math.cos(s.a) * r
            const y = h / 2 + Math.sin(s.a) * r
            ctx.fillStyle = withAlpha(d > 0.8 ? p.accent : '#ffffff', Math.min(1, d * 1.6) * 0.8 * k)
            ctx.fillRect(x, y, 0.6 + d * 2, 0.6 + d * 2)
          }
        },
      }
    }

    case 'fog': {
      const layers = Array.from({ length: 6 }, (_, i) => ({ y: 0.25 + i * 0.13, s: (rand() - 0.5) * 0.04, c: i % 2 ? p.accent2 : p.accent, ph: rand() * 6 }))
      return {
        animated: true,
        draw: (ctx, w, h, t) => {
          base(ctx, w, h, p)
          for (const l of layers) {
            for (let j = 0; j < 3; j++) {
              const x = (((j / 3 + t * l.s + l.ph) % 1) + 1) % 1
              glow(ctx, x * w * 1.4 - w * 0.2, l.y * h + Math.sin(t * 0.2 + l.ph) * 20, w * 0.35, l.c, 0.05 * k)
            }
          }
        },
      }
    }

    case 'constellation': {
      const pts = Array.from({ length: n(60) }, () => ({ x: rand(), y: rand(), vx: (rand() - 0.5) * 0.004, vy: (rand() - 0.5) * 0.004 }))
      return {
        animated: true,
        draw: (ctx, w, h, t) => {
          base(ctx, w, h, p)
          const pos = pts.map((q) => ({ x: ((((q.x + q.vx * t) % 1) + 1) % 1) * w, y: ((((q.y + q.vy * t) % 1) + 1) % 1) * h }))
          const maxD = Math.min(w, h) * 0.16
          ctx.lineWidth = 1
          for (let i = 0; i < pos.length; i++) {
            for (let j = i + 1; j < pos.length; j++) {
              const d = Math.hypot(pos[i].x - pos[j].x, pos[i].y - pos[j].y)
              if (d < maxD) {
                ctx.strokeStyle = withAlpha(p.accent, (1 - d / maxD) * 0.35 * k)
                ctx.beginPath()
                ctx.moveTo(pos[i].x, pos[i].y)
                ctx.lineTo(pos[j].x, pos[j].y)
                ctx.stroke()
              }
            }
          }
          for (const q of pos) {
            ctx.fillStyle = withAlpha(p.highlight, 0.8 * k)
            ctx.beginPath()
            ctx.arc(q.x, q.y, 1.6, 0, Math.PI * 2)
            ctx.fill()
          }
        },
      }
    }

    case 'waves':
      return {
        animated: true,
        draw: (ctx, w, h, t) => {
          base(ctx, w, h, p)
          for (let i = 0; i < 6; i++) {
            ctx.strokeStyle = withAlpha(i % 2 ? p.accent2 : p.accent, (0.12 + i * 0.03) * k)
            ctx.lineWidth = 1.2
            ctx.beginPath()
            for (let x = 0; x <= w; x += 8) {
              const y = h * (0.55 + i * 0.05) + Math.sin(x * 0.006 + t * (0.4 + i * 0.1) + i) * (30 + i * 8) + Math.sin(x * 0.013 - t * 0.3) * 12
              if (x === 0) ctx.moveTo(x, y)
              else ctx.lineTo(x, y)
            }
            ctx.stroke()
          }
        },
      }

    case 'circuit': {
      const traces = Array.from({ length: n(26) }, () => {
        const pts: Array<[number, number]> = [[Math.floor(rand() * 40), Math.floor(rand() * 24)]]
        for (let s = 0; s < 6; s++) {
          const [x, y] = pts[pts.length - 1]
          const horiz = s % 2 === 0
          const len = Math.floor(rand() * 6) + 2
          pts.push(horiz ? [x + (rand() > 0.5 ? len : -len), y] : [x, y + (rand() > 0.5 ? len : -len)])
        }
        return { pts, speed: rand() * 0.3 + 0.1, ph: rand() }
      })
      return {
        animated: true,
        draw: (ctx, w, h, t) => {
          base(ctx, w, h, p)
          const cell = Math.max(w / 40, h / 24)
          ctx.lineWidth = 1
          for (const tr of traces) {
            ctx.strokeStyle = withAlpha(p.accent, 0.13 * k)
            ctx.beginPath()
            tr.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x * cell, y * cell) : ctx.moveTo(x * cell, y * cell)))
            ctx.stroke()
            const [ex, ey] = tr.pts[tr.pts.length - 1]
            ctx.fillStyle = withAlpha(p.accent, 0.35 * k)
            ctx.fillRect(ex * cell - 2, ey * cell - 2, 4, 4)
            // pulse travelling along the trace
            const f = (t * tr.speed + tr.ph) % 1
            const seg = f * (tr.pts.length - 1)
            const a = tr.pts[Math.floor(seg)]
            const b = tr.pts[Math.min(tr.pts.length - 1, Math.floor(seg) + 1)]
            const u = seg % 1
            const px = (a[0] + (b[0] - a[0]) * u) * cell
            const py = (a[1] + (b[1] - a[1]) * u) * cell
            glow(ctx, px, py, 14, p.accent, 0.8 * k)
          }
        },
      }
    }

    case 'crystal': {
      const shards = Array.from({ length: n(16) }, () => ({ x: rand(), y: rand(), r: rand() * 60 + 30, sides: 3 + Math.floor(rand() * 4), sp: (rand() - 0.5) * 0.2, c: rand() > 0.5 ? p.accent : p.accent2 }))
      return {
        animated: true,
        draw: (ctx, w, h, t) => {
          base(ctx, w, h, p)
          glow(ctx, w * 0.5, h * 0.55, Math.max(w, h) * 0.45, p.accent, 0.08 * k)
          for (const s of shards) {
            ctx.save()
            ctx.translate(s.x * w, s.y * h + Math.sin(t * 0.3 + s.x * 9) * 8)
            ctx.rotate(t * s.sp)
            ctx.beginPath()
            for (let i = 0; i <= s.sides; i++) {
              const a = (i / s.sides) * Math.PI * 2
              const r = s.r * (i % 2 ? 0.55 : 1)
              if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r)
              else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r)
            }
            ctx.closePath()
            ctx.fillStyle = withAlpha(s.c, 0.04 * k)
            ctx.strokeStyle = withAlpha(s.c, 0.3 * k)
            ctx.fill()
            ctx.stroke()
            ctx.restore()
          }
        },
      }
    }

    case 'arena':
      return {
        animated: true,
        draw: (ctx, w, h, t) => {
          base(ctx, w, h, p)
          const cx = w / 2
          const cy = h * 0.62
          glow(ctx, cx, cy, Math.max(w, h) * 0.5, p.accent2, 0.12 * k)
          ctx.save()
          ctx.translate(cx, cy)
          ctx.scale(1, 0.38)
          for (let i = 1; i <= 5; i++) {
            const r = i * Math.min(w, h) * 0.12
            ctx.strokeStyle = withAlpha(i % 2 ? p.accent : p.highlight, 0.25 * k)
            ctx.lineWidth = 1.2
            ctx.beginPath()
            ctx.arc(0, 0, r, 0, Math.PI * 2)
            ctx.stroke()
            const ticks = 12 + i * 6
            const rot = t * 0.05 * (i % 2 ? 1 : -1)
            for (let j = 0; j < ticks; j++) {
              const a = (j / ticks) * Math.PI * 2 + rot
              ctx.beginPath()
              ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r)
              ctx.lineTo(Math.cos(a) * (r + 10), Math.sin(a) * (r + 10))
              ctx.stroke()
            }
          }
          ctx.restore()
          for (let i = 0; i < 4; i++) {
            const x = w * (0.15 + i * 0.233)
            const pillar = ctx.createLinearGradient(x, 0, x, h)
            pillar.addColorStop(0, withAlpha(p.accent, 0))
            pillar.addColorStop(0.6, withAlpha(p.accent, 0.08 * k))
            pillar.addColorStop(1, withAlpha(p.accent, 0))
            ctx.fillStyle = pillar
            ctx.fillRect(x - 20, 0, 40, h)
          }
        },
      }
  }
}

export const BACKGROUND_INFO: Record<BackgroundId, { name: string; description: string }> = {
  nebula: { name: 'Deep-space nebula', description: 'Drifting clouds of colour and twinkling stars.' },
  void: { name: 'Abstract digital void', description: 'Slowly rotating dashed rings in darkness.' },
  particles: { name: 'Floating particles', description: 'Soft glowing particles rising upward.' },
  gradient: { name: 'Minimal gradient', description: 'A calm static gradient. Lowest power use.' },
  grid: { name: 'Geometric cyber grid', description: 'A perspective grid flowing toward you.' },
  starfield: { name: 'Starfield', description: 'Stars gently streaming from the centre.' },
  fog: { name: 'Atmospheric fog', description: 'Layered coloured mist drifting sideways.' },
  constellation: { name: 'Glowing constellation', description: 'Points of light linked by moving lines.' },
  waves: { name: 'Energy waves', description: 'Layered flowing sine waves.' },
  circuit: { name: 'Futuristic circuit', description: 'Circuit traces with travelling pulses.' },
  crystal: { name: 'Crystal chamber', description: 'Slowly turning translucent shards.' },
  arena: { name: 'Fantasy arena', description: 'Rotating rune rings and light pillars.' },
}
