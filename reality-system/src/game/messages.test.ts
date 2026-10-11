import { describe, expect, it } from 'vitest'
import { systemMessages, type MessageInput } from './messages'

const base: MessageInput = {
  today: '2026-10-11', totalQuests: 5, todayTotal: 3, todayDone: 0, lastActiveDate: '2026-10-10', weekCompletions: 0, weeklyQuestGoal: 20,
  focusMinutesToday: 0, weekFocusMinutes: 0, weeklyFocusGoal: 300, dueSoon: 0, xpRemaining: 80, xpForNext: 100, nextLevel: 2, lastCompletedTitle: null,
}

describe('system messages', () => {
  it('guides a brand-new user without inventing data', () => {
    expect(systemMessages({ ...base, totalQuests: 0 })[0].text).toMatch(/first quest/)
  })
  it('counts remaining quests', () => {
    expect(systemMessages(base)[0].text).toBe('3 quests remain in today\'s plan.')
  })
  it('is supportive after a break', () => {
    const msgs = systemMessages({ ...base, lastActiveDate: '2026-10-01' })
    expect(msgs[0].tone).toBe('welcome')
    expect(msgs[0].text).not.toMatch(/fail|lost|missed/i)
  })
  it('celebrates a finished day', () => {
    expect(systemMessages({ ...base, todayDone: 3 })[0].tone).toBe('success')
  })
})
