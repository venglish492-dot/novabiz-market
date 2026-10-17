import type { Metadata, Viewport } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { getPublicProfile } from '@/features/profiles/service';
import { brand } from '@/config/brand';
import { env } from '@/lib/env';
import { PublicProfile } from './PublicProfile';

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const result = await getPublicProfile(username);
  if (result.kind !== 'profile') return { title: 'Profile not found', robots: { index: false } };
  const { profile, indexable } = result;
  const { doc, assets } = profile;
  const name = doc.profile.displayName || profile.username;
  const title = doc.seo.title || `${name} (@${profile.username})`;
  const description = doc.seo.description || doc.profile.description || `${name} on ${brand.name}.`;
  const og = doc.seo.ogImageAssetId && assets[doc.seo.ogImageAssetId] ? assets[doc.seo.ogImageAssetId].url : `/og/${profile.username}`;
  const favicon = doc.seo.faviconAssetId && assets[doc.seo.faviconAssetId] ? assets[doc.seo.faviconAssetId].url : undefined;
  const url = `${env.siteUrl}/@${profile.username}`;
  return {
    title: { absolute: `${title} · ${brand.name}` },
    description,
    alternates: { canonical: url },
    robots: indexable ? { index: true, follow: false } : { index: false, follow: false },
    openGraph: { type: 'profile', url, title, description, images: [{ url: og, width: 1200, height: 630 }], siteName: brand.name, username: profile.username },
    twitter: { card: 'summary_large_image', title, description, images: [og] },
    icons: favicon ? { icon: favicon } : undefined,
  };
}

export async function generateViewport({ params }: Props): Promise<Viewport> {
  const { username } = await params;
  const result = await getPublicProfile(username);
  return { themeColor: result.kind === 'profile' ? result.profile.doc.seo.themeColor : brand.colors.background, colorScheme: 'dark' };
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  const result = await getPublicProfile(username);
  if (result.kind === 'redirect') permanentRedirect(`/@${result.username}`);
  if (result.kind === 'not_found') notFound();
  const { profile } = result;
  const name = profile.doc.profile.displayName || profile.username;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: { '@type': 'Person', name, alternateName: `@${profile.username}`, description: profile.doc.profile.description || undefined, url: `${env.siteUrl}/@${profile.username}` },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <PublicProfile profile={profile} />
    </>
  );
}
