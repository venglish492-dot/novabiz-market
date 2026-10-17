'use client';

import { useActionState } from 'react';
import { claimUsernameAction } from '@/app/actions/profile';
import { Logo } from '@/components/ui/Logo';

export function ClaimScreen({ suggestion, error }: { suggestion: string; error?: string }) {
  const [state, action, pending] = useActionState(claimUsernameAction, error ? { error } : undefined);
  return (
    <main id="main" className="relative flex min-h-dvh flex-col items-center justify-center px-4">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_35%,rgb(182_92_255/0.2),transparent_60%)]" aria-hidden />
      <Logo />
      <div className="glass mt-8 w-full max-w-md rounded-3xl p-6 sm:p-8">
        <h1 className="text-2xl font-bold">Claim your username</h1>
        <p className="mt-1.5 text-sm text-muted">This becomes your link: vybe/@username. You can change it later.</p>
        <form action={action} className="mt-6 space-y-4">
          <div>
            <label htmlFor="username" className="label">
              Username
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm text-faint">@</span>
              <input id="username" name="username" defaultValue={suggestion} required maxLength={24} autoCapitalize="off" spellCheck={false} className="input pl-8 font-mono" aria-invalid={Boolean(state?.error)} />
            </div>
            {state?.error && (
              <p className="field-error mt-1.5" role="alert">
                {state.error}
              </p>
            )}
          </div>
          <button type="submit" className="btn btn-primary w-full" disabled={pending}>
            {pending && <span className="spinner" />} Claim and start building
          </button>
        </form>
      </div>
    </main>
  );
}
