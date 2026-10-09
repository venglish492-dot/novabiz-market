'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { savePostAction, type AdminActionState } from '@/lib/actions/admin';
import { Button } from '@/components/ui/Button';
import { useAdminT } from './AdminI18n';
import { inputClass, labelClass, textareaClass, Panel } from './ui';

export interface PostDraft {
  id?: string;
  slug: string;
  status: string;
  title: { ru: string; en: string };
  excerpt: { ru: string; en: string };
  body: { ru: string; en: string };
  authorName: string;
  relatedProductIds: string[];
  publishedAt: string | null;
}

export function PostEditor({ post, products }: { post: PostDraft | null; products: Array<{ id: string; label: string }> }) {
  const t = useAdminT();
  const router = useRouter();
  const [state, action, pending] = useActionState<AdminActionState, FormData>(savePostAction, {});
  useEffect(() => {
    if (state.ok && state.id && !post?.id) router.replace(`/admin/content/${state.id}`);
  }, [state, post, router]);

  return (
    <form action={action} className="flex flex-col gap-6">
      {post?.id && <input type="hidden" name="id" value={post.id} />}
      <Panel title={t.products.sections.basics}>
        <div className="grid gap-3 md:grid-cols-4">
          <label className={labelClass}>
            {t.products.fields.slug}
            <input name="slug" required defaultValue={post?.slug} pattern="[a-z0-9]+(-[a-z0-9]+)*" className={`${inputClass} t-mono`} />
          </label>
          <label className={labelClass}>
            {t.common.status}
            <select name="status" defaultValue={post?.status ?? 'draft'} className={inputClass}>
              {(['draft', 'published', 'archived'] as const).map((status) => (
                <option key={status} value={status}>
                  {t.products.statuses[status]}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            {t.content.author}
            <input name="author_name" defaultValue={post?.authorName ?? 'Vektor Lab'} className={inputClass} />
          </label>
          <label className={labelClass}>
            {t.content.publishedAt}
            <input name="published_at" type="datetime-local" defaultValue={post?.publishedAt?.slice(0, 16) ?? ''} className={inputClass} />
          </label>
        </div>
      </Panel>
      {(['ru', 'en'] as const).map((lang) => (
        <Panel key={lang} title={lang.toUpperCase()}>
          <div className="flex flex-col gap-3">
            <label className={labelClass}>
              {t.content.title}
              <input name={`title.${lang}`} required defaultValue={post?.title[lang]} className={inputClass} lang={lang} />
            </label>
            <label className={labelClass}>
              {t.content.excerpt}
              <textarea name={`excerpt.${lang}`} rows={2} defaultValue={post?.excerpt[lang]} className={textareaClass} lang={lang} />
            </label>
            <label className={labelClass}>
              {t.content.body}
              <textarea name={`body.${lang}`} rows={14} defaultValue={post?.body[lang]} className={`${textareaClass} t-mono text-[13px]`} lang={lang} />
            </label>
          </div>
        </Panel>
      ))}
      <Panel title={t.content.related}>
        <select name="related_product_ids" multiple defaultValue={post?.relatedProductIds ?? []} className={`${textareaClass} h-36`}>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.label}
            </option>
          ))}
        </select>
      </Panel>
      <div className="flex items-center gap-4">
        <Button type="submit" disabled={pending}>
          {pending ? t.common.saving : t.common.save}
        </Button>
        <span role="status" className={`text-sm ${state.error ? 'text-danger' : 'text-success'}`}>
          {state.ok ? t.common.saved : state.error ? t.common.error : ''}
        </span>
      </div>
    </form>
  );
}
