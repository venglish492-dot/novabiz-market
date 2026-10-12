import { useEffect } from 'react'
import { useUi } from '@/store/ui'

export function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable
}

/**
 * Ctrl/Cmd+K toggles the command palette (works everywhere — it is not a
 * text-editing shortcut). Shift+N quick-adds a quest, but only when the
 * user is not typing in a field.
 */
export function useGlobalShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const ui = useUi.getState()
      if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        ui.setPalette(!ui.paletteOpen)
        return
      }
      if (isTypingTarget(e.target) || e.ctrlKey || e.metaKey || e.altKey) return
      if (e.shiftKey && e.key.toLowerCase() === 'n' && !ui.editor && !ui.quickAddOpen) {
        e.preventDefault()
        ui.setQuickAdd(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
