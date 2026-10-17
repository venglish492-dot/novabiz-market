import { ImageResponse } from 'next/og';
import { brand } from '@/config/brand';
import { ogFonts } from '@/lib/og';

export const alt = `${brand.name} — ${brand.headline}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 90, background: 'radial-gradient(circle at 80% 10%, #3b1a63 0%, #0b0d16 55%, #070910 100%)', color: '#f7f7fc', fontFamily: 'Space Grotesk' }}>
        <div style={{ fontSize: 30, letterSpacing: 12, color: '#d8c4ff' }}>{brand.name}</div>
        <div style={{ fontSize: 84, fontWeight: 700, lineHeight: 1.04, marginTop: 30, maxWidth: 900 }}>{brand.headline}</div>
        <div style={{ fontSize: 30, color: '#a2a8ba', marginTop: 30 }}>Every feature free. Forever.</div>
      </div>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
