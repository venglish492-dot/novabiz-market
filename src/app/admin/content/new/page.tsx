import { pick } from '@/i18n/config';
import { requireStaff } from '@/lib/auth/session';
import { adminProducts } from '@/lib/admin/queries';
import { AdminPage } from '@/components/admin/ui';
import { PostEditor } from '@/components/admin/PostEditor';
import { getAdminI18n } from '../../admin-i18n';

export default async function NewPostPage() {
  await requireStaff();
  const { a, locale } = await getAdminI18n();
  const products = await adminProducts();
  return (
    <AdminPage title={a.content.new}>
      <PostEditor post={null} products={products.map((p) => ({ id: p.id, label: pick(p.title, locale) }))} />
    </AdminPage>
  );
}
