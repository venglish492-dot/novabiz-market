import { useSyncExternalStore } from 'react'
import { useApp } from '@/store/app'
import { motionProfile, type MotionProfile } from '@/motion/tokens'

const QUERY = '(prefers-reduced-motion: reduce)'

function subscribe(cb: () => void) {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {}
  const mq = window.matchMedia(QUERY)
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}
const getSnapshot = () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(QUERY).matches : false)

export function useSystemReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}

/** Effective reduced-motion: the in-app choice wins; 'system' follows the OS. */
export function useReducedMotion(): boolean {
  const pref = useApp((s) => s.settings.appearance.reducedMotion)
  const system = useSystemReducedMotion()
  return pref === 'reduce' || (pref === 'system' && system)
}

export function useMotion(): MotionProfile {
  const level = useApp((s) => s.settings.appearance.motion)
  const reduced = useReducedMotion()
  return motionProfile(level, reduced)
}
