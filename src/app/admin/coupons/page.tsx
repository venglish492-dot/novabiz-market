import { pick } from '@/i18n/config';
import { requireAdmin } from '@/lib/auth/session';
import { adminCollections, adminCoupons, adminProducts } from '@/lib/admin/queries';
import { saveCouponAction, toggleCouponAction } from '@/lib/actions/admin';
import { formatDate } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';
import { Notice } from '@/components/ui/Notice';
import { ActionForm } from '@/components/admin/ActionForm';
import { AdminPage, EmptyRow, Panel, Table, Td, Th, inputClass, labelClass, textareaClass } from '@/components/admin/ui';
import { getAdminI18n } from '../admin-i18n';

export default async function AdminCouponsPage() {
  await requireAdmin();
  const { a, locale } = await getAdminI18n();
  const [coupons, products, collections] = await Promise.all([adminCoupons(), adminProducts(), adminCollections()]);
  return (
    <AdminPage title={a.nav.coupons}>
      <Panel title={a.coupons.new}>
        <div className="mb-4">
          <Notice tone="warning">{a.coupons.freeWarning}</Notice>
        </div>
        <ActionForm action={saveCouponAction} submitLabel={a.common.create}>
          <div className="mb-4 grid gap-3 md:grid-cols-4">
            <label className={labelClass}>
              {a.coupons.code}
              <input name="code" required pattern="[A-Za-z0-9_-]{3,32}" className={`${inputClass} t-mono uppercase`} />
            </label>
            <label className={labelClass}>
              {a.coupons.type}
              <select name="type" className={inputClass}>
                <option value="percent">{a.coupons.types.percent}</option>
                <option value="fixed">{a.coupons.types.fixed}</option>
              </select>
            </label>
            <label className={labelClass}>
              {a.coupons.amount}
              <input name="amount" type="number" min="0.01" step="0.01" required className={inputClass} />
            </label>
            <label className={labelClass}>
              {a.coupons.currency}
              <input name="currency" maxLength={3} placeholder="RUB" className={`${inputClass} uppercase`} />
            </label>
            <label className={labelClass}>
              {a.coupons.minOrder}
              <input name="min_order_amount" type="number" min="0" step="0.01" className={inputClass} />
            </label>
            <label className={labelClass}>
              {a.coupons.maxUses}
              <input name="max_uses" type="number" min="1" className={inputClass} />
            </label>
            <label className={labelClass}>
              {a.coupons.perUser}
              <input name="per_user_limit" type="number" min="1" defaultValue={1} className={inputClass} />
            </label>
            <label className={labelClass}>
              {a.coupons.description}
              <input name="description" maxLength={300} className={inputClass} />
            </label>
            <label className={labelClass}>
              {a.coupons.startsAt}
              <input name="starts_at" type="datetime-local" className={inputClass} />
            </label>
            <label className={labelClass}>
              {a.coupons.expiresAt}
              <input name="expires_at" type="datetime-local" className={inputClass} />
            </label>
            <label className={`${labelClass} md:col-span-1`}>
              {a.coupons.products}
              <select name="product_ids" multiple className={`${textareaClass} h-28`}>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {pick(p.title, locale)}
                  </option>
                ))}
              </select>
            </label>
            <label className={`${labelClass} md:col-span-1`}>
              {a.coupons.collections}
              <select name="collection_ids" multiple className={`${textareaClass} h-28`}>
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {pick(c.title, locale)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </ActionForm>
      </Panel>

      <div className="mt-8">
        <Table minWidth={760}>
          <thead>
            <tr>
              <Th>{a.coupons.code}</Th>
              <Th>{a.coupons.amount}</Th>
              <Th>{a.coupons.used}</Th>
              <Th>{a.coupons.expiresAt}</Th>
              <Th>{a.common.status}</Th>
            </tr>
          </thead>
          <tbody>
            {coupons.length ? (
              coupons.map((coupon) => (
                <tr key={String(coupon.id)}>
                  <Td className="t-mono">
                    {String(coupon.code)}
                    {coupon.description ? <div className="font-sans text-xs text-fg-subtle">{String(coupon.description)}</div> : null}
                  </Td>
                  <Td>{coupon.type === 'percent' ? `${Number(coupon.amount)}%` : `${Number(coupon.amount)} ${String(coupon.currency ?? '')}`}</Td>
                  <Td className="tabular-nums">
                    {Number(coupon.times_used)}
                    {coupon.max_uses ? ` / ${Number(coupon.max_uses)}` : ''}
                  </Td>
                  <Td className="text-fg-muted">{coupon.expires_at ? formatDate(String(coupon.expires_at), locale, 'datetime') : '—'}</Td>
                  <Td>
                    <form action={toggleCouponAction} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={String(coupon.id)} />
                      <input type="hidden" name="active" value={coupon.is_active ? 'false' : 'true'} />
                      <Badge tone={coupon.is_active ? 'success' : 'neutral'}>{coupon.is_active ? a.coupons.active : '—'}</Badge>
                      <button type="submit" className="text-xs text-accent hover:underline">
                        {coupon.is_active ? a.common.no : a.common.yes}
                      </button>
                    </form>
                  </Td>
                </tr>
              ))
            ) : (
              <EmptyRow colSpan={5} label={a.common.empty} />
            )}
          </tbody>
        </Table>
      </div>
    </AdminPage>
  );
}
