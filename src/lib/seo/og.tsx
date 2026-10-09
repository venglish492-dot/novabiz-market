import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';

export const OG_SIZE = { width: 1200, height: 630 };

let fontCache: Promise<[Buffer, Buffer]> | null = null;
function loadFonts() {
  fontCache ??= Promise.all([
    readFile(join(process.cwd(), 'assets/fonts/Geist-Regular.ttf')),
    readFile(join(process.cwd(), 'assets/fonts/Geist-SemiBold.ttf')),
  ]);
  return fontCache;
}

/** Branded social card. Text only from real catalog data. */
export async function renderOgImage({ eyebrow, title, subtitle, meta }: { eyebrow: string; title: string; subtitle?: string; meta?: string }) {
  const [regular, semibold] = await loadFonts();
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          background: '#07080a',
          backgroundImage:
            'radial-gradient(circle at 12% 0%, rgba(139,156,255,0.22), transparent 45%), linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '100% 100%, 48px 48px, 48px 48px',
          color: '#eef0f5',
          fontFamily: 'Geist',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <svg width="44" height="44" viewBox="0 0 32 32" fill="none">
            <rect x="0.5" y="0.5" width="31" height="31" rx="9" fill="#111419" stroke="#2a2e37" />
            <path d="M11.6 14.6 16 22l2.1-3.6" stroke="#eef0f5" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M18.1 18.4 23.6 9.2" stroke="#8b9cff" strokeWidth="1.9" strokeLinecap="round" />
            <path d="M20.1 8.9h3.7v3.7" stroke="#8b9cff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div style={{ display: 'flex', fontSize: 22, letterSpacing: 5 }}>
            <span style={{ fontWeight: 600 }}>VEKTOR</span>
            <span style={{ marginLeft: 10, color: '#a2a8b5' }}>LAB</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 1000 }}>
          <div style={{ fontSize: 22, letterSpacing: 4, textTransform: 'uppercase', color: '#8b9cff' }}>{eyebrow}</div>
          <div style={{ marginTop: 22, fontSize: title.length > 48 ? 58 : 70, fontWeight: 600, lineHeight: 1.04, letterSpacing: -2 }}>{title}</div>
          {subtitle && <div style={{ marginTop: 24, fontSize: 28, lineHeight: 1.35, color: '#a2a8b5' }}>{subtitle}</div>}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 22, color: '#6d7380' }}>
          <span>{meta ?? ''}</span>
          <span>vektorlab.uz</span>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: 'Geist', data: regular, weight: 400, style: 'normal' },
        { name: 'Geist', data: semibold, weight: 600, style: 'normal' },
      ],
    },
  );
}
