import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { useUi, type Toast } from '@/store/ui'
import { KIND_ICON } from './kindIcons'
import { useMotion } from '@/hooks/useMotion'
import { cn } from '@/lib/cn'

const KIND_COLOR: Partial<Record<Toast['kind'], string>> = {
  success: 'var(--rs-success)',
  warning: 'var(--rs-warning)',
  error: 'var(--rs-danger)',
  achievement: 'var(--rs-highlight)',
  'rank-up': 'var(--rs-highlight)',
  'level-up': 'var(--rs-accent)',
}

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useUi((s) => s.dismissToast)
  const m = useMotion()
  const [hover, setHover] = useState(false)
  useEffect(() => {
    if (!toast.duration || hover) return
    const id = window.setTimeout(() => dismiss(toast.id), toast.duration)
    return () => window.clearTimeout(id)
  }, [toast.id, toast.duration, hover, dismiss])
  const I = KIND_ICON[toast.kind]
  const color = KIND_COLOR[toast.kind] ?? 'var(--rs-accent)'
  return (
    <motion.li
      layout={!m.reduced}
      initial={{ opacity: 0, x: 24 * m.distance, scale: m.distance ? 0.96 : 1 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 24 * m.distance, transition: { duration: 0.15 } }}
      transition={{ duration: 0.28 * m.speed, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      role={toast.kind === 'error' ? 'alert' : 'status'}
      className="panel pointer-events-auto flex w-full items-start gap-3 overflow-hidden p-3 pr-2"
      style={{ borderColor: `color-mix(in srgb, ${color} 45%, transparent)`, boxShadow: `0 0 26px -10px ${color}` }}
    >
      <I className="mt-0.5 size-5 shrink-0" style={{ color }} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-fg">{toast.title}</p>
        {toast.body && <p className="mt-0.5 text-xs text-muted">{toast.body}</p>}
        {toast.action && (
          <button
            type="button"
            className="mt-1.5 text-xs font-semibold text-accent hover:underline"
            onClick={() => {
              toast.action!.run()
              dismiss(toast.id)
            }}
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button type="button" onClick={() => dismiss(toast.id)} aria-label="Dismiss notification" className="rounded-md p-1 text-muted hover:text-fg">
        <X className="size-4" aria-hidden />
      </button>
    </motion.li>
  )
}

export function ToastHost() {
  const toasts = useUi((s) => s.toasts)
  return (
    <ol aria-live="polite" aria-label="Notifications" className={cn('pointer-events-none fixed right-3 bottom-20 z-[60] flex w-[min(380px,calc(100vw-1.5rem))] flex-col gap-2 md:bottom-4')}>
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </AnimatePresence>
    </ol>
  )
}
