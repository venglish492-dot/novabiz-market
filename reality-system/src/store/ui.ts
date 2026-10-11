/** Transient UI state: toasts, celebrations, dialogs. Nothing here is persisted. */
import { create } from 'zustand'
import type { NotificationKind } from '@/domain/schemas'
import type { RankDef } from '@/game/rules'
import type { QuestDraft } from '@/quests/service'
import { newId } from '@/lib/id'

export interface Toast {
  id: string
  kind: NotificationKind
  title: string
  body?: string
  /** ms; 0 = stays until dismissed */
  duration: number
  action?: { label: string; run: () => void }
}

export type Celebration =
  | { id: string; type: 'level'; from: number; to: number }
  | { id: string; type: 'rank'; from: RankDef; to: RankDef }
  | { id: string; type: 'goal'; name: string }

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never
export type CelebrationInput = DistributiveOmit<Celebration, 'id'>

export interface Burst {
  id: string
  x: number
  y: number
  color: string
}

interface UiState {
  toasts: Toast[]
  celebrations: Celebration[]
  bursts: Burst[]
  paletteOpen: boolean
  quickAddOpen: boolean
  editor: { questId: string | null; defaults?: Partial<QuestDraft> } | null
  details: { questId: string; occurrenceKey: string } | null
  pulseAttribute: { id: string; at: number } | null
  focusTarget: { questId: string; occurrenceKey: string } | null
  setFocusTarget: (t: { questId: string; occurrenceKey: string } | null) => void
  pushToast: (t: Omit<Toast, 'id' | 'duration'> & { duration?: number }) => string
  dismissToast: (id: string) => void
  celebrate: (c: CelebrationInput) => void
  shiftCelebration: () => void
  burst: (x: number, y: number, color: string) => void
  clearBurst: (id: string) => void
  setPalette: (open: boolean) => void
  setQuickAdd: (open: boolean) => void
  openEditor: (questId: string | null, defaults?: Partial<QuestDraft>) => void
  closeEditor: () => void
  openDetails: (questId: string, occurrenceKey: string) => void
  closeDetails: () => void
  pulse: (attributeId: string) => void
}

const DEFAULT_DURATION: Partial<Record<NotificationKind, number>> = { error: 8000, warning: 7000, achievement: 6500 }

export const useUi = create<UiState>((set) => ({
  toasts: [],
  celebrations: [],
  bursts: [],
  paletteOpen: false,
  quickAddOpen: false,
  editor: null,
  details: null,
  pulseAttribute: null,
  focusTarget: null,
  setFocusTarget: (focusTarget) => set({ focusTarget }),
  pushToast: (t) => {
    const id = newId('t')
    const toast: Toast = { duration: DEFAULT_DURATION[t.kind] ?? 4500, ...t, id }
    set((s) => ({ toasts: [...s.toasts.slice(-2), toast] }))
    return id
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  celebrate: (c) => set((s) => ({ celebrations: [...s.celebrations, { ...c, id: newId('c') } as Celebration] })),
  shiftCelebration: () => set((s) => ({ celebrations: s.celebrations.slice(1) })),
  burst: (x, y, color) => set((s) => ({ bursts: [...s.bursts.slice(-3), { id: newId('b'), x, y, color }] })),
  clearBurst: (id) => set((s) => ({ bursts: s.bursts.filter((b) => b.id !== id) })),
  setPalette: (paletteOpen) => set({ paletteOpen }),
  setQuickAdd: (quickAddOpen) => set({ quickAddOpen }),
  openEditor: (questId, defaults) => set({ editor: { questId, defaults }, details: null }),
  closeEditor: () => set({ editor: null }),
  openDetails: (questId, occurrenceKey) => set({ details: { questId, occurrenceKey } }),
  closeDetails: () => set({ details: null }),
  pulse: (id) => {
    const at = Date.now()
    set({ pulseAttribute: { id, at } })
    // the highlight is transient: clear it once the effect has played
    setTimeout(() => set((s) => (s.pulseAttribute?.at === at ? { pulseAttribute: null } : s)), 4000)
  },
}))
