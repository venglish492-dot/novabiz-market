import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { useMotion } from '@/hooks/useMotion'
import { modalVariants } from '@/motion/tokens'
import { cn } from '@/lib/cn'

interface DialogProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** prevents closing by clicking the backdrop (e.g. forms with unsaved input) */
  dismissable?: boolean
  initialFocus?: string
}

const SIZES = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' }
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

/** Accessible modal dialog: focus trap, Escape to close, focus restored on close. */
export function Dialog({ open, onClose, title, description, children, footer, size = 'md', dismissable = true, initialFocus }: DialogProps) {
  const motionProfile = useMotion()
  const v = modalVariants(motionProfile)
  const panelRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const descId = useId()
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    const frame = requestAnimationFrame(() => {
      const panel = panelRef.current
      if (!panel) return
      const target =
        (initialFocus && panel.querySelector<HTMLElement>(initialFocus)) ||
        panel.querySelector<HTMLElement>('[data-autofocus]') ||
        bodyRef.current?.querySelector<HTMLElement>(FOCUSABLE) ||
        panel.querySelector<HTMLElement>(FOCUSABLE)
      target?.focus()
    })
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onCloseRef.current()
      }
      if (e.key === 'Tab' && panelRef.current) {
        const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null || el === document.activeElement)
        if (items.length === 0) return
        const first = items[0]
        const last = items[items.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      previouslyFocused?.focus?.()
    }
  }, [open, initialFocus])

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 pt-[env(safe-area-inset-top)] sm:items-center sm:p-6">
          <motion.div
            className="absolute inset-0 bg-black/65"
            variants={v.backdrop}
            initial="initial"
            animate="enter"
            exit="exit"
            onClick={dismissable ? onClose : undefined}
            aria-hidden
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descId : undefined}
            variants={v.panel}
            initial="initial"
            animate="enter"
            exit="exit"
            className={cn('panel panel-glow relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-b-none sm:rounded-b-[var(--rs-radius)]', SIZES[size])}
          >
            <header className="flex items-start gap-3 border-b border-line/70 px-pad py-4">
              <div className="min-w-0 flex-1">
                <h2 id={titleId} className="font-display text-base font-semibold tracking-wide text-fg">
                  {title}
                </h2>
                {description && (
                  <p id={descId} className="mt-1 text-sm text-muted">
                    {description}
                  </p>
                )}
              </div>
              <button type="button" onClick={onClose} aria-label="Close dialog" className="-mr-1 rounded-lg p-1.5 text-muted hover:bg-accent/10 hover:text-fg">
                <X className="size-5" aria-hidden />
              </button>
            </header>
            <div ref={bodyRef} className="flex-1 overflow-y-auto px-pad py-4">
              {children}
            </div>
            {footer && <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-line/70 px-pad py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-3">{footer}</footer>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
