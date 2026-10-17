import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth/session';
import { getEditorState } from '@/features/profiles/service';
import { listAssets } from '@/features/uploads/service';
import { listPresetsAction } from '@/app/actions/profile';
import { EditorProvider } from '@/components/editor/EditorProvider';
import { EditorShell } from '@/components/editor/EditorShell';
import { ClaimScreen } from '@/components/editor/ClaimScreen';
import { getDb } from '@/lib/db';

export const metadata: Metadata = { title: 'Dashboard', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser('/dashboard');
  const state = await getEditorState(user.id);
  if (!state) {
    return <ClaimScreen suggestion={user.email.split('@')[0].replace(/[^a-z0-9._-]/gi, '').slice(0, 24).toLowerCase()} />;
  }
  const db = await getDb();
  const [library, presets, views] = await Promise.all([
    listAssets(user.id),
    listPresetsAction(),
    db.one<{ view_count: number }>('select view_count from profiles where id = $1', [state.profileId]),
  ]);
  return (
    <EditorProvider init={{ ...state, library, presets, viewCount: views?.view_count ?? 0, email: user.email }}>
      <EditorShell isAdmin={user.role === 'admin'}>{children}</EditorShell>
    </EditorProvider>
  );
}
