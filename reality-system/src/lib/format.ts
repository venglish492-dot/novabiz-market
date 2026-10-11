export type XpFormat = 'full' | 'compact' | 'percent'

const full = new Intl.NumberFormat(undefined)
const compact = new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 })

export function formatNumber(n: number): string {
  return full.format(Math.round(n))
}

export function formatXp(n: number, format: XpFormat = 'full'): string {
  if (format === 'compact') return compact.format(Math.round(n))
  return full.format(Math.round(n))
}

export function formatMinutes(totalMinutes: number): string {
  const m = Math.max(0, Math.round(totalMinutes))
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  const rest = m % 60
  return rest ? `${h}h ${rest}m` : `${h}h`
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.ceil(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(sec).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

export function pluralize(n: number, one: string, many = `${one}s`): string {
  return `${formatNumber(n)} ${n === 1 ? one : many}`
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

export function percent(part: number, whole: number): number {
  if (whole <= 0) return 0
  return clamp(Math.round((part / whole) * 100), 0, 100)
}
