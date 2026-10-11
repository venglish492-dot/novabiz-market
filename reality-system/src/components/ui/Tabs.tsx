import { useId, useRef, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/cn'

export interface TabItem<T extends string> {
  id: T
  label: ReactNode
  badge?: ReactNode
}

interface TabsProps<T extends string> {
  items: TabItem<T>[]
  value: T
  onChange: (id: T) => void
  label: string
  className?: string
}

/** Keyboard-accessible tab list (arrow keys, Home, End). */
export function Tabs<T extends string>({ items, value, onChange, label, className }: TabsProps<T>) {
  const group = useId()
  const refs = useRef<Array<HTMLButtonElement | null>>([])
  const onKey = (e: React.KeyboardEvent, index: number) => {
    let next = -1
    if (e.key === 'ArrowRight') next = (index + 1) % items.length
    if (e.key === 'ArrowLeft') next = (index - 1 + items.length) % items.length
    if (e.key === 'Home') next = 0
    if (e.key === 'End') next = items.length - 1
    if (next >= 0) {
      e.preventDefault()
      onChange(items[next].id)
      refs.current[next]?.focus()
    }
  }
  return (
    <div role="tablist" aria-label={label} className={cn('flex gap-1 overflow-x-auto rounded-xl border border-line bg-surface/70 p-1', className)}>
      {items.map((item, i) => {
        const active = item.id === value
        return (
          <button
            key={item.id}
            ref={(el) => {
              refs.current[i] = el
            }}
            role="tab"
            type="button"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(item.id)}
            onKeyDown={(e) => onKey(e, i)}
            className={cn('relative flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors', active ? 'text-fg' : 'text-muted hover:text-fg')}
          >
            {active && <motion.span layoutId={`tab-${group}`} className="absolute inset-0 rounded-lg border border-accent/40 bg-accent/12" transition={{ duration: 0.25 }} />}
            <span className="relative">{item.label}</span>
            {item.badge !== undefined && <span className="relative">{item.badge}</span>}
          </button>
        )
      })}
    </div>
  )
}

interface SegmentedProps<T extends string> {
  options: Array<{ value: T; label: ReactNode }>
  value: T
  onChange: (v: T) => void
  label: string
  className?: string
}

/** Compact radio-group style selector. */
export function Segmented<T extends string>({ options, value, onChange, label, className }: SegmentedProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className={cn('inline-flex flex-wrap gap-1 rounded-xl border border-line bg-surface/70 p-1', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-lg px-3 py-1.5 text-sm transition-colors',
            o.value === value ? 'bg-accent/15 text-fg ring-1 ring-accent/40' : 'text-muted hover:text-fg hover:bg-accent/5',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
