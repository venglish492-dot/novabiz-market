import Link from 'next/link';
import { Plus } from 'lucide-react';
import { pick } from '@/i18n/config';
import { requireStaff } from '@/lib/auth/session';
import { adminPosts } from '@/lib/admin/queries';
import { asLocalized } from '@/lib/catalog/mappers';
import { formatDate } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';
import { ButtonLink } from '@/components/ui/Button';
import { AdminPage, EmptyRow, Table, Td, Th } from '@/components/admin/ui';
import { getAdminI18n } from '../admin-i18n';

export default async function AdminContentPage() {
  await requireStaff();
  const { a, locale } = await getAdminI18n();
  const posts = await adminPosts();
  return (
    <AdminPage
      title={a.nav.content}
      actions={
        <ButtonLink href="/admin/content/new" size="sm">
          <Plus className="h-4 w-4" aria-hidden />
          {a.content.new}
        </ButtonLink>
      }
    >
      <Table>
        <thead>
          <tr>
            <Th>{a.content.title}</Th>
            <Th>{a.common.status}</Th>
            <Th>{a.common.updated}</Th>
          </tr>
        </thead>
        <tbody>
          {posts.length ? (
            posts.map((post) => (
              <tr key={String(post.id)}>
                <Td>
                  <Link href={`/admin/content/${String(post.id)}`} className="font-medium text-fg hover:underline">
                    {pick(asLocalized(post.title), locale)}
                  </Link>
                  <div className="t-mono text-xs text-fg-subtle">/blog/{String(post.slug)}</div>
                </Td>
                <Td>
                  <Badge tone={post.status === 'published' ? 'success' : 'warning'}>{a.products.statuses[post.status as 'draft']}</Badge>
                </Td>
                <Td className="text-fg-muted">{formatDate(String(post.updated_at), locale, 'short')}</Td>
              </tr>
            ))
          ) : (
            <EmptyRow colSpan={3} label={a.common.empty} />
          )}
        </tbody>
      </Table>
    </AdminPage>
  );
}
