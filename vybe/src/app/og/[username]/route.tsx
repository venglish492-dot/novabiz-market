import { ImageResponse } from 'next/og';
import { getPublicProfile } from '@/features/profiles/service';
import { getServableAsset } from '@/features/uploads/service';
import { getStorage } from '@/lib/storage';
import { brand } from '@/config/brand';
import { ogFonts } from '@/lib/og';

export const runtime = 'nodejs';

async function avatarDataUrl(assetId: string | null): Promise<string | null> {
  if (!assetId) return null;
  try {
    const asset = await getServableAsset(assetId, null);
    if (!asset || asset.kind !== 'image') return null;
    const object = await getStorage().get(asset.storageKey);
    if (!object) return null;
    const bytes = Buffer.from(await new Response(object.body).arrayBuffer());
    const sharp = (await import('sharp')).default;
    const png = await sharp(bytes).resize(320, 320, { fit: 'cover' }).png().toBuffer();
    return `data:image/png;base64,${png.toString('base64')}`;
  } catch {
    return null;
  }
}

/** Generated share image for profiles without a custom Open Graph image. */
export async function GET(_request: Request, ctx: RouteContext<'/og/[username]'>) {
  const { username } = await ctx.params;
  const result = await getPublicProfile(username);
  if (result.kind !== 'profile') return new Response('Not found', { status: 404 });
  const { profile } = result;
  const theme = profile.doc.theme;
  const name = profile.doc.profile.displayName || profile.username;
  const avatar = await avatarDataUrl(profile.doc.profile.avatarAssetId);
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', padding: 80, background: `linear-gradient(135deg, #05060c 0%, ${theme.colors.surface} 45%, ${theme.colors.accent}55 100%)`, color: theme.colors.text, fontFamily: 'Space Grotesk' }}>
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element -- satori renders plain img
          <img src={avatar} width={240} height={240} style={{ borderRadius: 999, border: `6px solid ${theme.colors.accent}` }} alt="" />
        ) : (
          <div style={{ width: 240, height: 240, borderRadius: 999, background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.secondary})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 110, fontWeight: 700 }}>
            {name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 60, maxWidth: 720 }}>
          <div style={{ fontSize: 78, fontWeight: 700, lineHeight: 1.05 }}>{name.slice(0, 40)}</div>
          <div style={{ fontSize: 32, opacity: 0.7, marginTop: 12 }}>{`@${profile.username}`}</div>
          {profile.doc.profile.description && <div style={{ fontSize: 30, opacity: 0.85, marginTop: 28, lineHeight: 1.35 }}>{profile.doc.profile.description.slice(0, 120)}</div>}
          <div style={{ fontSize: 24, marginTop: 40, color: theme.colors.accent, letterSpacing: 6 }}>{brand.name}</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630, fonts: await ogFonts(), headers: { 'Cache-Control': 'public, max-age=600, stale-while-revalidate=86400' } },
  );
}
