import { motion } from 'motion/react'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { NAV_ITEMS, navLabel } from '@/app/nav'
import { useRouter } from '@/app/router'
import { useApp } from '@/store/app'
import { cn } from '@/lib/cn'
import { Logo } from './Logo'

export function Sidebar() {
  const route = useRouter((s) => s.route)
  const navigate = useRouter((s) => s.navigate)
  const nav = useApp((s) => s.settings.navigation)
  const compact = useApp((s) => s.settings.appearance.navCompact)
  const side = useApp((s) => s.settings.appearance.sidebar)
  const updateSettings = useApp((s) => s.updateSettings)
  const items = NAV_ITEMS.filter((n) => n.core || !nav.hidden.includes(n.id))

  return (
    <nav
      aria-label="Main navigation"
      className={cn(
        'sticky top-0 hidden h-dvh shrink-0 flex-col border-line/60 bg-bg/70 py-4 md:flex',
        side === 'left' ? 'border-r' : 'order-last border-l',
        compact ? 'w-[76px] items-center px-2' : 'w-[248px] px-3',
      )}
    >
      <div className={cn('mb-6 flex items-center gap-2.5', compact ? 'justify-center' : 'px-2')}>
        <Logo size={34} />
        {!compact && (
          <div className="leading-tight">
            <p className="font-display text-sm font-bold tracking-[0.2em] text-fg">REALITY</p>
            <p className="font-display text-[10px] tracking-[0.42em] text-accent">SYSTEM</p>
          </div>
        )}
      </div>
      <ul className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
        {items.map((item) => {
          const active = item.id === route
          const label = navLabel(item.id, nav.labels)
          return (
            <li key={item.id}>
              <a
                href={`#/${item.id}`}
                onClick={(e) => {
                  e.preventDefault()
                  navigate(item.id)
                }}
                aria-current={active ? 'page' : undefined}
                title={compact ? label : undefined}
                className={cn(
                  'relative flex items-center gap-3 rounded-xl py-2.5 text-sm transition-colors',
                  compact ? 'justify-center px-0' : 'px-3',
                  active ? 'text-fg' : 'text-muted hover:bg-accent/5 hover:text-fg',
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-xl border border-accent/35 bg-gradient-to-r from-accent/15 to-transparent"
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  />
                )}
                {active && <span className={cn('absolute top-2 bottom-2 w-[3px] rounded-full bg-accent shadow-[0_0_10px_var(--rs-accent)]', side === 'left' ? 'left-0' : 'right-0')} />}
                <item.icon className={cn('relative size-[18px] shrink-0', active && 'text-accent')} aria-hidden />
                {!compact && <span className="relative truncate font-medium tracking-wide">{label}</span>}
              </a>
            </li>
          )
        })}
      </ul>
      <button
        type="button"
        onClick={() => void updateSettings((s) => ({ ...s, appearance: { ...s.appearance, navCompact: !compact } }))}
        className={cn('mt-3 flex items-center gap-2 rounded-xl py-2 text-xs text-muted hover:bg-accent/5 hover:text-fg', compact ? 'justify-center px-0' : 'px-3')}
        aria-label={compact ? 'Expand navigation' : 'Collapse navigation'}
        title={compact ? 'Expand navigation' : 'Collapse navigation'}
      >
        {compact ? <PanelLeftOpen className="size-4" aria-hidden /> : <PanelLeftClose className="size-4" aria-hidden />}
        {!compact && 'Compact navigation'}
      </button>
    </nav>
  )
}
