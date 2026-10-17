'use client';

import { useState } from 'react';
import type { RenderableProfile } from '@/features/profiles/types';
import { ProfileView } from '@/components/profile/ProfileView';
import { ReportDialog } from '@/components/community/ReportDialog';

export function PublicProfile({ profile }: { profile: RenderableProfile }) {
  const [reporting, setReporting] = useState(false);
  return (
    <div className="fixed inset-0 h-dvh">
      <ProfileView profile={profile} mode="public" onReport={() => setReporting(true)} />
      <ReportDialog open={reporting} onClose={() => setReporting(false)} targetType="profile" targetId={profile.id} targetLabel={`@${profile.username}`} />
    </div>
  );
}
