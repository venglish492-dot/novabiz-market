import { pick } from '@/i18n/config';
import { requireStaff } from '@/lib/auth/session';
import { adminCollections, adminProducts } from '@/lib/admin/queries';
import { saveCollectionAction } from '@/lib/actions/admin';
import { Badge } from '@/components/ui/Badge';
import { ActionForm } from '@/components/admin/ActionForm';
import { AdminPage, Panel, inputClass, labelClass, textareaClass } from '@/components/admin/ui';
import { getAdminI18n } from '../admin-i18n';
import type { Collection } from '@/types';

export default async function AdminCollectionsPage() {
  await requireStaff();
  const { a, locale } = await getAdminI18n();
  const [collections, products] = await Promise.all([adminCollections(), adminProducts()]);
  const productOptions = products.map((p) => ({ id: p.id, label: pick(p.title, locale) }));

  const fields = (collection?: Collection & { isPublished: boolean }) => (
    <div className="mb-4 grid gap-3 md:grid-cols-2">
      {collection && <input type="hidden" name="id" value={collection.id} />}
      <label className={labelClass}>
        {a.products.fields.slug}
        <input name="slug" required defaultValue={collection?.slug} pattern="[a-z0-9]+(-[a-z0-9]+)*" className={`${inputClass} t-mono`} />
      </label>
      <label className={labelClass}>
        {a.products.fields.sortOrder}
        <input name="sort_order" type="number" defaultValue={collection?.sortOrder ?? 0} className={inputClass} />
      </label>
      <label className={labelClass}>
        {a.collections.title} (RU)
        <input name="title.ru" required defaultValue={collection?.title.ru} className={inputClass} />
      </label>
      <label className={labelClass}>
        {a.collections.title} (EN)
        <input name="title.en" required defaultValue={collection?.title.en} className={inputClass} />
      </label>
      <label className={labelClass}>
        {a.collections.description} (RU)
        <textarea name="description.ru" rows={2} defaultValue={collection?.description.ru} className={textareaClass} />
      </label>
      <label className={labelClass}>
        {a.collections.description} (EN)
        <textarea name="description.en" rows={2} defaultValue={collection?.description.en} className={textareaClass} />
      </label>
      <label className={labelClass}>
        {a.collections.products}
        <select name="product_ids" multiple defaultValue={collection?.productIds ?? []} className={`${textareaClass} h-36`}>
          {productOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className={labelClass}>
        {a.collections.featured}
        <select name="featured_product_id" defaultValue={collection?.featuredProductId ?? ''} className={inputClass}>
          <option value="">—</option>
          {productOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm text-fg">
        <input type="checkbox" name="is_published" defaultChecked={collection?.isPublished ?? false} className="accent-[var(--accent)]" />
        {a.collections.published}
      </label>
    </div>
  );

  return (
    <AdminPage title={a.nav.collections}>
      <div className="flex flex-col gap-6">
        <Panel title={a.collections.new}>
          <ActionForm action={saveCollectionAction} submitLabel={a.common.create}>
            {fields()}
          </ActionForm>
        </Panel>
        {collections.map((collection) => (
          <Panel key={collection.id} title={pick(collection.title, locale)} actions={<Badge tone={collection.isPublished ? 'success' : 'warning'}>{collection.isPublished ? a.products.statuses.published : a.products.statuses.draft}</Badge>}>
            <ActionForm action={saveCollectionAction} submitLabel={a.common.save}>
              {fields(collection)}
            </ActionForm>
          </Panel>
        ))}
      </div>
    </AdminPage>
  );
}
