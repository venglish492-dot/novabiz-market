/**
 * Level-up, rank-up and goal celebrations, plus quest particle bursts.
 * Celebrations are presentation only: the progress they show has already
 * been saved, so skipping or interrupting them never changes any data.
 */
import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useUi, type Burst, type Celebration } from '@/store/ui'
import { useMotion } from '@/hooks/useMotion'
import { RankEmblem } from '@/components/game/RankEmblem'
import { Button } from '@/components/ui/Button'
import { useApp } from '@/store/app'

function BurstFx({ burst }: { burst: Burst }) {
  const clear = useUi((s) => s.clearBurst)
  const m = useMotion()
  const count = Math.round(14 * m.particles)
  useEffect(() => {
    const id = window.setTimeout(() => clear(burst.id), 900)
    return () => window.clearTimeout(id)
  }, [burst.id, clear])
  if (!count) return null
  return (
    <div className="pointer-events-none fixed z-[70]" style={{ left: burst.x, top: burst.y }} aria-hidden>
      {Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2 + (i % 3) * 0.2
        const d = 34 + ((i * 37) % 30)
        return (
          <motion.span
            key={i}
            className="absolute size-1.5 rounded-full"
            style={{ background: burst.color, boxShadow: `0 0 8px ${burst.color}` }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: Math.cos(a) * d, y: Math.sin(a) * d, opacity: 0, scale: 0.3 }}
            transition={{ duration: 0.75, ease: 'easeOut' }}
          />
        )
      })}
      <motion.span
        className="absolute -top-5 -left-5 size-10 rounded-full border-2"
        style={{ borderColor: burst.color }}
        initial={{ scale: 0.3, opacity: 0.9 }}
        animate={{ scale: 2, opacity: 0 }}
        transition={{ duration: 0.6 }}
      />
    </div>
  )
}

function Rings({ color, count }: { color: string; count: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="absolute top-1/2 left-1/2 size-56 -translate-x-1/2 -translate-y-1/2 rounded-full border"
          style={{ borderColor: color, boxShadow: `0 0 40px -6px ${color}` }}
          initial={{ scale: 0.4, opacity: 0.8 }}
          animate={{ scale: 2.4, opacity: 0 }}
          transition={{ duration: 1.8, delay: i * 0.35, ease: 'easeOut' }}
        />
      ))}
    </>
  )
}

function CelebrationContent({ c }: { c: Celebration }) {
  const m = useMotion()
  const rules = useApp((s) => s.rules)
  if (c.type === 'level') {
    return (
      <div className="text-center">
        <p className="label-caps text-accent">Level up</p>
        <motion.p
          className="num text-glow mt-2 text-7xl font-bold text-fg sm:text-8xl"
          initial={{ scale: m.distance ? 0.5 : 1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 14, delay: 0.15 }}
        >
          {c.to}
        </motion.p>
        <p className="mt-3 text-sm text-muted">
          {c.to - c.from > 1 ? `You advanced ${c.to - c.from} levels (from ${c.from}).` : `You reached level ${c.to}.`} Your progress is saved.
        </p>
      </div>
    )
  }
  if (c.type === 'rank') {
    const fromIndex = Math.max(0, rules.ranks.findIndex((r) => r.id === c.from.id))
    const toIndex = Math.max(0, rules.ranks.findIndex((r) => r.id === c.to.id))
    return (
      <div className="text-center">
        <p className="label-caps" style={{ color: c.to.color }}>
          Rank ascension
        </p>
        <div className="mt-5 flex items-center justify-center gap-6">
          <motion.div initial={{ opacity: 1 }} animate={{ opacity: 0.4, scale: 0.85 }} transition={{ delay: 0.4, duration: 0.6 }}>
            <RankEmblem rank={c.from} index={fromIndex} size={72} />
          </motion.div>
          <motion.span className="text-2xl text-muted" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
            →
          </motion.span>
          <motion.div
            initial={{ scale: m.distance ? 0.3 : 1, opacity: 0, rotate: m.distance ? -40 : 0 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 160, damping: 12, delay: 0.8 }}
          >
            <RankEmblem rank={c.to} index={toIndex} size={120} />
          </motion.div>
        </div>
        <motion.h2 className="mt-4 font-display text-2xl font-bold tracking-widest text-fg" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }}>
          {c.to.label}-RANK · {c.to.title.toUpperCase()}
        </motion.h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted">{c.to.description}</p>
        {c.to.unlocks && <p className="mx-auto mt-2 max-w-sm text-sm text-highlight">Unlocked: {c.to.unlocks}</p>}
      </div>
    )
  }
  return (
    <div className="text-center">
      <p className="label-caps text-highlight">Goal complete</p>
      <motion.h2 className="mt-3 font-display text-2xl font-bold tracking-wide text-fg" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        {c.name}
      </motion.h2>
      <p className="mt-2 text-sm text-muted">A long-term goal, finished. That is real progress.</p>
    </div>
  )
}

export function CelebrationLayer() {
  const celebrations = useUi((s) => s.celebrations)
  const shift = useUi((s) => s.shiftCelebration)
  const pushToast = useUi((s) => s.pushToast)
  const bursts = useUi((s) => s.bursts)
  const m = useMotion()
  const current = celebrations[0]
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Minimal motion: present an accessible message instead of an overlay.
  useEffect(() => {
    if (!current || m.cinematic || m.level === 'balanced') return
    const text =
      current.type === 'level' ? `Level up! You reached level ${current.to}.` : current.type === 'rank' ? `Rank up! You are now rank ${current.to.label} — ${current.to.title}.` : `Goal completed: ${current.name}`
    pushToast({ kind: current.type === 'rank' ? 'rank-up' : current.type === 'level' ? 'level-up' : 'goal', title: text })
    shift()
  }, [current, m.cinematic, m.level, pushToast, shift])

  const showOverlay = !!current && (m.cinematic || m.level === 'balanced')

  useEffect(() => {
    if (!showOverlay || !current) return
    const ms = current.type === 'rank' ? 9000 : m.cinematic ? 4200 : 2800
    const id = window.setTimeout(shift, ms)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') shift()
    }
    window.addEventListener('keydown', onKey)
    const f = requestAnimationFrame(() => buttonRef.current?.focus())
    return () => {
      window.clearTimeout(id)
      window.removeEventListener('keydown', onKey)
      cancelAnimationFrame(f)
    }
  }, [showOverlay, current, shift, m.cinematic])

  const color = current?.type === 'rank' ? current.to.color : current?.type === 'goal' ? 'var(--rs-highlight)' : 'var(--rs-accent)'

  return (
    <>
      <AnimatePresence>
        {showOverlay && current && (
          <motion.div
            key={current.id}
            role="alertdialog"
            aria-modal="true"
            aria-label={current.type === 'level' ? 'Level up' : current.type === 'rank' ? 'Rank up' : 'Goal completed'}
            className="fixed inset-0 z-[80] grid place-items-center overflow-hidden bg-black/70 p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={shift}
          >
            <motion.div
              aria-hidden
              className="absolute inset-0"
              style={{ background: `radial-gradient(circle at 50% 50%, color-mix(in srgb, ${color} 28%, transparent), transparent 60%)` }}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
            />
            <Rings color={color} count={m.cinematic ? (m.level === 'maximum' ? 4 : 3) : 1} />
            <motion.div
              className="relative max-w-lg"
              initial={{ y: 20 * m.distance, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4 }}
              onClick={(e) => e.stopPropagation()}
            >
              <CelebrationContent c={current} />
              <div className="mt-6 flex justify-center">
                <Button ref={buttonRef} variant="primary" onClick={shift}>
                  Continue
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {bursts.map((b) => (
        <BurstFx key={b.id} burst={b} />
      ))}
    </>
  )
}
