import { useEffect, useRef, useState } from 'react'
import { animate, motion } from 'motion/react'
import { useMotion } from '@/hooks/useMotion'
import { cn } from '@/lib/cn'
import { formatNumber } from '@/lib/format'

/** A number that counts to its new value (instantly in reduced motion). */
export function AnimatedNumber({ value, format = formatNumber, className }: { value: number; format?: (n: number) => string; className?: string }) {
  const m = useMotion()
  const [display, setDisplay] = useState(value)
  const from = useRef(value)
  useEffect(() => {
    if (m.reduced || m.level === 'minimal') {
      from.current = value
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing to the latest value without animation
      setDisplay(value)
      return
    }
    const controls = animate(from.current, value, {
      duration: 0.8 * m.speed,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(v),
    })
    from.current = value
    return () => controls.stop()
  }, [value, m.reduced, m.level, m.speed])
  return <span className={cn('num', className)}>{format(Math.round(display))}</span>
}

interface ProgressBarProps {
  value: number // 0–1
  color?: string
  label: string
  className?: string
  height?: string
  showGlow?: boolean
}

export function ProgressBar({ value, color = 'var(--rs-accent)', label, className, height = 'h-2', showGlow = true }: ProgressBarProps) {
  const m = useMotion()
  const pct = Math.max(0, Math.min(1, value)) * 100
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      className={cn('relative w-full overflow-hidden rounded-full bg-surface2 ring-1 ring-line/60', height, className)}
    >
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{ background: `linear-gradient(90deg, color-mix(in srgb, ${color} 55%, transparent), ${color})`, boxShadow: showGlow ? `0 0 12px ${color}` : undefined }}
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={{ duration: m.reduced ? 0 : 0.7 * m.speed, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  )
}

/** Circular progress ring (SVG). */
export function Ring({ value, size = 64, stroke = 6, color = 'var(--rs-accent)', label, children }: { value: number; size?: number; stroke?: number; color?: string; label: string; children?: React.ReactNode }) {
  const m = useMotion()
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(1, value))
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }} role="img" aria-label={`${label}: ${Math.round(pct * 100)}%`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--rs-surface2)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={false}
          animate={{ strokeDashoffset: c * (1 - pct) }}
          transition={{ duration: m.reduced ? 0 : 0.8 * m.speed, ease: [0.22, 1, 0.36, 1] }}
          style={{ filter: `drop-shadow(0 0 4px ${color})` }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  )
}
