import { pick } from '@/i18n/config';
import { requireAdmin } from '@/lib/auth/session';
import { adminReviews } from '@/lib/admin/queries';
import { moderateReviewAction } from '@/lib/actions/admin';
import { formatDate } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';
import { StarRating } from '@/components/ui/StarRating';
import { AdminPage } from '@/components/admin/ui';
import { getAdminI18n } from '../admin-i18n';

export default async function AdminReviewsPage() {
  await requireAdmin();
  const { a, locale } = await getAdminI18n();
  const reviews = await adminReviews();
  const groups = [
    { status: 'pending', label: a.reviews.pending },
    { status: 'approved', label: a.reviews.approved },
    { status: 'rejected', label: a.reviews.rejected },
  ] as const;

  return (
    <AdminPage title={a.nav.reviews}>
      <div className="flex flex-col gap-10">
        {groups.map((group) => {
          const items = reviews.filter((review) => review.status === group.status);
          return (
            <section key={group.status}>
              <h2 className="mb-4 text-base font-semibold text-fg">
                {group.label} <span className="text-fg-subtle">({items.length})</span>
              </h2>
              {items.length ? (
                <ul className="flex flex-col gap-3">
                  {items.map((review) => {
                    const product = review.product as Record<string, unknown> | null;
                    return (
                      <li key={String(review.id)} className="rounded-2xl border border-line bg-surface p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <StarRating value={Number(review.rating)} label={`${review.rating}/5`} />
                            <span className="text-sm text-fg">{product ? pick(product.title as never, locale) : '—'}</span>
                          </div>
                          <span className="text-xs text-fg-subtle">
                            {String(review.author_name)} · {formatDate(String(review.created_at), locale, 'short')}
                          </span>
                        </div>
                        {review.title ? <p className="mt-3 font-medium text-fg">{String(review.title)}</p> : null}
                        <p className="mt-2 whitespace-pre-line text-sm text-fg-muted">{String(review.body)}</p>
                        <div className="mt-4 flex items-center gap-3">
                          {Boolean(review.verified_purchase) && <Badge tone="success">{a.reviews.verified}</Badge>}
                          {group.status !== 'approved' && (
                            <form action={moderateReviewAction}>
                              <input type="hidden" name="id" value={String(review.id)} />
                              <input type="hidden" name="status" value="approved" />
                              <button type="submit" className="text-sm text-success hover:underline">
                                {a.common.approve}
                              </button>
                            </form>
                          )}
                          {group.status !== 'rejected' && (
                            <form action={moderateReviewAction}>
                              <input type="hidden" name="id" value={String(review.id)} />
                              <input type="hidden" name="status" value="rejected" />
                              <button type="submit" className="text-sm text-danger hover:underline">
                                {a.common.reject}
                              </button>
                            </form>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="rounded-2xl border border-dashed border-line-strong p-6 text-sm text-fg-subtle">{a.common.empty}</p>
              )}
            </section>
          );
        })}
      </div>
    </AdminPage>
  );
}
