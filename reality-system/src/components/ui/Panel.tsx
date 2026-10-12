import type { HTMLAttributes, ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'

interface PanelProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title?: ReactNode
  eyebrow?: string
  icon?: ReactNode
  actions?: ReactNode
  glow?: boolean
  collapsed?: boolean
  onToggleCollapse?: () => void
  bodyClassName?: string
  as?: 'section' | 'div' | 'article'
}

/** The standard holographic container used across the system. */
export function Panel({ title, eyebrow, icon, actions, glow, collapsed, onToggleCollapse, className, bodyClassName, children, as: Tag = 'section', ...rest }: PanelProps) {
  const headingId = rest.id ? `${rest.id}-title` : undefined
  return (
    <Tag className={cn('panel flex flex-col', glow && 'panel-glow', className)} aria-labelledby={title ? headingId : undefined} {...rest}>
      {(title || actions) && (
        <header className="flex items-center gap-3 px-pad pt-pad pb-3">
          {icon && <span className="text-accent">{icon}</span>}
          <div className="min-w-0 flex-1">
            {eyebrow && <p className="label-caps text-muted">{eyebrow}</p>}
            {title && (
              <h2 id={headingId} className="truncate font-display text-sm font-semibold tracking-wider text-fg uppercase">
                {title}
              </h2>
            )}
          </div>
          {actions}
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-expanded={!collapsed}
              aria-label={collapsed ? 'Expand panel' : 'Collapse panel'}
              className="rounded-lg p-1.5 text-muted hover:bg-accent/10 hover:text-fg"
            >
              <ChevronDown className={cn('size-4 transition-transform', collapsed && '-rotate-90')} aria-hidden />
            </button>
          )}
        </header>
      )}
      {!collapsed && <div className={cn('flex-1 px-pad pb-pad', !title && !actions && 'pt-pad', bodyClassName)}>{children}</div>}
    </Tag>
  )
}
