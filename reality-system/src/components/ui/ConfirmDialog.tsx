import { useState, type ReactNode } from 'react'
import { Dialog } from './Dialog'
import { Button } from './Button'

interface ConfirmDialogProps {
  open: boolean
  title: string
  body: ReactNode
  confirmLabel?: string
  danger?: boolean
  /** require typing this word to enable the confirm button (for destructive actions) */
  typeToConfirm?: string
  onConfirm: () => void | Promise<void>
  onClose: () => void
}

export function ConfirmDialog({ open, title, body, confirmLabel = 'Confirm', danger, typeToConfirm, onConfirm, onClose }: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false)
  const [typed, setTyped] = useState('')
  const blocked = typeToConfirm ? typed.trim().toUpperCase() !== typeToConfirm.toUpperCase() : false
  const close = () => {
    setTyped('')
    onClose()
  }
  return (
    <Dialog
      open={open}
      onClose={close}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={close} data-autofocus>
            Cancel
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            loading={busy}
            disabled={blocked}
            onClick={async () => {
              setBusy(true)
              try {
                await onConfirm()
                setTyped('')
              } finally {
                setBusy(false)
              }
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-3 text-sm text-muted">{body}</div>
      {typeToConfirm && (
        <label className="mt-4 block text-sm">
          <span className="text-muted">
            Type <strong className="text-fg">{typeToConfirm}</strong> to confirm
          </span>
          <input className="input mt-1.5" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
        </label>
      )}
    </Dialog>
  )
}
