import { useRef, useState } from 'react'
import { motion } from 'motion/react'
import { Check, Clock, ListChecks, Repeat, Timer, CalendarClock, Gauge, Loader2 } from 'lucide-react'
import type { Category, Completion, Quest } from '@/domain/schemas'
import { useApp } from '@/store/app'
import { useUi } from '@/store/ui'
import { completeQuestAction, undoCompletionAction } from '@/app/actions'
import { questBaseXp, difficultyRule } from '@/game/rules'
import { Badge } from '@/components/ui/Misc'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/cn'
import { daysBetween, formatDateKey } from '@/lib/dates'
import { formatMinutes } from '@/lib/format'
import { useMotion } from '@/hooks/useMotion'
import { describeRecurrence } from '@/quests/recurrence'
import { navigate } from '@/app/router'
import { DIFFICULTY_COLORS } from './difficultyColors'


interface QuestCardProps {
  quest: Quest
  occurrenceKey: string
  completion: Completion | null
  category?: Category
  today: string
  progressLabel?: string
}

/** A quest occurrence with quick completion. Needs-input quest types open their details instead. */
export function QuestCard({ quest, occurrenceKey, completion, category, today, progressLabel }: QuestCardProps) {
  const rules = useApp((s) => s.rules)
  const dateFormat = useApp((s) => s.settings.appearance.dateFormat)
  const openDetails = useUi((s) => s.openDetails)
  const setFocusTarget = useUi((s) => s.setFocusTarget)
  const m = useMotion()
  const [busy, setBusy] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const done = !!completion
  const xp = done ? completion.xpAwarded : questBaseXp(rules, quest)
  const diff = difficultyRule(rules, quest.difficulty)
  const dueIn = quest.dueDate ? daysBetween(today, quest.dueDate) : null
  const needsInput = !done && (quest.type === 'checklist' || quest.type === 'measurable')

  const onPrimary = async () => {
    if (busy) return
    if (done) {
      setBusy(true)
      await undoCompletionAction(quest, occurrenceKey)
      setBusy(false)
      return
    }
    if (needsInput) return openDetails(quest.id, occurrenceKey)
    if (quest.type === 'timed') {
      setFocusTarget({ questId: quest.id, occurrenceKey })
      return navigate('focus')
    }
    setBusy(true)
    const rect = btnRef.current?.getBoundingClientRect()
    await completeQuestAction(quest, occurrenceKey, rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : undefined)
    setBusy(false)
  }

  const primaryLabel = done ? `Undo completion of ${quest.title}` : quest.type === 'timed' ? `Start focus session for ${quest.title}` : needsInput ? `Open ${quest.title} to log progress` : `Complete ${quest.title}`

  return (
    <motion.article
      layout={m.distance ? 'position' : false}
      whileHover={m.distance ? { y: -2 } : undefined}
      className={cn(
        'group relative flex items-center gap-3 rounded-xl border bg-surface/70 p-3 transition-colors',
        done ? 'border-success/30 bg-success/[0.04]' : 'border-line hover:border-accent/50 hover:bg-surface2/80',
      )}
      style={{ borderLeft: `3px solid ${category?.color ?? 'var(--rs-accent)'}` }}
    >
      <button
        ref={btnRef}
        type="button"
        onClick={onPrimary}
        aria-label={primaryLabel}
        title={primaryLabel}
        disabled={busy}
        className={cn(
          'relative grid size-9 shrink-0 place-items-center rounded-lg border transition-all duration-200',
          done
            ? 'border-success bg-success/20 text-success'
            : 'border-accent/50 bg-accent/5 text-accent hover:bg-accent/20 hover:shadow-[0_0_16px_-4px_var(--rs-accent)]',
        )}
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : done ? (
          <motion.span initial={m.distance ? { scale: 0.4, rotate: -30 } : false} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 18 }}>
            <Check className="size-5" aria-hidden />
          </motion.span>
        ) : quest.type === 'timed' ? (
          <Timer className="size-4" aria-hidden />
        ) : quest.type === 'checklist' ? (
          <ListChecks className="size-4" aria-hidden />
        ) : quest.type === 'measurable' ? (
          <Gauge className="size-4" aria-hidden />
        ) : (
          <Check className="size-4 opacity-40 transition-opacity group-hover:opacity-90" aria-hidden />
        )}
      </button>

      <button type="button" onClick={() => openDetails(quest.id, occurrenceKey)} className="min-w-0 flex-1 text-left" aria-label={`Open details for ${quest.title}`}>
        <p className={cn('truncate font-medium', done ? 'text-muted line-through decoration-success/60' : 'text-fg')}>{quest.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted">
          {category && (
            <Badge color={category.color}>
              <Icon name={category.icon} className="size-3" />
              {category.name}
            </Badge>
          )}
          <Badge color={DIFFICULTY_COLORS[quest.difficulty]}>{diff.label}</Badge>
          {quest.estimatedMinutes > 0 && (
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3" aria-hidden />
              {formatMinutes(quest.estimatedMinutes)}
            </span>
          )}
          {quest.recurrence.kind !== 'none' && (
            <span className="inline-flex items-center gap-1">
              <Repeat className="size-3" aria-hidden />
              {describeRecurrence(quest.recurrence)}
            </span>
          )}
          {dueIn !== null && !done && (
            <span className={cn('inline-flex items-center gap-1', dueIn < 0 ? 'text-warning' : dueIn <= 1 ? 'text-accent' : '')}>
              <CalendarClock className="size-3" aria-hidden />
              {dueIn < 0 ? 'Past due' : dueIn === 0 ? 'Due today' : `Due ${formatDateKey(quest.dueDate!, dateFormat)}`}
            </span>
          )}
          {progressLabel && <span className="text-accent">{progressLabel}</span>}
        </div>
      </button>

      <div className="shrink-0 text-right">
        <p className={cn('num text-sm font-semibold', done ? 'text-success' : 'text-highlight')}>
          {done ? '+' : ''}
          {xp} XP
        </p>
        {done && completion.xpCapped && <p className="text-[10px] text-warning">capped</p>}
      </div>
    </motion.article>
  )
}
