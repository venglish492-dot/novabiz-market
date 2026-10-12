import { useEffect, useState } from 'react'
import { logicalDateKey } from '@/lib/dates'
import { useApp } from '@/store/app'

/** The current logical day; updates when the day rolls over or the tab becomes visible again. */
export function useToday(): string {
  const resetHour = useApp((s) => s.settings.general.resetHour)
  const [today, setToday] = useState(() => logicalDateKey(new Date(), resetHour))
  useEffect(() => {
    const check = () => setToday(logicalDateKey(new Date(), resetHour))
    check()
    const id = window.setInterval(check, 60_000)
    document.addEventListener('visibilitychange', check)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', check)
    }
  }, [resetHour])
  return today
}
