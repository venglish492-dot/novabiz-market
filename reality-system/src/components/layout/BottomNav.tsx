import { useState } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { NAV_ITEMS, navLabel } from '@/app/nav'
import { useRouter } from '@/app/router'
import { useApp } from '@/store/app'
import { useUi } from '@/store/ui'
import { cn } from '@/lib/cn'
import { Dialog } from '@/components/ui/Dialog'
import type { RouteId } from '@/domain/settings'

const PRIMARY: RouteId[] = ['overview', 'quests', 'focus', 'status']

/** Touch-friendly bottom navigation for phones, with a sheet for every other section. */
export function BottomNav() {
  const route = useRouter((s) => s.route)
  const navigate = useRouter((s) => s.navigate)
  const nav = useApp((s) => s.settings.navigation)
  const setPalette = useUi((s) => s.setPalette)
  const [more, setMore] = useState(false)
  const all = NAV_ITEMS.filter((n) => n.core || !nav.hidden.includes(n.id))
  const primary = all.filter((n) => PRIMARY.includes(n.id))
  return (
    <>
      <nav aria-label="Main navigation" className="fixed inset-x-0 bottom-0 z-30 border-t border-line/70 bg-bg/92 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
        <ul className="grid grid-cols-5">
          {primary.map((item) => {
            const active = route === item.id
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => navigate(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={cn('flex h-16 w-full flex-col items-center justify-center gap-1 text-[11px]', active ? 'text-accent' : 'text-muted')}
                >
                  <item.icon className="size-5" aria-hidden />
                  {item.short}
                </button>
              </li>
            )
          })}
          <li>
            <button type="button" onClick={() => setMore(true)} className="flex h-16 w-full flex-col items-center justify-center gap-1 text-[11px] text-muted" aria-haspopup="dialog">
              <MoreHorizontal className="size-5" aria-hidden />
              More
            </button>
          </li>
        </ul>
      </nav>
      <Dialog open={more} onClose={() => setMore(false)} title="All sections" size="sm">
        <ul className="grid grid-cols-2 gap-2">
          {all.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => {
                  setMore(false)
                  navigate(item.id)
                }}
                className={cn('flex w-full items-center gap-2 rounded-xl border px-3 py-3 text-left text-sm', route === item.id ? 'border-accent/50 bg-accent/10 text-fg' : 'border-line text-muted')}
              >
                <item.icon className="size-4 shrink-0" aria-hidden />
                <span className="truncate">{navLabel(item.id, nav.labels)}</span>
              </button>
            </li>
          ))}
          <li className="col-span-2">
            <button
              type="button"
              onClick={() => {
                setMore(false)
                setPalette(true)
              }}
              className="w-full rounded-xl border border-line px-3 py-3 text-sm text-muted"
            >
              Open command palette
            </button>
          </li>
        </ul>
      </Dialog>
    </>
  )
}
