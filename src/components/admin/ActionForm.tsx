'use client';

import { useActionState, type ReactNode } from 'react';
import type { AdminActionState } from '@/lib/actions/admin';
import { Button } from '@/components/ui/Button';
import { useAdminT } from './AdminI18n';

/** Generic admin form bound to a server action, with pending and result states. */
export function ActionForm({
  action,
  submitLabel,
  children,
  className = '',
  confirmMessage,
  variant = 'primary',
}: {
  action: (state: AdminActionState, formData: FormData) => Promise<AdminActionState>;
  submitLabel: string;
  children?: ReactNode;
  className?: string;
  confirmMessage?: string;
  variant?: 'primary' | 'secondary' | 'danger';
}) {
  const t = useAdminT();
  const [state, formAction, pending] = useActionState<AdminActionState, FormData>(action, {});
  return (
    <form
      action={formAction}
      className={className}
      onSubmit={(event) => {
        if (confirmMessage && !window.confirm(confirmMessage)) event.preventDefault();
      }}
    >
      {children}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="sm" variant={variant} disabled={pending}>
          {pending ? t.common.saving : submitLabel}
        </Button>
        <span role="status" className={`text-xs ${state.error ? 'text-danger' : 'text-success'}`}>
          {state.ok ? t.common.saved : state.error ? `${t.common.error}${state.error.startsWith('invalid') ? ` (${state.error})` : ''}` : ''}
        </span>
      </div>
    </form>
  );
}
