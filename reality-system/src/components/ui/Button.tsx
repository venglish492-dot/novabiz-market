import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'subtle'
type Size = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: ReactNode
  iconRight?: ReactNode
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-accent text-on-accent font-semibold shadow-[0_0_24px_-6px_var(--rs-accent)] hover:brightness-110 hover:shadow-[0_0_30px_-4px_var(--rs-accent)] active:brightness-95',
  secondary: 'bg-surface2 text-fg border border-line hover:border-accent/60 hover:bg-accent/10',
  ghost: 'text-muted hover:text-fg hover:bg-accent/10',
  danger: 'bg-danger/15 text-danger border border-danger/40 hover:bg-danger/25',
  subtle: 'bg-accent/10 text-accent border border-accent/25 hover:bg-accent/20',
}

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-base gap-2.5 rounded-xl',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', loading, icon, iconRight, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap transition-[background-color,border-color,box-shadow,filter,transform] duration-150 active:scale-[0.97] disabled:opacity-45 disabled:active:scale-100',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : icon}
      {children}
      {iconRight}
    </button>
  )
})

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  variant?: Variant
  size?: Size
  shortcut?: string
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, variant = 'ghost', size = 'md', shortcut, className, children, type = 'button', ...rest },
  ref,
) {
  const dims = size === 'sm' ? 'size-8 rounded-lg' : size === 'lg' ? 'size-12 rounded-xl' : 'size-10 rounded-xl'
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={shortcut ? `${label} (${shortcut})` : label}
      className={cn('inline-flex shrink-0 items-center justify-center transition-colors duration-150 active:scale-95 disabled:opacity-40', VARIANTS[variant], dims, className)}
      {...rest}
    >
      {children}
    </button>
  )
})
