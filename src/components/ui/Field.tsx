import type { ComponentProps } from 'react';

export function Field({
  label,
  hint,
  error,
  id,
  className = '',
  ...props
}: ComponentProps<'input'> & { label: string; hint?: string; error?: string | null; id: string }) {
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') || undefined;
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-sm font-medium text-fg">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className="h-11 rounded-xl border border-line-strong bg-surface-2 px-3.5 text-[15px] text-fg outline-none transition-colors placeholder:text-fg-subtle focus:border-accent aria-[invalid=true]:border-danger read-only:text-fg-muted"
        {...props}
      />
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-fg-subtle">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
