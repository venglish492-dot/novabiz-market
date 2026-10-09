import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowUpRight, Trash2 } from 'lucide-react';
import { pick } from '@/i18n/config';
import { requireStaff } from '@/lib/auth/session';
import { isAdminRole } from '@/lib/auth/roles';
import { adminCategories, adminCollections, adminProduct, adminProducts } from '@/lib/admin/queries';
import { deleteFileAction, deleteImageAction, deleteProductAction, setFileCurrentAction } from '@/lib/actions/admin';
import { mediaUrl } from '@/lib/catalog/mappers';
import { publicSupabase } from '@/lib/config/site';
import { serverConfig } from '@/lib/config/server';
import { formatBytes, formatDate } from '@/lib/format';
import { uuidSchema } from '@/lib/validation/schemas';
import { Badge } from '@/components/ui/Badge';
import { Notice } from '@/components/ui/Notice';
import { AdminPage, Panel } from '@/components/admin/ui';
import { ProductEditor } from '@/components/admin/ProductEditor';
import { ChangelogForm, ExternalLinkForm, FileUploader, ImageUploader } from '@/components/admin/AssetManagers';
import { ConfirmSubmit } from '@/components/admin/ConfirmSubmit';
import { getAdminI18n } from '../../admin-i18n';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireStaff();
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) notFound();
  const { a, locale } = await getAdminI18n();
  const [{ product, files, images, collectionIds }, categories, collections, products] = await Promise.all([
    adminProduct(id),
    adminCategories(),
    adminCollections(),
    adminProducts(),
  ]);
  if (!product) notFound();

  return (
    <AdminPage
      title={pick(product.title, locale) || product.slug}
      description={`/${product.slug}`}
      actions={
        product.status === 'published' ? (
          <Link href={`/products/${product.slug}`} target="_blank" className="inline-flex items-center gap-1 text-sm text-accent hover:underline">
            /products/{product.slug}
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-6">
        <ProductEditor
          product={product}
          categories={categories.map((c) => ({ id: c.id, label: `${c.parentId ? '— ' : ''}${pick(c.name, locale)}` }))}
          collections={collections.map((c) => ({ id: c.id, label: pick(c.title, locale) }))}
          products={products.map((p) => ({ id: p.id, label: pick(p.title, locale) }))}
          collectionIds={collectionIds}
        />

        <Panel title={a.products.sections.files}>
          <p className="mb-4 text-xs text-fg-subtle">{a.files.privateNote}</p>
          {files.length ? (
            <ul className="mb-5 flex flex-col divide-y divide-line rounded-xl border border-line">
              {files.map((file) => (
                <li key={String(file.id)} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="text-fg">
                      {String(file.file_name ?? file.external_url ?? '')}{' '}
                      {Boolean(file.is_current) && <Badge tone="success">{a.files.current}</Badge>}
                    </p>
                    <p className="mt-0.5 text-xs text-fg-subtle">
                      {a.files.kinds[file.kind as keyof typeof a.files.kinds]} · v{String(file.version)}
                      {file.size_bytes ? ` · ${formatBytes(Number(file.size_bytes), locale)}` : ''} · {formatDate(String(file.created_at), locale, 'short')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {!file.is_current && (
                      <form action={setFileCurrentAction}>
                        <input type="hidden" name="id" value={String(file.id)} />
                        <button type="submit" className="text-xs text-accent hover:underline">
                          {a.files.makeCurrent}
                        </button>
                      </form>
                    )}
                    <form action={deleteFileAction}>
                      <input type="hidden" name="id" value={String(file.id)} />
                      <ConfirmSubmit message={a.common.confirm} className="text-xs text-danger hover:underline">
                        {a.common.delete}
                      </ConfirmSubmit>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mb-5">
              <Notice tone="info">{a.files.none}</Notice>
            </div>
          )}
          <div className="flex flex-col gap-4">
            <FileUploader productId={product.id} defaultVersion={product.version} />
            <ExternalLinkForm productId={product.id} defaultVersion={product.version} />
          </div>
        </Panel>

        <Panel title={a.products.sections.images}>
          {images.length ? (
            <ul className="mb-5 grid gap-3 sm:grid-cols-3">
              {images.map((image) => (
                <li key={String(image.id)} className="overflow-hidden rounded-xl border border-line">
                  {/* eslint-disable-next-line @next/next/no-img-element -- admin preview of an uploaded asset */}
                  <img src={mediaUrl(publicSupabase.url, serverConfig.storage.mediaBucket, String(image.storage_path))} alt="" className="aspect-[4/3] w-full object-cover" />
                  <div className="flex items-center justify-between px-3 py-2 text-xs">
                    <Badge>{a.images.kinds[image.kind as keyof typeof a.images.kinds]}</Badge>
                    <form action={deleteImageAction}>
                      <input type="hidden" name="id" value={String(image.id)} />
                      <ConfirmSubmit message={a.common.confirm} className="text-danger hover:underline">
                        {a.common.delete}
                      </ConfirmSubmit>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mb-5 text-sm text-fg-subtle">{a.images.none}</p>
          )}
          <ImageUploader productId={product.id} />
        </Panel>

        <Panel title={a.products.sections.changelog}>
          {product.changelog.length > 0 && (
            <ul className="mb-5 flex flex-col gap-2 text-sm">
              {product.changelog.map((entry) => (
                <li key={entry.version} className="text-fg-muted">
                  <span className="text-fg">{entry.version}</span> · {formatDate(entry.date, locale, 'short')} — {pick(entry.notes, locale)}
                </li>
              ))}
            </ul>
          )}
          <ChangelogForm productId={product.id} defaultVersion={product.version} />
        </Panel>

        {isAdminRole(user.role) && (
          <form action={deleteProductAction} className="flex justify-end">
            <input type="hidden" name="id" value={product.id} />
            <ConfirmSubmit message={a.common.confirm} className="inline-flex items-center gap-2 text-sm text-danger hover:underline">
              <Trash2 className="h-4 w-4" aria-hidden />
              {a.common.delete}
            </ConfirmSubmit>
          </form>
        )}
      </div>
    </AdminPage>
  );
}
