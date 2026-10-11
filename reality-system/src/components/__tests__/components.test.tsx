import { beforeEach, describe, expect, it } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { freshDb } from '@/test/db'
import type { RealityDB } from '@/db/database'
import { Dialog } from '@/components/ui/Dialog'
import { Toggle } from '@/components/ui/Toggle'
import { QuestCard } from '@/components/game/QuestCard'
import { ToastHost } from '@/components/layout/ToastHost'
import { createQuest, emptyDraft } from '@/quests/service'
import { useApp } from '@/store/app'
import { applyAppearance } from '@/theme/apply'
import { defaultSettings } from '@/domain/settings'
import { THEMES } from '@/theme/themes'
import { CoreViewport } from '@/three/CoreViewport'

let db: RealityDB
beforeEach(async () => {
  db = await freshDb({ onboarded: true })
  useApp.setState({ settings: defaultSettings(), status: 'ready' })
})

function DialogHarness() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)}>Open it</button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Test dialog">
        <input aria-label="Inside field" />
      </Dialog>
    </>
  )
}

describe('Dialog', () => {
  it('opens, traps focus inside and closes with Escape', async () => {
    const user = userEvent.setup()
    render(<DialogHarness />)
    await user.click(screen.getByText('Open it'))
    const dialog = await screen.findByRole('dialog', { name: 'Test dialog' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    await waitFor(() => expect(screen.getByLabelText('Inside field')).toHaveFocus())
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })
})

describe('Toggle', () => {
  it('is an accessible switch', async () => {
    const user = userEvent.setup()
    function T() {
      const [on, setOn] = useState(false)
      return <Toggle checked={on} onChange={setOn} label="Enable 3D" />
    }
    render(<T />)
    const sw = screen.getByRole('switch', { name: 'Enable 3D' })
    expect(sw).toHaveAttribute('aria-checked', 'false')
    await user.click(sw)
    expect(sw).toHaveAttribute('aria-checked', 'true')
  })
})

describe('QuestCard', () => {
  it('completes a quest once, persists it and shows feedback', async () => {
    const user = userEvent.setup()
    const quest = await createQuest(emptyDraft({ title: 'Practice scales', difficulty: 'normal' }))
    render(
      <>
        <QuestCard quest={quest} occurrenceKey="once" completion={null} today="2026-10-11" />
        <ToastHost />
      </>,
    )
    const button = screen.getByRole('button', { name: 'Complete Practice scales' })
    await user.dblClick(button)
    await screen.findByText(/Quest complete · \+20 XP/)
    expect(await db.completions.count()).toBe(1)
    expect(await db.ledger.where('source').equals('quest').count()).toBe(1)
  })
})

describe('themes', () => {
  it('apply full token sets to the document', () => {
    for (const theme of THEMES) {
      act(() => applyAppearance({ ...defaultSettings().appearance, themeId: theme.id }, false))
      const root = document.documentElement
      expect(root.style.getPropertyValue('--rs-accent')).toBe(theme.tokens.accent)
      expect(root.style.getPropertyValue('--rs-bg')).toBe(theme.tokens.bg)
      expect(root.dataset.theme).toBe(theme.id)
    }
  })

  it('reduced motion forces the minimal motion profile', () => {
    applyAppearance({ ...defaultSettings().appearance, motion: 'maximum' }, true)
    expect(document.documentElement.dataset.motion).toBe('minimal')
    expect(document.documentElement.dataset.reducedMotion).toBe('true')
  })
})

describe('3D can be disabled', () => {
  it('renders a 2D emblem instead of a WebGL canvas', () => {
    const s = defaultSettings()
    useApp.setState({ settings: { ...s, appearance: { ...s.appearance, enable3D: false } } })
    const { container } = render(<CoreViewport label="Core" />)
    expect(container.querySelector('canvas')).toBeNull()
    expect(screen.getByRole('button', { name: 'Core' })).toBeInTheDocument()
  })

  it('falls back to 2D when WebGL is unavailable (jsdom has no WebGL)', () => {
    const { container } = render(<CoreViewport label="Core" />)
    expect(container.querySelector('canvas')).toBeNull()
  })
})
