'use client';

import { useActionState, useState } from 'react';
import { Star } from 'lucide-react';
import { useI18n } from '@/i18n/client';
import { interpolate } from '@/i18n/config';
import { submitReviewAction, type ReviewFormState } from '@/lib/actions/reviews';
import { Button } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Notice';

export function ReviewForm({ productId }: { productId: string }) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState<ReviewFormState, FormData>(submitReviewAction, {});
  const [rating, setRating] = useState(5);

  if (state.ok) {
    return (
      <Notice tone="success" role="status">
        {t.reviews.submitted}
      </Notice>
    );
  }

  const errorMessage = state.error
    ? state.error === 'alreadyReviewed'
      ? t.reviews.alreadyReviewed
      : state.error === 'signIn'
        ? t.reviews.signIn
        : t.reviews.errors[state.error === 'notOwner' ? 'notOwner' : state.error === 'invalid' ? 'invalid' : state.error === 'rateLimited' ? 'rateLimited' : 'generic']
    : null;

  return (
    <form action={action} className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="rating" value={rating} />
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-fg">{t.reviews.rating}</legend>
        <div className="flex gap-1" role="radiogroup" aria-label={t.reviews.rating}>
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={rating === value}
              aria-label={interpolate(t.reviews.ratingValue, { value })}
              onClick={() => setRating(value)}
              className="rounded-md p-1 text-fg-subtle hover:text-warning"
            >
              <Star className={`h-6 w-6 ${value <= rating ? 'fill-warning text-warning' : ''}`} aria-hidden />
            </button>
          ))}
        </div>
      </fieldset>
      <label className="flex flex-col gap-1.5 text-sm text-fg">
        {t.reviews.titleField} <span className="sr-only">({t.common.optional})</span>
        <input
          name="title"
          maxLength={120}
          className="h-11 rounded-xl border border-line-strong bg-surface-2 px-3.5 text-sm text-fg outline-none focus:border-accent"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm text-fg">
        {t.reviews.body}
        <textarea
          name="body"
          required
          minLength={20}
          maxLength={4000}
          rows={5}
          placeholder={t.reviews.bodyPlaceholder}
          className="rounded-xl border border-line-strong bg-surface-2 px-3.5 py-3 text-sm text-fg outline-none placeholder:text-fg-subtle focus:border-accent"
        />
      </label>
      {errorMessage && (
        <p role="alert" className="text-sm text-danger">
          {errorMessage}
        </p>
      )}
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? t.reviews.submitting : t.reviews.submit}
        </Button>
      </div>
    </form>
  );
}
