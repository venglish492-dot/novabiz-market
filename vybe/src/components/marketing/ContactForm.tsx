'use client';

import { useActionState } from 'react';
import { contactAction } from '@/app/actions/community';

export function ContactForm() {
  const [state, action, pending] = useActionState(contactAction, undefined);
  if (state?.ok) {
    return (
      <p className="card p-8 text-center text-emerald-300" role="status">
        {state.message}
      </p>
    );
  }
  return (
    <form action={action} className="card space-y-5 p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="label">Name</label>
          <input id="name" name="name" required maxLength={80} className="input" autoComplete="name" />
        </div>
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" name="email" type="email" required className="input" autoComplete="email" />
        </div>
      </div>
      <div>
        <label htmlFor="topic" className="label">Topic</label>
        <select id="topic" name="topic" className="input" defaultValue="support">
          <option value="support">Account or page help</option>
          <option value="bug">Report a bug</option>
          <option value="abuse">Abuse or safety</option>
          <option value="feedback">Feedback</option>
          <option value="other">Something else</option>
        </select>
      </div>
      <div>
        <label htmlFor="message" className="label">Message</label>
        <textarea id="message" name="message" required minLength={10} maxLength={4000} className="input min-h-36" />
      </div>
      <div className="hidden" aria-hidden>
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      {state?.error && (
        <p className="field-error" role="alert">
          {state.error}
        </p>
      )}
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending && <span className="spinner" />} Send message
      </button>
    </form>
  );
}
