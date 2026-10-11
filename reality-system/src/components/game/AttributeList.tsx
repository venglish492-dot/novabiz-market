import { motion } from 'motion/react'
import type { AttributeDef } from '@/domain/schemas'
import type { ProgressState } from '@/game/progress'
import { ProgressBar } from '@/components/ui/Progress'
import { useUi } from '@/store/ui'
import { useMotion } from '@/hooks/useMotion'
import { Tooltip } from '@/components/ui/Misc'
import { formatNumber } from '@/lib/format'

export function AttributeList({ attributes, progress, compact }: { attributes: AttributeDef[]; progress: ProgressState; compact?: boolean }) {
  const pulse = useUi((s) => s.pulseAttribute)
  const m = useMotion()
  return (
    <ul className="space-y-2.5">
      {attributes.map((a) => {
        const lvl = progress.attributeLevels[a.id] ?? { level: 1, progress: 0, next: 0 }
        const points = progress.attributePoints[a.id] ?? 0
        const lit = pulse?.id === a.id
        return (
          <motion.li
            key={`${a.id}-${lit ? pulse?.at : 0}`}
            initial={lit && m.flourish ? { scale: 1.03 } : false}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6 }}
            className="relative rounded-lg"
          >
            {lit && m.flourish && (
              <motion.span
                aria-hidden
                className="absolute -inset-1 rounded-lg"
                style={{ boxShadow: `0 0 0 1px ${a.color}, 0 0 22px -2px ${a.color}` }}
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 1.6, ease: 'easeOut' }}
              />
            )}
            <div className="mb-1 flex items-center gap-2 text-sm">
              <Tooltip content={`${a.name}: ${a.description}`}>
                <span tabIndex={0} className="num w-12 shrink-0 font-semibold" style={{ color: a.color }}>
                  {a.abbr}
                </span>
              </Tooltip>
              {!compact && <span className="truncate text-muted">{a.name}</span>}
              <span className="num ml-auto text-xs text-muted">
                Lv <span className="text-fg">{lvl.level}</span> · {formatNumber(points)} pts
              </span>
            </div>
            <ProgressBar value={lvl.progress} color={a.color} label={`${a.name} progress to level ${lvl.level + 1}`} height="h-1.5" />
          </motion.li>
        )
      })}
    </ul>
  )
}
