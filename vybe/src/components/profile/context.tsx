'use client';

import { createContext, useContext } from 'react';
import type { RenderableProfile } from '@/features/profiles/types';
import type { ProfileTheme } from '@/features/themes/schema';
import type { AudioStore } from './audio-store';

export type ProfileMode = 'public' | 'preview' | 'showcase';

export type ProfileCtx = {
  profile: RenderableProfile;
  theme: ProfileTheme;
  mode: ProfileMode;
  motion: boolean;
  audio: AudioStore | null;
  onLinkClick: (linkId: string) => void;
  onWidgetInteract: (widgetId: string) => void;
};

export const ProfileContext = createContext<ProfileCtx | null>(null);

export function useProfile(): ProfileCtx {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used inside <ProfileView>');
  return ctx;
}
