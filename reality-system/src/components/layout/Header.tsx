import { useState } from 'react'
import { Bell, Plus, Search, Settings } from 'lucide-react'
import { useApp } from '@/store/app'
import { useUi } from '@/store/ui'
import { useRouter } from '@/app/router'
import { useProgress, useUnreadNotifications } from '@/hooks/useData'
import { useToday } from '@/hooks/useToday'
import { IconButton } from '@/components/ui/Button'
import { Kbd } from '@/components/ui/Misc'
import { AvatarEmblem } from '@/components/game/AvatarEmblem'
import { RankEmblem } from '@/components/game/RankEmblem'
import { NotificationCenter } from './NotificationCenter'
import { formatDateKey } from '@/lib/dates'
import { useActiveTimer, useNow } from '@/hooks/useActiveTimer'
import { remainingSeconds } from '@/focus/timer'
import { formatClock } from '@/lib/format'
import { Hourglass } from 'lucide-react'

function greeting(hour: number) {
  if (hour < 5) return 'Still awake'
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function Header() {
  const profile = useApp((s) => s.profile)
  const avatar = useApp((s) => s.settings.avatar)
  const dateFormat = useApp((s) => s.settings.appearance.dateFormat)
  const progress = useProgress()
  const unread = useUnreadNotifications()
  const today = useToday()
  const navigate = useRouter((s) => s.navigate)
  const setPalette = useUi((s) => s.setPalette)
  const setQuickAdd = useUi((s) => s.setQuickAdd)
  const [notifOpen, setNotifOpen] = useState(false)
  const name = profile.displayName || 'Player'

  return (
    <header className="sticky top-0 z-20 border-b border-line/50 bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1500px] items-center gap-3 px-4 sm:px-6">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-fg">
            {greeting(new Date().getHours())}, <span className="font-semibold">{name}</span>
            {profile.equippedTitle && <span className="ml-2 hidden text-xs text-highlight sm:inline">«{profile.equippedTitle}»</span>}
          </p>
          <p className="label-caps text-muted">{formatDateKey(today, dateFormat, { weekday: true })}</p>
        </div>

        <TimerChip />
        {progress && (
          <button type="button" onClick={() => navigate('status')} className="hidden items-center gap-2 rounded-xl border border-line/70 px-2.5 py-1 hover:border-accent/50 sm:flex" aria-label={`Level ${progress.level.level}, rank ${progress.rank.rank.label}. Open status profile`}>
            <RankEmblem rank={progress.rank.rank} index={progress.rank.index} size={30} />
            <span className="text-left leading-tight">
              <span className="label-caps block text-muted">Level</span>
              <span className="num text-sm font-bold text-fg">{progress.level.level}</span>
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setPalette(true)}
          className="hidden h-10 items-center gap-2 rounded-xl border border-line/70 bg-surface/60 px-3 text-sm text-muted hover:border-accent/50 hover:text-fg lg:flex"
          aria-label="Search and quick navigation (Ctrl+K)"
        >
          <Search className="size-4" aria-hidden />
          <span>Search…</span>
          <Kbd>Ctrl K</Kbd>
        </button>
        <IconButton label="Search and quick navigation" shortcut="Ctrl+K" className="lg:hidden" onClick={() => setPalette(true)}>
          <Search className="size-5" aria-hidden />
        </IconButton>
        <IconButton label="Quick add quest" shortcut="Shift+N" variant="subtle" onClick={() => setQuickAdd(true)}>
          <Plus className="size-5" aria-hidden />
        </IconButton>
        <span className="relative">
          <IconButton label={unread ? `Notifications (${unread} unread)` : 'Notifications'} onClick={() => setNotifOpen(true)}>
            <Bell className="size-5" aria-hidden />
          </IconButton>
          {unread > 0 && (
            <span className="num pointer-events-none absolute top-1 right-1 grid min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-on-accent">{unread > 9 ? '9+' : unread}</span>
          )}
        </span>
        <IconButton label="Settings" className="hidden sm:inline-flex" onClick={() => navigate('settings')}>
          <Settings className="size-5" aria-hidden />
        </IconButton>
        <button type="button" onClick={() => navigate('status')} aria-label="Open status profile" className="rounded-xl">
          <AvatarEmblem avatar={avatar} name={name} size={38} />
        </button>
      </div>
      <NotificationCenter open={notifOpen} onClose={() => setNotifOpen(false)} />
    </header>
  )
}

/** Shows a running focus timer from any screen. */
function TimerChip() {
  const timer = useActiveTimer()
  const route = useRouter((s) => s.route)
  const navigate = useRouter((s) => s.navigate)
  const now = useNow(!!timer && timer.pausedAt === null, 1000)
  if (!timer || route === 'focus') return null
  return (
    <button
      type="button"
      onClick={() => navigate('focus')}
      className="flex h-10 items-center gap-2 rounded-xl border border-accent/40 bg-accent/10 px-3 text-sm text-fg"
      aria-label={`Focus timer: ${formatClock(remainingSeconds(timer, now))} remaining. Open Focus Chamber`}
    >
      <Hourglass className="size-4 text-accent" aria-hidden />
      <span className="num">{formatClock(remainingSeconds(timer, now))}</span>
      {timer.pausedAt && <span className="text-xs text-warning">paused</span>}
    </button>
  )
}
