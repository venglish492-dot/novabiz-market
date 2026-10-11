/**
 * Motion design tokens. All interface animation timing comes from here so
 * the four intensity levels change real behaviour consistently.
 * Only transform and opacity are animated for routine transitions.
 */
import type { Transition, Variants } from 'motion/react'
import type { MotionLevel } from '@/domain/settings'

export const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1]
export const EASE_IN_OUT: [number, number, number, number] = [0.65, 0, 0.35, 1]

export interface MotionProfile {
  level: MotionLevel
  reduced: boolean
  /** multiplier for durations */
  speed: number
  /** multiplier for travel distances */
  distance: number
  /** allow particle bursts and glow flourishes */
  flourish: boolean
  /** cinematic overlays for level-ups */
  cinematic: boolean
  /** particle count multiplier for effects */
  particles: number
}

export function motionProfile(level: MotionLevel, reduced: boolean): MotionProfile {
  if (reduced || level === 'minimal') return { level: 'minimal', reduced, speed: 0.6, distance: 0, flourish: false, cinematic: false, particles: 0 }
  if (level === 'balanced') return { level, reduced, speed: 1, distance: 1, flourish: true, cinematic: false, particles: 0.6 }
  if (level === 'cinematic') return { level, reduced, speed: 1.15, distance: 1.3, flourish: true, cinematic: true, particles: 1 }
  return { level, reduced, speed: 1.25, distance: 1.6, flourish: true, cinematic: true, particles: 1.6 }
}

export function transition(p: MotionProfile, base = 0.32): Transition {
  return { duration: base * p.speed, ease: EASE_OUT }
}

export function pageVariants(p: MotionProfile): Variants {
  const y = 14 * p.distance
  return {
    initial: { opacity: 0, y },
    enter: { opacity: 1, y: 0, transition: transition(p, 0.36) },
    exit: { opacity: 0, y: -y / 2, transition: transition(p, 0.18) },
  }
}

export function listVariants(p: MotionProfile): { container: Variants; item: Variants } {
  return {
    container: { initial: {}, enter: { transition: { staggerChildren: p.distance ? 0.045 : 0 } } },
    item: {
      initial: { opacity: 0, y: 10 * p.distance },
      enter: { opacity: 1, y: 0, transition: transition(p, 0.3) },
      exit: { opacity: 0, scale: p.distance ? 0.96 : 1, transition: transition(p, 0.2) },
    },
  }
}

export function modalVariants(p: MotionProfile): { backdrop: Variants; panel: Variants } {
  return {
    backdrop: { initial: { opacity: 0 }, enter: { opacity: 1, transition: transition(p, 0.2) }, exit: { opacity: 0, transition: transition(p, 0.15) } },
    panel: {
      initial: { opacity: 0, y: 18 * p.distance, scale: p.distance ? 0.98 : 1 },
      enter: { opacity: 1, y: 0, scale: 1, transition: transition(p, 0.3) },
      exit: { opacity: 0, y: 10 * p.distance, scale: p.distance ? 0.98 : 1, transition: transition(p, 0.16) },
    },
  }
}

export const hoverLift = (p: MotionProfile) => (p.distance ? { y: -2 } : {})
export const pressScale = (p: MotionProfile) => (p.distance ? { scale: 0.97 } : {})
