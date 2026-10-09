'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { MailCheck } from 'lucide-react';
import { useI18n } from '@/i18n/client';
import { interpolate } from '@/i18n/config';
import {
  forgotPasswordAction,
  googleSignInAction,
  loginAction,
  registerAction,
  resetPasswordAction,
  type AuthFormState,
} from '@/lib/actions/auth';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Notice } from '@/components/ui/Notice';

function useErrorText(state: AuthFormState): string | null {
  const { t } = useI18n();
  if (!state.error) return null;
  if (state.error === 'notConfigured') return t.config.accountsUnavailableBody;
  return t.auth.errors[state.error];
}

const googleEnabled = process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED === 'true';

function GoogleButton({ next }: { next: string }) {
  const { t } = useI18n();
  if (!googleEnabled) return null;
  return (
    <>
      <form action={googleSignInAction}>
        <input type="hidden" name="next" value={next} />
        <Button type="submit" variant="secondary" size="lg" className="w-full">
          {t.auth.continueWithGoogle}
        </Button>
      </form>
      <p className="flex items-center gap-3 text-xs uppercase tracking-wider text-fg-subtle">
        <span className="h-px flex-1 bg-line" />
        {t.auth.or}
        <span className="h-px flex-1 bg-line" />
      </p>
    </>
  );
}

export function LoginForm({ next }: { next: string }) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState<AuthFormState, FormData>(loginAction, {});
  const error = useErrorText(state);
  return (
    <div className="flex flex-col gap-5">
      <GoogleButton next={next} />
      <form action={action} className="flex flex-col gap-4" noValidate>
        <input type="hidden" name="next" value={next} />
        <Field id="login-email" name="email" type="email" autoComplete="email" required label={t.auth.email} />
        <div className="flex flex-col gap-1.5">
          <Field id="login-password" name="password" type="password" autoComplete="current-password" required label={t.auth.password} />
          <Link href="/forgot-password" className="self-end text-xs text-fg-subtle hover:text-fg">
            {t.auth.forgotLink}
          </Link>
        </div>
        {error && (
          <Notice tone="danger" role="alert">
            {error}
          </Notice>
        )}
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? t.auth.signingIn : t.auth.signIn}
        </Button>
      </form>
      <p className="text-center text-sm text-fg-muted">
        {t.auth.noAccount}{' '}
        <Link href={`/register?next=${encodeURIComponent(next)}`} className="font-medium text-fg hover:underline">
          {t.auth.signUp}
        </Link>
      </p>
    </div>
  );
}

export function RegisterForm({ next }: { next: string }) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState<AuthFormState, FormData>(registerAction, {});
  const error = useErrorText(state);

  if (state.sentTo) {
    return (
      <Notice tone="success" title={t.auth.checkEmailTitle} role="status">
        {interpolate(t.auth.checkEmailBody, { email: state.sentTo })}
      </Notice>
    );
  }

  const [termsBefore, rest = ''] = t.auth.termsNote.split('{terms}');
  const [termsMiddle, termsAfter = ''] = rest.split('{privacy}');

  return (
    <div className="flex flex-col gap-5">
      <GoogleButton next={next} />
      <form action={action} className="flex flex-col gap-4" noValidate>
        <input type="hidden" name="next" value={next} />
        <Field id="register-name" name="name" autoComplete="name" required maxLength={120} label={t.auth.name} />
        <Field id="register-email" name="email" type="email" autoComplete="email" required label={t.auth.email} />
        <Field
          id="register-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          label={t.auth.password}
          hint={t.auth.passwordHint}
        />
        {error && (
          <Notice tone="danger" role="alert">
            {error}
          </Notice>
        )}
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? t.auth.signingUp : t.auth.signUp}
        </Button>
        <p className="text-xs leading-relaxed text-fg-subtle">
          {termsBefore}
          <Link href="/terms" className="underline underline-offset-4 hover:text-fg">
            {t.auth.termsLink}
          </Link>
          {termsMiddle}
          <Link href="/privacy" className="underline underline-offset-4 hover:text-fg">
            {t.auth.privacyLink}
          </Link>
          {termsAfter}
        </p>
      </form>
      <p className="text-center text-sm text-fg-muted">
        {t.auth.haveAccount}{' '}
        <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-medium text-fg hover:underline">
          {t.auth.signIn}
        </Link>
      </p>
    </div>
  );
}

export function ForgotPasswordForm() {
  const { t } = useI18n();
  const [state, action, pending] = useActionState<AuthFormState, FormData>(forgotPasswordAction, {});
  const error = useErrorText(state);

  if (state.sentTo) {
    return (
      <div className="flex flex-col gap-5">
        <Notice tone="success" title={t.auth.resetSentTitle} role="status">
          <span className="flex gap-2">
            <MailCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {interpolate(t.auth.resetSentBody, { email: state.sentTo })}
          </span>
        </Notice>
        <Link href="/login" className="text-center text-sm text-fg-muted hover:text-fg">
          {t.auth.backToLogin}
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <Field id="forgot-email" name="email" type="email" autoComplete="email" required label={t.auth.email} />
      {error && (
        <Notice tone="danger" role="alert">
          {error}
        </Notice>
      )}
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? t.auth.sending : t.auth.sendLink}
      </Button>
      <Link href="/login" className="text-center text-sm text-fg-muted hover:text-fg">
        {t.auth.backToLogin}
      </Link>
    </form>
  );
}

export function ResetPasswordForm() {
  const { t } = useI18n();
  const [state, action, pending] = useActionState<AuthFormState, FormData>(resetPasswordAction, {});
  const error = useErrorText(state);

  if (state.done) {
    return (
      <div className="flex flex-col gap-5">
        <Notice tone="success" role="status">
          {t.auth.passwordUpdated}
        </Notice>
        <Link href="/library" className="text-center text-sm text-fg hover:underline">
          {t.nav.library}
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <Field
        id="reset-password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        label={t.auth.newPassword}
        hint={t.auth.passwordHint}
      />
      <Field id="reset-confirm" name="confirm" type="password" autoComplete="new-password" required label={t.auth.confirmPassword} />
      {error && (
        <Notice tone="danger" role="alert">
          {error}
        </Notice>
      )}
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? t.common.saving : t.auth.updatePassword}
      </Button>
    </form>
  );
}
