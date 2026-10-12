/**
 * Locally synthesised sound effects (Web Audio API). No audio files are
 * downloaded or streamed. Sounds play only when the user has enabled them,
 * and only in response to an action.
 */
import type { SoundSettings } from '@/domain/settings'

export type SoundKind = 'quest' | 'levelUp' | 'rankUp' | 'achievement' | 'ui' | 'timer'

let ctx: AudioContext | null = null

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  ctx ??= new Ctor()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function tone(ac: AudioContext, freq: number, start: number, dur: number, volume: number, type: OscillatorType = 'sine') {
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, ac.currentTime + start)
  gain.gain.setValueAtTime(0, ac.currentTime + start)
  gain.gain.linearRampToValueAtTime(volume, ac.currentTime + start + 0.015)
  gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + start + dur)
  osc.connect(gain).connect(ac.destination)
  osc.start(ac.currentTime + start)
  osc.stop(ac.currentTime + start + dur + 0.05)
}

const PATTERNS: Record<SoundKind, Array<[number, number, number, OscillatorType?]>> = {
  ui: [[880, 0, 0.06, 'triangle']],
  quest: [
    [660, 0, 0.12],
    [990, 0.08, 0.22],
  ],
  achievement: [
    [784, 0, 0.14, 'triangle'],
    [988, 0.1, 0.14, 'triangle'],
    [1319, 0.2, 0.32, 'triangle'],
  ],
  levelUp: [
    [523, 0, 0.18],
    [659, 0.12, 0.18],
    [784, 0.24, 0.18],
    [1047, 0.36, 0.5],
  ],
  rankUp: [
    [392, 0, 0.3, 'sawtooth'],
    [523, 0.18, 0.3],
    [659, 0.36, 0.3],
    [784, 0.54, 0.3],
    [1047, 0.72, 0.8],
  ],
  timer: [
    [880, 0, 0.25],
    [880, 0.35, 0.25],
    [1175, 0.7, 0.45],
  ],
}

export function playSound(kind: SoundKind, settings: SoundSettings): void {
  if (!settings.enabled || !settings[kind]) return
  const ac = audio()
  if (!ac) return
  const vol = Math.max(0, Math.min(1, settings.volume)) * 0.18
  for (const [f, s, d, t] of PATTERNS[kind]) tone(ac, f, s, d, kind === 'rankUp' && t === 'sawtooth' ? vol * 0.4 : vol, t)
}

/** Plays a sound regardless of category toggles (used by the "test sound" buttons). */
export function previewSound(kind: SoundKind, volume: number): void {
  playSound(kind, { enabled: true, volume, quest: true, levelUp: true, rankUp: true, achievement: true, ui: true, timer: true, ambient: false })
}

/** Optional ambient drone, generated locally. Returns a stop function. */
export function startAmbient(volume: number): () => void {
  const ac = audio()
  if (!ac) return () => {}
  const gain = ac.createGain()
  gain.gain.value = 0
  gain.gain.linearRampToValueAtTime(volume * 0.03, ac.currentTime + 2)
  const filter = ac.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 420
  const oscs = [55, 82.4, 110.2].map((f) => {
    const o = ac.createOscillator()
    o.type = 'sawtooth'
    o.frequency.value = f
    o.connect(filter)
    o.start()
    return o
  })
  filter.connect(gain).connect(ac.destination)
  return () => {
    gain.gain.linearRampToValueAtTime(0, ac.currentTime + 0.6)
    window.setTimeout(() => oscs.forEach((o) => o.stop()), 700)
  }
}
