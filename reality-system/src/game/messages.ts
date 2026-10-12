/**
 * Contextual system messages built only from real stored state.
 * Supportive by design: no guilt, no pressure, no invented analysis.
 */
import { daysBetween } from '@/lib/dates'

export interface MessageInput {
  today: string
  totalQuests: number
  todayTotal: number
  todayDone: number
  lastActiveDate: string | null
  weekCompletions: number
  weeklyQuestGoal: number
  focusMinutesToday: number
  weekFocusMinutes: number
  weeklyFocusGoal: number
  dueSoon: number
  xpRemaining: number
  xpForNext: number
  nextLevel: number
  lastCompletedTitle: string | null
}

export interface SystemMessage {
  tone: 'info' | 'success' | 'welcome'
  text: string
}

export function systemMessages(i: MessageInput): SystemMessage[] {
  const out: SystemMessage[] = []
  if (i.totalQuests === 0) {
    return [{ tone: 'welcome', text: 'Your system is online. Create your first quest to begin tracking real progress.' }]
  }
  const gap = i.lastActiveDate ? daysBetween(i.lastActiveDate, i.today) : null
  if (gap !== null && gap >= 3) {
    out.push({ tone: 'welcome', text: 'Welcome back. Your progress is exactly where you left it — one small quest is a great restart.' })
  }
  const open = i.todayTotal - i.todayDone
  if (i.todayTotal > 0 && open === 0) out.push({ tone: 'success', text: `All ${i.todayTotal} of today's quests are complete. Rest is part of the system too.` })
  else if (open > 0) out.push({ tone: 'info', text: `${open} ${open === 1 ? 'quest remains' : 'quests remain'} in today's plan.` })
  else out.push({ tone: 'info', text: 'Nothing is scheduled for today. Add a quest, or enjoy a lighter day.' })

  if (i.weeklyQuestGoal > 0 && i.weekCompletions >= i.weeklyQuestGoal) out.push({ tone: 'success', text: `You reached your weekly goal of ${i.weeklyQuestGoal} completed quests.` })
  if (i.weeklyFocusGoal > 0 && i.weekFocusMinutes >= i.weeklyFocusGoal) out.push({ tone: 'success', text: `Weekly focus goal reached: ${i.weekFocusMinutes} minutes this week.` })
  else if (i.focusMinutesToday > 0) out.push({ tone: 'info', text: `You have focused for ${i.focusMinutesToday} minutes today.` })
  if (i.lastCompletedTitle && i.todayDone > 0) out.push({ tone: 'info', text: `Latest completion: “${i.lastCompletedTitle}”.` })
  if (i.xpForNext > 0 && i.xpRemaining / i.xpForNext <= 0.15) out.push({ tone: 'info', text: `${i.xpRemaining} XP until level ${i.nextLevel}.` })
  if (i.dueSoon > 0) out.push({ tone: 'info', text: `${i.dueSoon} ${i.dueSoon === 1 ? 'quest has' : 'quests have'} a deadline within three days.` })
  return out.slice(0, 3)
}
