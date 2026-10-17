import type { ProfileDocument } from './document';

/** What the renderer needs to know about an uploaded file. Never includes storage keys. */
export type AssetRef = {
  id: string;
  kind: 'image' | 'video' | 'audio' | 'font';
  url: string;
  posterUrl?: string | null;
  width?: number | null;
  height?: number | null;
  mime?: string;
};
export type AssetMap = Record<string, AssetRef>;

/** Everything needed to render a profile — used by the public page and the editor preview alike. */
export type RenderableProfile = {
  id: string;
  username: string;
  doc: ProfileDocument;
  assets: AssetMap;
  viewCount: number;
  verified: boolean;
  isDemo: boolean;
};

/** Frozen at publish time and stored in profiles.published_snapshot. */
export type PublishedSnapshot = {
  v: 1;
  username: string;
  doc: ProfileDocument;
  assets: AssetMap;
  publishedAt: string;
};

export function fileUrl(id: string): string {
  return `/api/files/${id}`;
}
export function posterUrl(id: string): string {
  return `/api/files/${id}/poster`;
}
