import type { LevelInfo } from '@/game/levels'
import { AnimatedNumber, ProgressBar } from '@/components/ui/Progress'
import { useApp } from '@/store/app'
import { formatXp } from '@/lib/format'

export function XpBar({ level, compact }: { level: LevelInfo; compact?: boolean }) {
  const fmt = useApp((s) => s.settings.appearance.xpFormat)
  const pct = Math.round(level.progress * 100)
  return (
    <div className="w-full">
      <div className="mb-1.5 flex items-baseline justify-between gap-2 text-xs">
        <span className="label-caps text-muted">XP · Level {level.level}</span>
        {level.isMaxLevel ? (
          <span className="num text-highlight">Max level</span>
        ) : fmt === 'percent' ? (
          <span className="num text-fg">{pct}%</span>
        ) : (
          <span className="num text-fg">
            <AnimatedNumber value={level.xpIntoLevel} format={(n) => formatXp(n, fmt)} /> <span className="text-muted">/ {formatXp(level.xpForNext, fmt)}</span>
          </span>
        )}
      </div>
      <ProgressBar value={level.progress} label={`Progress to level ${level.level + 1}`} height={compact ? 'h-1.5' : 'h-2.5'} />
      {!compact && !level.isMaxLevel && (
        <p className="mt-1.5 text-xs text-muted">
          <span className="num text-fg">{formatXp(level.xpRemaining, fmt)}</span> XP to level {level.level + 1}
        </p>
      )}
    </div>
  )
}
