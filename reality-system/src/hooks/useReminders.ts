import { useEffect } from 'react'
import { getDb } from '@/db/database'
import { useApp } from '@/store/app'
import { logicalDateKey } from '@/lib/dates'
import { occurrenceKeyFor } from '@/quests/recurrence'
import { newId } from '@/lib/id'

/**
 * Local reminders: once per day, quests marked "reminder" that are still open
 * today get an entry in the notification center. If the user explicitly
 * enabled browser notifications (and granted permission) a system
 * notification is shown too. Nothing leaves the device.
 */
export function useReminders() {
  const resetHour = useApp((s) => s.settings.general.resetHour)
  const weekStart = useApp((s) => s.settings.general.weekStart)
  const browser = useApp((s) => s.settings.general.browserNotifications)
  useEffect(() => {
    let cancelled = false
    const check = async () => {
      const db = getDb()
      const today = logicalDateKey(new Date(), resetHour)
      const marker = `reminders:${today}`
      if (await db.config.get(marker)) return
      const quests = await db.quests.where('status').equals('active').filter((q) => q.reminder).toArray()
      const open = []
      for (const q of quests) {
        const key = occurrenceKeyFor(q, today, weekStart)
        if (key && !(await db.completions.get(`${q.id}::${key}`))) open.push(q)
      }
      if (cancelled) return
      // clean up older markers, then record today's
      await db.config.where('key').startsWith('reminders:').delete()
      await db.config.put({ key: marker, value: true })
      if (!open.length) return
      const title = open.length === 1 ? `Reminder: ${open[0].title}` : `Reminder: ${open.length} quests are open today`
      const body = open.map((q) => q.title).slice(0, 5).join(' · ')
      await db.notifications.add({ id: newId('ntf'), kind: 'info', title, body, createdAt: new Date().toISOString(), read: false })
      if (browser && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(title, { body, icon: './icon.svg', silent: true })
        } catch {
          /* some browsers only allow notifications from a service worker */
        }
      }
    }
    void check()
    const id = window.setInterval(() => void check(), 30 * 60_000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [resetHour, weekStart, browser])
}
