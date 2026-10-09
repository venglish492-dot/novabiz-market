'use client';

import type { ReactNode } from 'react';

/** Submit button that asks for confirmation before a destructive server action. */
export function ConfirmSubmit({ message, children, className = '' }: { message: string; children: ReactNode; className?: string }) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
