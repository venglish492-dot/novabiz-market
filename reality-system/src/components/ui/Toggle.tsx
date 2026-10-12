import { useId, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: ReactNode
  description?: ReactNode
  disabled?: boolean
  className?: string
}

export function Toggle({ checked, onChange, label, description, disabled, className }: ToggleProps) {
  const id = useId()
  return (
    <div className={cn('flex items-start justify-between gap-4 py-1.5', disabled && 'opacity-50', className)}>
      <div className="min-w-0">
        <label htmlFor={id} className="text-sm font-medium text-fg">
          {label}
        </label>
        {description && <p className="text-xs text-muted">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-200',
          checked ? 'border-accent bg-accent/80 shadow-[0_0_14px_-3px_var(--rs-accent)]' : 'border-line bg-surface2',
        )}
      >
        <span className={cn('inline-block size-4.5 rounded-full bg-white shadow transition-transform duration-200', checked ? 'translate-x-5.5' : 'translate-x-0.5')} />
      </button>
    </div>
  )
}
