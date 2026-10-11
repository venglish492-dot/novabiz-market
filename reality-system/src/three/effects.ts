/** Shared 3D effects configuration derived from user settings and the device. */
import type { Appearance, AvatarConfig } from '@/domain/settings'

export interface Effects3D {
  dpr: [number, number]
  antialias: boolean
  particleCount: number
  animate: boolean
  rotationSpeed: number
}

const ROTATION: Record<AvatarConfig['rotation'], number> = { still: 0, calm: 0.18, steady: 0.4, fast: 0.9 }

export function effects3D(appearance: Appearance, avatar: AvatarConfig, reduced: boolean, visible: boolean): Effects3D {
  const cores = typeof navigator !== 'undefined' ? (navigator.hardwareConcurrency ?? 8) : 8
  const quality = appearance.quality === 'auto' ? (cores <= 4 ? 'low' : 'medium') : appearance.quality
  const base = quality === 'low' ? 120 : quality === 'medium' ? 260 : 480
  const motionFactor = appearance.motion === 'maximum' ? 1.4 : appearance.motion === 'minimal' ? 0.4 : 1
  return {
    dpr: quality === 'low' ? [1, 1] : quality === 'medium' ? [1, 1.5] : [1, 2],
    antialias: quality !== 'low',
    particleCount: avatar.particles === 'none' ? 0 : Math.round(base * motionFactor),
    animate: visible && !reduced && appearance.motion !== 'minimal',
    rotationSpeed: ROTATION[avatar.rotation],
  }
}
