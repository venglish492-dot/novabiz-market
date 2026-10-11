import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { CornerDownLeft, Search, Palette, Plus, Hourglass, Box, Volume2, ListTodo } from 'lucide-react'
import { useUi } from '@/store/ui'
import { useApp } from '@/store/app'
import { NAV_ITEMS, navLabel } from '@/app/nav'
import { navigate } from '@/app/router'
import { THEMES } from '@/theme/themes'
import { useQuests } from '@/hooks/useData'
import { useMotion } from '@/hooks/useMotion'
import { Kbd } from '@/components/ui/Misc'
import { cn } from '@/lib/cn'
import { useToday } from '@/hooks/useToday'
import { occurrenceKeyFor, ONCE } from '@/quests/recurrence'
import type { ThemeId } from '@/domain/settings'

interface Command {
  id: string
  label: string
  group: string
  hint?: string
  icon: React.ComponentType<{ className?: string }>
  run: () => void
}

/** Ctrl+K command palette: navigation, actions, themes and quest search. */
export function CommandPalette() {
  const open = useUi((s) => s.paletteOpen)
  const setOpen = useUi((s) => s.setPalette)
  const setQuickAdd = useUi((s) => s.setQuickAdd)
  const openEditor = useUi((s) => s.openEditor)
  const openDetails = useUi((s) => s.openDetails)
  const labels = useApp((s) => s.settings.navigation.labels)
  const updateSettings = useApp((s) => s.updateSettings)
  const settings = useApp((s) => s.settings)
  const quests = useQuests()
  const today = useToday()
  const m = useMotion()
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const close = () => {
    setOpen(false)
    setQuery('')
    setIndex(0)
  }

  const commands = useMemo<Command[]>(() => {
    const setTheme = (themeId: ThemeId) => void updateSettings((s) => ({ ...s, appearance: { ...s.appearance, themeId } }))
    const list: Command[] = [
      { id: 'new-quest', label: 'Create a quest', group: 'Actions', hint: 'Full quest editor', icon: Plus, run: () => openEditor(null) },
      { id: 'quick-add', label: 'Quick add quest', group: 'Actions', hint: 'Shift+N', icon: Plus, run: () => setQuickAdd(true) },
      { id: 'today', label: "Open today's quests", group: 'Actions', icon: ListTodo, run: () => navigate('quests') },
      { id: 'focus', label: 'Open focus timer', group: 'Actions', icon: Hourglass, run: () => navigate('focus') },
      {
        id: 'toggle-3d',
        label: settings.appearance.enable3D ? 'Disable 3D scenes' : 'Enable 3D scenes',
        group: 'Actions',
        icon: Box,
        run: () => void updateSettings((s) => ({ ...s, appearance: { ...s.appearance, enable3D: !s.appearance.enable3D } })),
      },
      {
        id: 'toggle-sound',
        label: settings.sound.enabled ? 'Turn sound effects off' : 'Turn sound effects on',
        group: 'Actions',
        icon: Volume2,
        run: () => void updateSettings((s) => ({ ...s, sound: { ...s.sound, enabled: !s.sound.enabled } })),
      },
      ...NAV_ITEMS.map((n) => ({ id: `nav-${n.id}`, label: navLabel(n.id, labels), group: 'Go to', hint: n.description, icon: n.icon, run: () => navigate(n.id) })),
      ...THEMES.map((t) => ({ id: `theme-${t.id}`, label: `Theme: ${t.name}`, group: 'Change theme', icon: Palette, run: () => setTheme(t.id) })),
    ]
    return list
  }, [labels, openEditor, setQuickAdd, settings.appearance.enable3D, settings.sound.enabled, updateSettings])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matched = q ? commands.filter((c) => c.label.toLowerCase().includes(q) || c.group.toLowerCase().includes(q)) : commands.slice(0, 12)
    const questHits: Command[] = q
      ? (quests ?? [])
          .filter((x) => x.status !== 'archived' && (x.title.toLowerCase().includes(q) || x.tags.some((t) => t.toLowerCase().includes(q))))
          .slice(0, 8)
          .map((x) => ({
            id: `quest-${x.id}`,
            label: x.title,
            group: 'Quests',
            hint: x.status === 'completed' ? 'Completed' : undefined,
            icon: ListTodo,
            run: () => openDetails(x.id, occurrenceKeyFor(x, today, settings.general.weekStart) ?? ONCE),
          }))
      : []
    return [...questHits, ...matched]
  }, [query, commands, quests, openDetails, today, settings.general.weekStart])

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus())
  }, [open])

  const run = (c: Command | undefined) => {
    if (!c) return
    close()
    c.run()
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setIndex((i) => Math.min(results.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setIndex((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      run(results[index])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      close()
    }
  }

  let lastGroup = ''
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[55] flex items-start justify-center p-3 pt-[10vh]">
          <motion.div className="absolute inset-0 bg-black/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} aria-hidden />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            className="panel panel-glow relative w-full max-w-xl overflow-hidden"
            initial={{ opacity: 0, y: -12 * m.distance, scale: m.distance ? 0.98 : 1 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 * m.distance }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-3 border-b border-line/70 px-4">
              <Search className="size-4 text-muted" aria-hidden />
              <input
                ref={inputRef}
                role="combobox"
                aria-expanded="true"
                aria-controls="palette-list"
                aria-activedescendant={results[index] ? `cmd-${results[index].id}` : undefined}
                aria-label="Search commands and quests"
                placeholder="Search quests, sections, actions, themes…"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setIndex(0)
                }}
                onKeyDown={onKey}
                className="h-14 flex-1 bg-transparent text-base outline-none placeholder:text-muted/70"
              />
              <Kbd>Esc</Kbd>
            </div>
            <ul id="palette-list" role="listbox" className="max-h-[55vh] overflow-y-auto p-2">
              {results.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted">No matches.</li>}
              {results.map((c, i) => {
                const header = c.group !== lastGroup ? c.group : null
                lastGroup = c.group
                return (
                  <li key={c.id} role="presentation">
                    {header && <p className="label-caps px-3 pt-3 pb-1 text-muted">{header}</p>}
                    <div
                      id={`cmd-${c.id}`}
                      role="option"
                      aria-selected={i === index}
                      onMouseMove={() => setIndex(i)}
                      onClick={() => run(c)}
                      className={cn('flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm', i === index ? 'bg-accent/12 text-fg' : 'text-muted')}
                    >
                      <c.icon className="size-4 shrink-0" />
                      <span className="flex-1 truncate">{c.label}</span>
                      {c.hint && <span className="hidden truncate text-xs text-muted/80 sm:block">{c.hint}</span>}
                      {i === index && <CornerDownLeft className="size-3.5" aria-hidden />}
                    </div>
                  </li>
                )
              })}
            </ul>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
