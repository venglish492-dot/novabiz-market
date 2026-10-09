'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveProductAction, type AdminActionState } from '@/lib/actions/admin';
import { FORMATS, FORMAT_IDS } from '@/data/formats';
import { GOALS } from '@/data/goals';
import type { Product } from '@/types';
import { Button } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Notice';
import { useAdminT } from './AdminI18n';
import { Panel, inputClass, labelClass, textareaClass } from './ui';

interface Option {
  id: string;
  label: string;
}

const PRODUCT_TYPES = [
  'spreadsheet',
  'notion-template',
  'presentation',
  'playbook',
  'ui-kit',
  'design-system',
  'code',
  'prompt-pack',
  'workflow',
  '3d',
  'icons',
  'illustrations',
  'guide',
  'bundle',
] as const;

function Bilingual({ name, label, value, multiline = false, rows = 3, hint }: { name: string; label: string; value?: { ru: string; en: string } | null; multiline?: boolean; rows?: number; hint?: string }) {
  const t = useAdminT();
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-sm text-fg">{label}</legend>
      <div className="grid gap-2 md:grid-cols-2">
        {(['ru', 'en'] as const).map((lang) => (
          <label key={lang} className="flex flex-col gap-1 text-xs text-fg-subtle">
            {t.common[lang]}
            {multiline ? (
              <textarea name={`${name}.${lang}`} defaultValue={value?.[lang] ?? ''} rows={rows} className={textareaClass} lang={lang} />
            ) : (
              <input name={`${name}.${lang}`} defaultValue={value?.[lang] ?? ''} className={inputClass} lang={lang} />
            )}
          </label>
        ))}
      </div>
      {hint && <p className="text-xs text-fg-subtle">{hint}</p>}
    </fieldset>
  );
}

export function ProductEditor({
  product,
  categories,
  collections,
  products,
  collectionIds,
  defaultType,
}: {
  product: Product | null;
  categories: Option[];
  collections: Option[];
  products: Option[];
  collectionIds: string[];
  defaultType?: string;
}) {
  const t = useAdminT();
  const router = useRouter();
  const [state, action, pending] = useActionState<AdminActionState, FormData>(saveProductAction, {});
  const [type, setType] = useState<string>(product?.productType ?? defaultType ?? 'spreadsheet');

  useEffect(() => {
    if (state.ok && state.id && !product) router.replace(`/admin/products/${state.id}`);
  }, [state, product, router]);

  const list = (value?: { ru: string[]; en: string[] }) => (value ? { ru: value.ru.join('\n'), en: value.en.join('\n') } : null);
  const errorText = state.error
    ? state.error === 'slugTaken'
      ? t.products.slugTaken
      : state.error.startsWith('invalid')
        ? `${t.products.invalid} (${state.error.replace('invalid:', '')})`
        : t.common.error
    : null;

  return (
    <form action={action} className="flex flex-col gap-6">
      {product && <input type="hidden" name="id" value={product.id} />}

      <Panel title={t.products.sections.basics}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className={labelClass}>
            {t.products.fields.slug}
            <input name="slug" required defaultValue={product?.slug ?? ''} pattern="[a-z0-9]+(-[a-z0-9]+)*" className={`${inputClass} t-mono`} />
          </label>
          <label className={labelClass}>
            {t.products.fields.status}
            <select name="status" defaultValue={product?.status ?? 'draft'} className={inputClass}>
              {(['draft', 'published', 'archived'] as const).map((status) => (
                <option key={status} value={status}>
                  {t.products.statuses[status]}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            {t.products.fields.productType}
            <select name="product_type" value={type} onChange={(event) => setType(event.target.value)} className={inputClass}>
              {PRODUCT_TYPES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            {t.products.fields.category}
            <select name="category_id" defaultValue={product?.categoryId ?? ''} required className={inputClass}>
              <option value="" disabled>
                —
              </option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
          </label>
          <label className={`${labelClass} md:col-span-2`}>
            {t.products.fields.secondaryCategories}
            <select name="secondary_category_ids" multiple defaultValue={product?.secondaryCategoryIds ?? []} className={`${textareaClass} h-32`}>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2.5 text-sm text-fg">
            <input type="checkbox" name="is_featured" defaultChecked={product?.isFeatured ?? false} className="h-4 w-4 accent-[var(--accent)]" />
            {t.products.fields.isFeatured}
          </label>
          <label className={labelClass}>
            {t.products.fields.sortOrder}
            <input name="sort_order" type="number" defaultValue={product?.sortOrder ?? 0} className={inputClass} />
          </label>
        </div>
      </Panel>

      <Panel title={t.products.sections.content}>
        <div className="flex flex-col gap-5">
          <Bilingual name="title" label={t.products.fields.title} value={product?.title} />
          <Bilingual name="subtitle" label={t.products.fields.subtitle} value={product?.subtitle} />
          <Bilingual name="short_description" label={t.products.fields.shortDescription} value={product?.shortDescription} multiline rows={3} />
          <Bilingual name="description" label={t.products.fields.description} value={product?.description} multiline rows={6} />
        </div>
      </Panel>

      <Panel title={t.products.sections.details}>
        <div className="flex flex-col gap-5">
          <Bilingual name="audience" label={t.products.fields.audience} value={list(product?.audience)} multiline hint={t.common.onePerLine} />
          <Bilingual name="use_cases" label={t.products.fields.useCases} value={list(product?.useCases)} multiline hint={t.common.onePerLine} />
          <Bilingual name="features" label={t.products.fields.features} value={list(product?.features)} multiline rows={5} hint={t.common.onePerLine} />
          <Bilingual name="included_items" label={t.products.fields.includedItems} value={list(product?.includedItems)} multiline rows={5} hint={t.common.onePerLine} />
          <Bilingual name="requirements" label={t.products.fields.requirements} value={list(product?.requirements)} multiline hint={t.common.onePerLine} />
          <label className={labelClass}>
            {t.products.fields.specs}
            <textarea name="specs" rows={6} defaultValue={JSON.stringify(product?.specs ?? [], null, 2)} className={`${textareaClass} t-mono text-xs`} />
            <span className="text-xs text-fg-subtle">{t.products.fields.specsHint}</span>
          </label>
          <label className={labelClass}>
            {t.products.fields.faq}
            <textarea name="faq" rows={6} defaultValue={JSON.stringify(product?.faq ?? [], null, 2)} className={`${textareaClass} t-mono text-xs`} />
            <span className="text-xs text-fg-subtle">{t.products.fields.faqHint}</span>
          </label>
        </div>
      </Panel>

      <Panel title={t.products.sections.commerce}>
        <div className="grid gap-4 md:grid-cols-3">
          <label className={labelClass}>
            {t.products.fields.price}
            <input name="price_amount" type="number" min="0" step="0.01" required defaultValue={product?.price.amount ?? ''} className={inputClass} />
          </label>
          <label className={labelClass}>
            {t.products.fields.currency}
            <input name="currency" required maxLength={3} defaultValue={product?.price.currency ?? 'RUB'} className={`${inputClass} uppercase`} />
          </label>
          <label className={labelClass}>
            {t.products.fields.compareAt}
            <input name="compare_at_amount" type="number" min="0" step="0.01" defaultValue={product?.compareAtAmount ?? ''} className={inputClass} />
            <span className="text-xs text-fg-subtle">{t.products.fields.compareAtHint}</span>
          </label>
          <label className={labelClass}>
            {t.products.fields.license}
            <select name="license_tier" defaultValue={product?.license ?? 'commercial'} className={inputClass}>
              {['personal', 'commercial', 'team', 'extended'].map((license) => (
                <option key={license} value={license}>
                  {license}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            {t.products.fields.delivery}
            <select name="delivery" defaultValue={product?.delivery ?? 'download'} className={inputClass}>
              {(['download', 'external-link', 'download-and-link'] as const).map((delivery) => (
                <option key={delivery} value={delivery}>
                  {t.products.deliveries[delivery]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Panel>

      <Panel title={t.products.sections.meta}>
        <div className="grid gap-4 md:grid-cols-3">
          <label className={labelClass}>
            {t.products.fields.version}
            <input name="version" required defaultValue={product?.version ?? '1.0'} className={inputClass} />
          </label>
          <label className={labelClass}>
            {t.products.fields.lastUpdated}
            <input name="last_updated" type="date" required defaultValue={product?.lastUpdated?.slice(0, 10) ?? new Date().toISOString().slice(0, 10)} className={inputClass} />
          </label>
          <label className={labelClass}>
            {t.products.fields.fileSize}
            <input name="file_size_label" defaultValue={product?.fileSize ?? ''} placeholder="8.4 MB" className={inputClass} />
          </label>
        </div>
        <fieldset className="mt-5">
          <legend className="mb-2 text-sm text-fg">{t.products.fields.formats}</legend>
          <div className="flex flex-wrap gap-2">
            {FORMAT_IDS.map((format) => (
              <label key={format} className="flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-xs text-fg-muted has-[:checked]:border-accent has-[:checked]:text-fg">
                <input type="checkbox" name="formats" value={format} defaultChecked={product?.formats.includes(format)} className="accent-[var(--accent)]" />
                {FORMATS[format].label}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="mt-5">
          <legend className="mb-2 text-sm text-fg">{t.products.fields.goals}</legend>
          <div className="flex flex-wrap gap-2">
            {GOALS.map((goal) => (
              <label key={goal.id} className="flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-xs text-fg-muted has-[:checked]:border-accent has-[:checked]:text-fg">
                <input type="checkbox" name="goals" value={goal.id} defaultChecked={product?.goals.includes(goal.id)} className="accent-[var(--accent)]" />
                {goal.title.ru}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <label className={labelClass}>
            {t.products.fields.software}
            <input name="software" defaultValue={product?.software.join(', ') ?? ''} className={inputClass} />
          </label>
          <label className={labelClass}>
            {t.products.fields.technologies}
            <input name="technologies" defaultValue={product?.technologies.join(', ') ?? ''} className={inputClass} />
          </label>
          <label className={labelClass}>
            {t.products.fields.tags}
            <input name="tags" defaultValue={product?.tags.join(', ') ?? ''} className={inputClass} />
          </label>
        </div>
      </Panel>

      <Panel title={t.products.sections.links}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className={labelClass}>
            {t.products.fields.previewUrl}
            <input name="preview_url" type="url" defaultValue={product?.previewUrl ?? ''} placeholder="https://" className={inputClass} />
          </label>
          <label className={labelClass}>
            {t.products.fields.documentationUrl}
            <input name="documentation_url" type="url" defaultValue={product?.documentationUrl ?? ''} placeholder="https://" className={inputClass} />
          </label>
        </div>
      </Panel>

      {type === 'bundle' && (
        <Panel title={t.products.sections.bundle}>
          <label className={labelClass}>
            {t.products.fields.bundleItems}
            <select name="bundle_items" multiple defaultValue={product?.bundleProductIds ?? []} className={`${textareaClass} h-40`}>
              {products
                .filter((option) => option.id !== product?.id)
                .map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
            </select>
          </label>
        </Panel>
      )}

      <Panel title={t.products.sections.collections}>
        <label className={labelClass}>
          {t.products.fields.collections}
          <select name="collection_ids" multiple defaultValue={collectionIds} className={`${textareaClass} h-28`}>
            {collections.map((collection) => (
              <option key={collection.id} value={collection.id}>
                {collection.label}
              </option>
            ))}
          </select>
        </label>
      </Panel>

      <Panel title={t.products.sections.seo}>
        <div className="flex flex-col gap-5">
          <Bilingual name="seo_title" label={t.products.fields.seoTitle} value={product?.seo.title} />
          <Bilingual name="seo_description" label={t.products.fields.seoDescription} value={product?.seo.description} multiline rows={2} />
        </div>
      </Panel>

      <div className="sticky bottom-0 -mx-4 flex items-center gap-4 border-t border-line glass px-4 py-4 sm:mx-0 sm:rounded-2xl sm:border">
        <Button type="submit" disabled={pending}>
          {pending ? t.common.saving : t.common.save}
        </Button>
        {state.ok && (
          <p role="status" className="text-sm text-success">
            {t.products.saved}
          </p>
        )}
        {errorText && (
          <div className="flex-1">
            <Notice tone="danger" role="alert">
              {errorText}
            </Notice>
          </div>
        )}
      </div>
    </form>
  );
}
