import Link from 'next/link';
import { pick } from '@/i18n/config';
import { requireStaff } from '@/lib/auth/session';
import { adminFiles } from '@/lib/admin/queries';
import { formatBytes, formatDate } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';
import { AdminPage, EmptyRow, Table, Td, Th } from '@/components/admin/ui';
import { getAdminI18n } from '../admin-i18n';

export default async function AdminFilesPage() {
  await requireStaff();
  const { a, locale } = await getAdminI18n();
  const files = await adminFiles();
  return (
    <AdminPage title={a.nav.files} description={a.files.privateNote}>
      <Table minWidth={820}>
        <thead>
          <tr>
            <Th>{a.files.label}</Th>
            <Th>{a.files.product}</Th>
            <Th>{a.files.kind}</Th>
            <Th>{a.files.version}</Th>
            <Th className="text-right">{a.files.size}</Th>
            <Th>{a.common.created}</Th>
          </tr>
        </thead>
        <tbody>
          {files.length ? (
            files.map((file) => {
              const product = file.product as Record<string, unknown> | null;
              return (
                <tr key={String(file.id)}>
                  <Td className="t-mono text-xs">
                    {String(file.file_name ?? file.external_url ?? '—')}
                    {Boolean(file.is_current) && <Badge tone="success" className="ml-2">{a.files.current}</Badge>}
                  </Td>
                  <Td>
                    {product ? (
                      <Link href={`/admin/products/${String(product.id)}`} className="text-fg hover:underline">
                        {pick(product.title as never, locale)}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </Td>
                  <Td className="text-fg-muted">{a.files.kinds[file.kind as keyof typeof a.files.kinds]}</Td>
                  <Td className="text-fg-muted">{String(file.version)}</Td>
                  <Td className="text-right tabular-nums text-fg-muted">{file.size_bytes ? formatBytes(Number(file.size_bytes), locale) : '—'}</Td>
                  <Td className="text-fg-muted">{formatDate(String(file.created_at), locale, 'short')}</Td>
                </tr>
              );
            })
          ) : (
            <EmptyRow colSpan={6} label={a.common.empty} />
          )}
        </tbody>
      </Table>
    </AdminPage>
  );
}
