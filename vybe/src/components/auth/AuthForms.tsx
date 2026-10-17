'use client';

import Link from 'next/link';
import { useActionState, useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { forgotPasswordAction, loginAction, resetPasswordAction, signupAction, type FormState } from '@/app/actions/auth';

function Field({ id, label, error, children, hint }: { id: string; label: string; error?: string; hint?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="field-error mt-1.5" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="hint mt-1.5">{hint}</p>
      ) : null}
    </div>
  );
}

function PasswordInput({ id, name, autoComplete, invalid }: { id: string; name: string; autoComplete: string; invalid?: boolean }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input id={id} name={name} type={visible ? 'text' : 'password'} required autoComplete={autoComplete} className="input pr-11" aria-invalid={invalid} aria-describedby={invalid ? `${id}-error` : undefined} />
      <button type="button" onClick={() => setVisible((v) => !v)} className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg p-2 text-muted hover:text-text" aria-label={visible ? 'Hide password' : 'Show password'}>
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

function FormError({ state }: { state: FormState }) {
  if (!state?.error) return null;
  return (
    <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-200" role="alert">
      {state.error}
    </p>
  );
}

function Submit({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <button type="submit" className="btn btn-primary w-full" disabled={pending} aria-busy={pending}>
      {pending && <span className="spinner" />}
      {children}
    </button>
  );
}

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(loginAction, undefined);
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="next" value={next} />
      <FormError state={state} />
      <Field id="email" label="Email" error={state?.fieldErrors?.email}>
        <input id="email" name="email" type="email" required autoComplete="email" defaultValue={state?.values?.email} className="input" aria-invalid={Boolean(state?.fieldErrors?.email)} />
      </Field>
      <Field id="password" label="Password" error={state?.fieldErrors?.password}>
        <PasswordInput id="password" name="password" autoComplete="current-password" invalid={Boolean(state?.fieldErrors?.password)} />
      </Field>
      <div className="flex justify-end">
        <Link href="/forgot-password" className="text-sm text-lavender hover:underline">
          Forgot password?
        </Link>
      </div>
      <Submit pending={pending}>Sign in</Submit>
    </form>
  );
}

export function SignupForm({ initialUsername }: { initialUsername: string }) {
  const [state, action, pending] = useActionState(signupAction, undefined);
  const [username, setUsername] = useState(initialUsername);
  const [result, setResult] = useState<{ name: string; ok: boolean; message: string } | null>(null);
  const check = result && result.name === username.trim() ? result : null;
  useEffect(() => {
    const name = username.trim();
    if (!name) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/username?name=${encodeURIComponent(name)}`, { signal: controller.signal });
        const data = (await response.json()) as { available: boolean; error?: string };
        setResult({ name, ok: data.available, message: data.available ? 'Available' : (data.error ?? 'Unavailable') });
      } catch {
        /* ignore aborted checks */
      }
    }, 300);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [username]);

  return (
    <form action={action} className="space-y-4" noValidate>
      <FormError state={state} />
      <Field id="username" label="Username" error={state?.fieldErrors?.username} hint={check ? <span className={check.ok ? 'text-emerald-300' : 'text-rose-300'}>{check.message}</span> : 'Your page will be at /@username. You can change it later.'}>
        <div className="relative">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm text-faint">@</span>
          <input id="username" name="username" value={username} onChange={(e) => setUsername(e.target.value.slice(0, 24))} autoComplete="username" autoCapitalize="off" spellCheck={false} className="input pl-8 font-mono" />
        </div>
      </Field>
      <Field id="email" label="Email" error={state?.fieldErrors?.email}>
        <input id="email" name="email" type="email" required autoComplete="email" defaultValue={state?.values?.email} className="input" aria-invalid={Boolean(state?.fieldErrors?.email)} />
      </Field>
      <Field id="password" label="Password" error={state?.fieldErrors?.password} hint="At least 10 characters.">
        <PasswordInput id="password" name="password" autoComplete="new-password" invalid={Boolean(state?.fieldErrors?.password)} />
      </Field>
      <div>
        <label className="flex items-start gap-2.5 text-sm text-muted">
          <input type="checkbox" name="terms" className="mt-0.5 size-4 accent-[var(--color-primary)]" required />
          <span>
            I agree to the{' '}
            <Link href="/terms" className="text-lavender hover:underline" target="_blank">
              terms
            </Link>{' '}
            and{' '}
            <Link href="/guidelines" className="text-lavender hover:underline" target="_blank">
              community guidelines
            </Link>
            .
          </span>
        </label>
        {state?.fieldErrors?.terms && (
          <p className="field-error mt-1.5" role="alert">
            {state.fieldErrors.terms}
          </p>
        )}
      </div>
      <Submit pending={pending}>Create account</Submit>
    </form>
  );
}

export function ForgotForm() {
  const [state, action, pending] = useActionState(forgotPasswordAction, undefined);
  if (state?.message) {
    return (
      <div className="space-y-3" role="status">
        <p className="text-sm text-emerald-200">{state.message}</p>
        {state.devLink && (
          <a href={state.devLink} className="block break-all rounded-xl border border-line bg-white/5 p-3 font-mono text-xs text-lavender hover:underline">
            {state.devLink}
          </a>
        )}
      </div>
    );
  }
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormError state={state} />
      <Field id="email" label="Email" error={state?.fieldErrors?.email}>
        <input id="email" name="email" type="email" required autoComplete="email" defaultValue={state?.values?.email} className="input" />
      </Field>
      <Submit pending={pending}>Send reset link</Submit>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPasswordAction, undefined);
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="token" value={token} />
      <FormError state={state} />
      <Field id="password" label="New password" error={state?.fieldErrors?.password} hint="At least 10 characters. Other devices will be signed out.">
        <PasswordInput id="password" name="password" autoComplete="new-password" invalid={Boolean(state?.fieldErrors?.password)} />
      </Field>
      <Submit pending={pending}>Set new password</Submit>
    </form>
  );
}
