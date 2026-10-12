import { useLiveQuery } from 'dexie-react-hooks'
import { Bell, CheckCheck, Trash2 } from 'lucide-react'
import { KIND_ICON } from './kindIcons'
import { getDb } from '@/db/database'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/Misc'
import { formatDateTime } from '@/lib/dates'
import { useApp } from '@/store/app'
import { cn } from '@/lib/cn'


/** In-app notification center for local events (no push notifications needed). */
export function NotificationCenter({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dateFormat = useApp((s) => s.settings.appearance.dateFormat)
  const items = useLiveQuery(() => getDb().notifications.orderBy('createdAt').reverse().limit(100).toArray(), [])
  const markAll = () => getDb().notifications.toCollection().modify({ read: true })
  const clear = () => getDb().notifications.clear()
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="System notifications"
      description="Local events recorded by your system. Nothing is sent anywhere."
      footer={
        <>
          <Button variant="ghost" icon={<Trash2 className="size-4" />} onClick={() => void clear()} disabled={!items?.length}>
            Clear all
          </Button>
          <Button variant="subtle" icon={<CheckCheck className="size-4" />} onClick={() => void markAll()} disabled={!items?.some((n) => !n.read)}>
            Mark all read
          </Button>
        </>
      }
    >
      {!items?.length ? (
        <EmptyState icon={<Bell className="size-6" />} title="No notifications yet" body="Level-ups, achievements and completed goals will appear here." />
      ) : (
        <ul className="space-y-2">
          {items.map((n) => {
            const I = KIND_ICON[n.kind]
            return (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => void getDb().notifications.update(n.id, { read: true })}
                  className={cn('flex w-full gap-3 rounded-xl border p-3 text-left', n.read ? 'border-line/50 opacity-70' : 'border-accent/30 bg-accent/5')}
                >
                  <I className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-fg">{n.title}</span>
                    {n.body && <span className="block text-xs text-muted">{n.body}</span>}
                    <span className="num mt-1 block text-[11px] text-muted">{formatDateTime(n.createdAt, dateFormat)}</span>
                  </span>
                  {!n.read && <span className="mt-1 size-2 shrink-0 rounded-full bg-accent" aria-label="Unread" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </Dialog>
  )
}
