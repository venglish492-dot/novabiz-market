'use client';

import { useActionState } from 'react';
import { useI18n } from '@/i18n/client';
import { LOCALES, LOCALE_LABEL } from '@/i18n/config';
import {
  changePasswordAction,
  updateProfileAction,
  updateSettingsAction,
  type AccountFormState,
} from '@/lib/actions/account';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Notice } from '@/components/ui/Notice';

function useMessage(state: AccountFormState, success: string): { tone: 'success' | 'danger'; text: string } | null {
  const { t } = useI18n();
  if (state.ok) return { tone: 'success', text: success };
  if (!state.error) return null;
  const map: Record<NonNullable<AccountFormState['error']>, string> = {
    invalid: t.auth.errors.nameRequired,
    generic: t.auth.errors.generic,
    rateLimited: t.auth.errors.rateLimited,
    passwordMismatch: t.auth.errors.passwordMismatch,
    weakPassword: t.auth.errors.weakPassword,
    unauthorized: t.auth.errors.sessionExpired,
  };
  return { tone: 'danger', text: map[state.error] };
}

export function ProfileForm({ name, email }: { name: string; email: string }) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState<AccountFormState, FormData>(updateProfileAction, {});
  const message = useMessage(state, t.account.profileSaved);
  return (
    <form action={action} className="flex max-w-md flex-col gap-4">
      <Field id="profile-name" name="name" defaultValue={name} required maxLength={120} autoComplete="name" label={t.account.nameLabel} />
      <Field id="profile-email" value={email} readOnly label={t.account.emailLabel} hint={t.account.emailReadonly} />
      {message && (
        <Notice tone={message.tone} role={message.tone === 'danger' ? 'alert' : 'status'}>
          {message.text}
        </Notice>
      )}
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? t.common.saving : t.common.save}
        </Button>
      </div>
    </form>
  );
}

export function PasswordForm() {
  const { t } = useI18n();
  const [state, action, pending] = useActionState<AccountFormState, FormData>(changePasswordAction, {});
  const message = useMessage(state, t.account.passwordChanged);
  return (
    <form action={action} className="flex max-w-md flex-col gap-4">
      <Field id="security-password" name="password" type="password" required minLength={8} autoComplete="new-password" label={t.auth.newPassword} hint={t.auth.passwordHint} />
      <Field id="security-confirm" name="confirm" type="password" required autoComplete="new-password" label={t.auth.confirmPassword} />
      {message && (
        <Notice tone={message.tone} role={message.tone === 'danger' ? 'alert' : 'status'}>
          {message.text}
        </Notice>
      )}
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? t.common.saving : t.auth.updatePassword}
        </Button>
      </div>
    </form>
  );
}

export function SettingsForm({ locale, marketing }: { locale: string; marketing: boolean }) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState<AccountFormState, FormData>(updateSettingsAction, {});
  const message = useMessage(state, t.account.settingsSaved);
  return (
    <form action={action} className="flex max-w-md flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="settings-locale" className="text-sm font-medium text-fg">
          {t.account.languageLabel}
        </label>
        <select
          id="settings-locale"
          name="locale"
          defaultValue={locale === 'en' ? 'en' : 'ru'}
          className="h-11 rounded-xl border border-line-strong bg-surface-2 px-3 text-sm text-fg outline-none focus:border-accent"
        >
          {LOCALES.map((value) => (
            <option key={value} value={value}>
              {LOCALE_LABEL[value]}
            </option>
          ))}
        </select>
      </div>
      <label className="flex items-start gap-3 text-sm text-fg-muted">
        <input type="checkbox" name="marketing" defaultChecked={marketing} className="mt-0.5 h-4 w-4 accent-[var(--accent)]" />
        {t.account.marketingLabel}
      </label>
      {message && (
        <Notice tone={message.tone} role={message.tone === 'danger' ? 'alert' : 'status'}>
          {message.text}
        </Notice>
      )}
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? t.common.saving : t.common.save}
        </Button>
      </div>
    </form>
  );
}
