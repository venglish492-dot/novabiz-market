import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function Badge({ children, color, className, title }: { children: ReactNode; color?: string; className?: string; title?: string }) {
  return (
    <span
      title={title}
      className={cn('inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium leading-none whitespace-nowrap', className)}
      style={
        color
          ? { color, borderColor: `color-mix(in srgb, ${color} 40%, transparent)`, background: `color-mix(in srgb, ${color} 12%, transparent)` }
          : { color: 'var(--rs-muted)', borderColor: 'var(--rs-border)' }
      }
    >
      {children}
    </span>
  )
}

export function EmptyState({ icon, title, body, action, className }: { icon?: ReactNode; title: string; body?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line/80 px-6 py-8 text-center', className)}>
      {icon && <div className="mb-1 text-accent/80">{icon}</div>}
      <p className="font-display text-sm tracking-wide text-fg">{title}</p>
      {body && <p className="max-w-sm text-sm text-muted">{body}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton h-4', className)} aria-hidden />
}

export function LoadingBlock({ rows = 3, label = 'Loading' }: { rows?: number; label?: string }) {
  return (
    <div className="space-y-3" role="status" aria-label={label}>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className={cn('h-12', i % 2 ? 'w-11/12' : 'w-full')} />
      ))}
    </div>
  )
}

/** Simple accessible tooltip that appears on hover and keyboard focus. */
export function Tooltip({ content, children, className }: { content: ReactNode; children: ReactNode; className?: string }) {
  return (
    <span className={cn('group/tt relative inline-flex', className)}>
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-2 w-max max-w-60 -translate-x-1/2 translate-y-1 rounded-lg border border-line bg-surface2 px-2.5 py-1.5 text-xs text-fg opacity-0 shadow-xl transition duration-150 group-hover/tt:translate-y-0 group-hover/tt:opacity-100 group-focus-within/tt:translate-y-0 group-focus-within/tt:opacity-100"
      >
        {content}
      </span>
    </span>
  )
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="num rounded border border-line bg-surface2 px-1.5 py-0.5 text-[11px] text-muted">{children}</kbd>
}

export function SectionTitle({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-gap flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {eyebrow && <p className="label-caps text-accent">{eyebrow}</p>}
        <h1 className="font-display text-xl font-bold tracking-wider text-fg uppercase sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Stat({ label, value, hint, accent }: { label: string; value: ReactNode; hint?: ReactNode; accent?: string }) {
  return (
    <div className="rounded-xl border border-line/80 bg-surface/60 px-3 py-2.5">
      <p className="label-caps text-muted">{label}</p>
      <p className="num mt-1 text-xl font-semibold" style={{ color: accent ?? 'var(--rs-text)' }}>
        {value}
      </p>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </div>
  )
}
