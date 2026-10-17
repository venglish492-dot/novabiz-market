'use client';

import { useActionState } from 'react';
import { changePasswordAction, deleteAccountAction, logoutAction } from '@/app/actions/auth';
import { useEditor } from '../EditorProvider';
import { Section } from '../controls';

export function SettingsSection() {
  const { init } = useEditor();
  const [pwState, pwAction, pwPending] = useActionState(changePasswordAction, undefined);
  const [delState, delAction, delPending] = useActionState(deleteAccountAction, undefined);
  return (
    <div className="space-y-6">
      <Section title="Account">
        <p className="text-sm">
          Signed in as <span className="font-semibold">{init.email}</span>
        </p>
        <form action={logoutAction}>
          <button type="submit" className="btn btn-secondary btn-sm">
            Sign out
          </button>
        </form>
      </Section>
      <Section title="Change password" description="Other devices are signed out when you change it.">
        <form action={pwAction} className="space-y-4">
          <div>
            <label htmlFor="currentPassword" className="label">
              Current password
            </label>
            <input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required className="input" aria-invalid={Boolean(pwState?.fieldErrors?.currentPassword)} />
            {pwState?.fieldErrors?.currentPassword && <p className="field-error mt-1">{pwState.fieldErrors.currentPassword}</p>}
          </div>
          <div>
            <label htmlFor="newPassword" className="label">
              New password
            </label>
            <input id="newPassword" name="newPassword" type="password" autoComplete="new-password" required minLength={10} className="input" aria-invalid={Boolean(pwState?.fieldErrors?.newPassword)} />
            {pwState?.fieldErrors?.newPassword && <p className="field-error mt-1">{pwState.fieldErrors.newPassword}</p>}
          </div>
          {pwState?.error && <p className="field-error">{pwState.error}</p>}
          {pwState?.message && (
            <p className="text-sm text-emerald-300" role="status">
              {pwState.message}
            </p>
          )}
          <button type="submit" className="btn btn-secondary" disabled={pwPending}>
            {pwPending && <span className="spinner" />} Update password
          </button>
        </form>
      </Section>
      <section className="rounded-[var(--radius-card)] border border-rose-400/30 bg-rose-500/[0.04] p-6" aria-labelledby="danger">
        <h2 id="danger" className="font-display font-semibold text-rose-200">
          Delete account
        </h2>
        <p className="mt-1 text-sm text-muted">Permanently deletes your page, uploads, analytics and account. This can’t be undone.</p>
        <form action={delAction} className="mt-5 space-y-4">
          <div>
            <label htmlFor="del-password" className="label">
              Password
            </label>
            <input id="del-password" name="password" type="password" autoComplete="current-password" required className="input" />
            {delState?.fieldErrors?.password && <p className="field-error mt-1">{delState.fieldErrors.password}</p>}
          </div>
          <div>
            <label htmlFor="confirm" className="label">
              Type DELETE to confirm
            </label>
            <input id="confirm" name="confirm" required className="input font-mono" autoComplete="off" />
            {delState?.fieldErrors?.confirm && <p className="field-error mt-1">{delState.fieldErrors.confirm}</p>}
          </div>
          {delState?.error && <p className="field-error">{delState.error}</p>}
          <button type="submit" className="btn btn-danger" disabled={delPending}>
            {delPending && <span className="spinner" />} Delete my account
          </button>
        </form>
      </section>
    </div>
  );
}
