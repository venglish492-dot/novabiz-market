import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm';

const base =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium select-none transition-[background-color,border-color,color,transform,box-shadow] duration-200 ease-[var(--ease-standard)] disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-fg hover:bg-primary-hover shadow-sm',
  secondary: 'bg-surface-2 text-fg border border-line-strong hover:bg-surface-3',
  outline: 'border border-line-strong text-fg hover:bg-surface-2',
  ghost: 'text-fg-muted hover:text-fg hover:bg-surface-2',
  danger: 'bg-danger-soft text-danger border border-danger/30 hover:bg-danger/15',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-[13px] rounded-full',
  md: 'h-11 px-5 text-[14px] rounded-full',
  lg: 'h-12 px-6 text-[15px] rounded-full',
  icon: 'h-10 w-10 rounded-full',
  'icon-sm': 'h-8 w-8 rounded-full',
};

export function buttonClasses({
  variant = 'primary',
  size = 'md',
  className = '',
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return `${base} ${variants[variant]} ${sizes[size]} ${className}`.trim();
}

type ButtonProps = ComponentProps<'button'> & { variant?: ButtonVariant; size?: ButtonSize };

export function Button({ variant, size, className, type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={buttonClasses({ variant, size, className })} {...props} />;
}

type ButtonLinkProps = Omit<ComponentProps<typeof Link>, 'className'> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
};

export function ButtonLink({ variant, size, className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClasses({ variant, size, className })} {...props} />;
}
