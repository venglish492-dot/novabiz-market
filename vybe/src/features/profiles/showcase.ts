import { STARTER_THEME } from '@/features/themes/presets';
import { mergeTheme } from '@/features/themes/schema';
import type { RenderableProfile } from './types';

/**
 * Built-in example used on marketing pages when the demo profiles are not
 * seeded (VYBE_SEED_DEMO=false). Contains no uploads and links only to
 * VYBE's own pages, and is labelled as an example.
 */
export const SHOWCASE_PROFILE: RenderableProfile = {
  id: '00000000-0000-4000-8000-000000000000',
  username: 'example',
  viewCount: 0,
  verified: false,
  isDemo: true,
  assets: {},
  doc: {
    profile: { displayName: 'Your Name', description: 'This is what your page could look like.', statusText: 'building something', location: 'Anywhere', pronouns: '', avatarAssetId: null, bannerAssetId: null, visibility: 'public' },
    theme: mergeTheme(STARTER_THEME, { effects: { intro: 'none' } }),
    seo: { title: '', description: '', ogImageAssetId: null, faviconAssetId: null, themeColor: '#070910', noindex: true },
    links: [
      { id: '00000000-0000-4000-8000-000000000001', kind: 'social', platform: 'website', url: '/discover', label: 'Discover', iconAssetId: null, accent: null, displayMode: 'icon', newTab: false, visible: true },
      { id: '00000000-0000-4000-8000-000000000002', kind: 'social', platform: 'email', url: '/contact', label: 'Contact', iconAssetId: null, accent: null, displayMode: 'icon', newTab: false, visible: true },
    ],
    tabs: [],
    widgets: [],
    badges: [{ id: '00000000-0000-4000-8000-000000000003', label: 'Creator', icon: 'sparkles', color: '#ffffff', background: '#1b2a4a', border: '#7fb8ff', tooltip: 'Example badge', url: null, visible: true }],
    tracks: [],
  },
};
