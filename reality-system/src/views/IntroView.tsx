/**
 * First-run activation sequence. Short, skippable at any moment, and shown
 * as a still composition when reduced motion is preferred. It plays once;
 * it can be replayed from Settings.
 */
import { useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { useApp } from '@/store/app'
import { useMotion } from '@/hooks/useMotion'
import { Logo } from '@/components/layout/Logo'
import { Button } from '@/components/ui/Button'
import { playSound } from '@/audio/sound'

export default function IntroView({ onDone }: { onDone: () => void }) {
  const m = useMotion()
  const updateProfile = useApp((s) => s.updateProfile)
  const sound = useApp((s) => s.settings.sound)
  const instant = m.reduced || m.level === 'minimal'
  const [stage, setStage] = useState(instant ? 4 : 0)

  useEffect(() => {
    if (instant) return
    const timers = [400, 1300, 2200, 3000].map((ms, i) => window.setTimeout(() => setStage(i + 1), ms))
    return () => timers.forEach(clearTimeout)
  }, [instant])

  useEffect(() => {
    if (stage === 3) playSound('levelUp', sound)
  }, [stage, sound])

  const particles = useMemo(
    () =>
      Array.from({ length: instant ? 0 : Math.round(36 * Math.max(0.6, m.particles)) }, (_, i) => {
        const a = (i / 36) * Math.PI * 2 * 3
        const r = 260 + ((i * 53) % 220)
        return { x: Math.cos(a) * r, y: Math.sin(a) * r, d: (i % 9) * 0.06 }
      }),
    [instant, m.particles],
  )

  const finish = () => {
    void updateProfile((p) => ({ ...p, introSeen: true }))
    onDone()
  }

  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden bg-[#02040a] px-6" aria-label="System initialization">
      <motion.div
        aria-hidden
        className="absolute inset-0"
        style={{ background: 'radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--rs-accent) 22%, transparent), transparent 55%)' }}
        initial={{ opacity: instant ? 1 : 0 }}
        animate={{ opacity: stage >= 1 ? 1 : 0 }}
        transition={{ duration: 1.2 }}
      />
      {particles.map((p, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="absolute top-1/2 left-1/2 size-1 rounded-full bg-accent"
          style={{ boxShadow: '0 0 8px var(--rs-accent)' }}
          initial={{ x: p.x, y: p.y, opacity: 0 }}
          animate={stage >= 1 ? { x: 0, y: 0, opacity: [0, 1, 0] } : {}}
          transition={{ duration: 1.6, delay: p.d, ease: [0.65, 0, 0.35, 1] }}
        />
      ))}
      {!instant &&
        [0, 1].map((i) => (
          <motion.span
            key={i}
            aria-hidden
            className="absolute top-1/2 left-1/2 h-px w-[70vw] -translate-x-1/2 bg-gradient-to-r from-transparent via-accent to-transparent"
            initial={{ scaleX: 0, opacity: 0, rotate: i ? 90 : 0 }}
            animate={stage >= 2 ? { scaleX: 1, opacity: [0, 0.8, 0.15] } : {}}
            transition={{ duration: 1.2, delay: i * 0.15 }}
          />
        ))}

      <motion.div
        className="panel panel-glow holo-corners relative w-full max-w-md px-8 py-10 text-center"
        initial={instant ? false : { opacity: 0, scale: 0.92, y: 12 }}
        animate={stage >= 2 ? { opacity: 1, scale: 1, y: 0 } : {}}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div className="mx-auto w-fit" initial={instant ? false : { opacity: 0, scale: 0.4, rotate: -90 }} animate={stage >= 3 ? { opacity: 1, scale: 1, rotate: 0 } : {}} transition={{ type: 'spring', stiffness: 120, damping: 14 }}>
          <Logo size={96} />
        </motion.div>
        <motion.div initial={instant ? false : { opacity: 0, y: 8 }} animate={stage >= 3 ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.2 }}>
          <p className="label-caps mt-6 text-accent">System initialization</p>
          <h1 className="text-glow mt-2 font-display text-3xl font-black tracking-[0.25em] text-fg">REALITY</h1>
          <p className="font-display text-sm tracking-[0.6em] text-accent">SYSTEM</p>
          <p className="mt-4 text-sm text-muted">Your life. Your quests. Your evolution.</p>
        </motion.div>
        <motion.div className="mt-8" initial={instant ? false : { opacity: 0 }} animate={stage >= 4 ? { opacity: 1 } : {}} transition={{ duration: 0.5 }}>
          <Button variant="primary" size="lg" onClick={finish} disabled={stage < 4} className="font-display tracking-[0.15em]">
            INITIALIZE MY SYSTEM
          </Button>
        </motion.div>
      </motion.div>

      <button type="button" onClick={finish} className="absolute top-4 right-4 rounded-lg px-3 py-1.5 text-sm text-muted hover:text-fg">
        Skip intro
      </button>
    </div>
  )
}
