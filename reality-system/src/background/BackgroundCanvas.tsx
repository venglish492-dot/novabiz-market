import { useEffect, useMemo, useRef } from 'react'
import { useApp } from '@/store/app'
import { useReducedMotion } from '@/hooks/useMotion'
import { usePageVisible } from '@/hooks/useVisible'
import { resolveTokens } from '@/theme/themes'
import type { BackgroundId } from '@/domain/settings'
import { createRenderer, type Palette } from './renderers'

const FPS = 30

function usePalette(): Palette {
  const themeId = useApp((s) => s.settings.appearance.themeId)
  const custom = useApp((s) => s.settings.appearance.customTheme)
  return useMemo(() => {
    const t = resolveTokens({ themeId, customTheme: custom })
    return { bg: t.bg, bg2: t.bg2, accent: t.accent, accent2: t.accent2, highlight: t.highlight }
  }, [themeId, custom])
}

/**
 * Full-screen animated environment behind the interface. Purely decorative:
 * pointer-events are disabled, it pauses when the tab is hidden, renders a
 * single still frame for reduced motion, and caps resolution for performance.
 */
export function BackgroundCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)
  const a = useApp((s) => s.settings.appearance)
  const reduced = useReducedMotion()
  const visible = usePageVisible()
  const palette = usePalette()
  const lowPower = a.quality === 'low' || (a.quality === 'auto' && (navigator.hardwareConcurrency ?? 8) <= 4)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas || !a.backgroundEnabled) return
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return
    const density = lowPower ? 0.5 : a.quality === 'high' ? 1.2 : 1
    const renderer = createRenderer(a.backgroundId, palette, a.backgroundIntensity, density)
    const dprCap = lowPower ? 1 : 1.5
    let w = 0
    let h = 0
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, dprCap)
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const still = reduced || a.backgroundMotion === 0 || !renderer.animated || !visible
    const start = performance.now()
    let raf = 0
    let last = 0
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      if (now - last < 1000 / FPS) return
      last = now
      renderer.draw(ctx, w, h, ((now - start) / 1000) * a.backgroundMotion * 1.5 + 20)
    }
    const drawStill = () => renderer.draw(ctx, w, h, 20)
    if (still) drawStill()
    else raf = requestAnimationFrame(frame)
    const onResize = () => {
      resize()
      if (still) drawStill()
    }
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
    }
  }, [a.backgroundEnabled, a.backgroundId, a.backgroundIntensity, a.backgroundMotion, a.quality, palette, reduced, visible, lowPower])

  if (!a.backgroundEnabled) {
    return <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-bg" />
  }
  return (
    <>
      <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />
      {/* soft vignette keeps text readable over any environment */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgb(0_0_0/0.45))]" />
    </>
  )
}

/** Small static thumbnail of an environment (used in Customization). */
export function BackgroundPreview({ id, className }: { id: BackgroundId; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const palette = usePalette()
  const intensity = useApp((s) => s.settings.appearance.backgroundIntensity)
  useEffect(() => {
    const c = ref.current
    const ctx = c?.getContext('2d')
    if (!c || !ctx) return
    c.width = 320
    c.height = 180
    createRenderer(id, palette, intensity, 0.5).draw(ctx, 320, 180, 20)
  }, [id, palette, intensity])
  return <canvas ref={ref} aria-hidden className={className} />
}
