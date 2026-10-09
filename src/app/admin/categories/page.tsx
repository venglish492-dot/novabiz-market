import { pick } from '@/i18n/config';
import { requireStaff } from '@/lib/auth/session';
import { adminCategories } from '@/lib/admin/queries';
import { saveCategoryAction } from '@/lib/actions/admin';
import { Badge } from '@/components/ui/Badge';
import { ActionForm } from '@/components/admin/ActionForm';
import { AdminPage, Panel, inputClass, labelClass } from '@/components/admin/ui';
import { getAdminI18n } from '../admin-i18n';
import type { Category } from '@/types';

const TONES = ['design', 'development', 'ai', 'business', 'marketing', 'product', 'notion', 'data', 'slides', 'assets'];

function CategoryFields({ category, roots, a }: { category?: Category & { isActive: boolean }; roots: Category[]; a: Awaited<ReturnType<typeof getAdminI18n>>['a'] }) {
  return (
    <div className="mb-4 grid gap-3 md:grid-cols-3">
      <label className={labelClass}>
        {a.categories.id}
        <input name="id" required defaultValue={category?.id} readOnly={Boolean(category)} pattern="[a-z0-9]+(-[a-z0-9]+)*" className={`${inputClass} t-mono`} />
      </label>
      <label className={labelClass}>
        {a.categories.parent}
        <select name="parent_id" defaultValue={category?.parentId ?? ''} className={inputClass}>
          <option value="">{a.categories.none}</option>
          {roots
            .filter((root) => root.id !== category?.id)
            .map((root) => (
              <option key={root.id} value={root.id}>
                {root.name.ru}
              </option>
            ))}
        </select>
      </label>
      <label className={labelClass}>
        {a.categories.tone}
        <select name="tone" defaultValue={category?.tone ?? 'business'} className={inputClass}>
          {TONES.map((tone) => (
            <option key={tone} value={tone}>
              {tone}
            </option>
          ))}
        </select>
      </label>
      <label className={labelClass}>
        {a.categories.name} (RU)
        <input name="name.ru" required defaultValue={category?.name.ru} className={inputClass} />
      </label>
      <label className={labelClass}>
        {a.categories.name} (EN)
        <input name="name.en" required defaultValue={category?.name.en} className={inputClass} />
      </label>
      <label className={labelClass}>
        {a.products.fields.sortOrder}
        <input name="sort_order" type="number" defaultValue={category?.sortOrder ?? 0} className={inputClass} />
      </label>
      <label className={`${labelClass} md:col-span-3`}>
        {a.categories.description} (RU)
        <input name="description.ru" defaultValue={category?.description.ru} className={inputClass} />
      </label>
      <label className={`${labelClass} md:col-span-3`}>
        {a.categories.description} (EN)
        <input name="description.en" defaultValue={category?.description.en} className={inputClass} />
      </label>
      <label className="flex items-center gap-2 text-sm text-fg">
        <input type="checkbox" name="is_active" defaultChecked={category?.isActive ?? true} className="accent-[var(--accent)]" />
        {a.categories.active}
      </label>
    </div>
  );
}

export default async function AdminCategoriesPage() {
  await requireStaff();
  const { a, locale } = await getAdminI18n();
  const categories = await adminCategories();
  const roots = categories.filter((c) => !c.parentId);
  return (
    <AdminPage title={a.nav.categories}>
      <div className="flex flex-col gap-6">
        <Panel title={a.categories.new}>
          <ActionForm action={saveCategoryAction} submitLabel={a.common.create}>
            <CategoryFields roots={roots} a={a} />
          </ActionForm>
        </Panel>
        {roots.map((root) => (
          <Panel key={root.id} title={pick(root.name, locale)} actions={!root.isActive ? <Badge tone="warning">off</Badge> : undefined}>
            <details>
              <summary className="mb-3 text-sm text-accent">{a.common.edit}</summary>
              <ActionForm action={saveCategoryAction} submitLabel={a.common.save}>
                <CategoryFields category={root} roots={roots} a={a} />
              </ActionForm>
            </details>
            <ul className="mt-4 flex flex-col divide-y divide-line rounded-xl border border-line">
              {categories
                .filter((child) => child.parentId === root.id)
                .map((child) => (
                  <li key={child.id} className="px-4 py-3">
                    <details>
                      <summary className="flex cursor-pointer items-center justify-between text-sm text-fg">
                        <span>
                          {pick(child.name, locale)} <span className="t-mono text-xs text-fg-subtle">/{child.slug}</span>
                        </span>
                        {!child.isActive && <Badge tone="warning">off</Badge>}
                      </summary>
                      <div className="mt-4">
                        <ActionForm action={saveCategoryAction} submitLabel={a.common.save}>
                          <CategoryFields category={child} roots={roots} a={a} />
                        </ActionForm>
                      </div>
                    </details>
                  </li>
                ))}
            </ul>
          </Panel>
        ))}
      </div>
    </AdminPage>
  );
}
