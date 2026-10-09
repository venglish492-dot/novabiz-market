import { notFound } from 'next/navigation';
import { pick } from '@/i18n/config';
import { requireStaff } from '@/lib/auth/session';
import { adminPosts, adminProducts } from '@/lib/admin/queries';
import { asLocalized } from '@/lib/catalog/mappers';
import { AdminPage } from '@/components/admin/ui';
import { PostEditor } from '@/components/admin/PostEditor';
import { getAdminI18n } from '../../admin-i18n';

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;
  const { locale } = await getAdminI18n();
  const [posts, products] = await Promise.all([adminPosts(), adminProducts()]);
  const row = posts.find((post) => post.id === id);
  if (!row) notFound();
  return (
    <AdminPage title={pick(asLocalized(row.title), locale)}>
      <PostEditor
        post={{
          id: String(row.id),
          slug: String(row.slug),
          status: String(row.status),
          title: asLocalized(row.title),
          excerpt: asLocalized(row.excerpt),
          body: asLocalized(row.body),
          authorName: String(row.author_name),
          relatedProductIds: (row.related_product_ids as string[]) ?? [],
          publishedAt: (row.published_at as string | null) ?? null,
        }}
        products={products.map((p) => ({ id: p.id, label: pick(p.title, locale) }))}
      />
    </AdminPage>
  );
}
