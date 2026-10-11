/**
 * Date strategy
 * -------------
 * - Moments in time are stored as ISO-8601 UTC strings (`createdAt`, `completedAt`).
 * - Calendar days are stored as local "date keys" (YYYY-MM-DD) captured at the
 *   moment an event happens. A later timezone change never rewrites history,
 *   because the date key was frozen when the event was recorded.
 * - A "logical day" can start later than midnight (the configurable daily reset
 *   hour), so finishing a quest at 01:30 can still count for the previous day.
 */

export type DateKey = string

const pad = (n: number) => String(n).padStart(2, '0')

export function toDateKey(date: Date): DateKey {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** The logical day for a moment, honouring the daily reset hour (0–23). */
export function logicalDateKey(now: Date, resetHour = 0): DateKey {
  const shifted = new Date(now.getTime())
  shifted.setHours(shifted.getHours() - resetHour)
  return toDateKey(shifted)
}

export function parseDateKey(key: DateKey): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function isDateKey(value: unknown): value is DateKey {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

export function addDays(key: DateKey, days: number): DateKey {
  const d = parseDateKey(key)
  d.setDate(d.getDate() + days)
  return toDateKey(d)
}

/** Whole days from a to b (b - a), DST-safe because it works on calendar dates. */
export function daysBetween(a: DateKey, b: DateKey): number {
  const [ay, am, ad] = a.split('-').map(Number)
  const [by, bm, bd] = b.split('-').map(Number)
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86_400_000)
}

/** 0 = Sunday … 6 = Saturday */
export function weekdayOf(key: DateKey): number {
  return parseDateKey(key).getDay()
}

/** The first day of the week containing `key`. weekStart: 0 = Sunday, 1 = Monday. */
export function weekStartKey(key: DateKey, weekStart: 0 | 1): DateKey {
  const offset = (weekdayOf(key) - weekStart + 7) % 7
  return addDays(key, -offset)
}

export function monthStartKey(key: DateKey): DateKey {
  return `${key.slice(0, 7)}-01`
}

export function addMonths(key: DateKey, months: number): DateKey {
  const d = parseDateKey(monthStartKey(key))
  d.setMonth(d.getMonth() + months)
  return toDateKey(d)
}

export function daysInMonth(key: DateKey): number {
  const d = parseDateKey(key)
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
}

/** Inclusive list of date keys from start to end. */
export function dateRange(start: DateKey, end: DateKey): DateKey[] {
  const out: DateKey[] = []
  const n = daysBetween(start, end)
  for (let i = 0; i <= n; i++) out.push(addDays(start, i))
  return out
}

export type DateFormat = 'locale' | 'iso' | 'dmy' | 'mdy'

export function formatDateKey(key: DateKey, format: DateFormat = 'locale', opts?: { weekday?: boolean }): string {
  const d = parseDateKey(key)
  switch (format) {
    case 'iso':
      return key
    case 'dmy':
      return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`
    case 'mdy':
      return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()}`
    default:
      return d.toLocaleDateString(undefined, {
        weekday: opts?.weekday ? 'short' : undefined,
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
  }
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

export function formatDateTime(iso: string, format: DateFormat = 'locale'): string {
  return `${formatDateKey(toDateKey(new Date(iso)), format)} · ${formatTime(iso)}`
}

export function nowIso(): string {
  return new Date().toISOString()
}

export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
