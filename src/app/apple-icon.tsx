import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111419' }}>
        <svg width="132" height="132" viewBox="0 0 32 32" fill="none">
          <path d="M13 6.5h6M14 6.8v5.4l-5.6 10.1A1.6 1.6 0 0 0 9.8 24.7h12.4a1.6 1.6 0 0 0 1.4-2.4L18 12.2V6.8" stroke="#6d7380" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M11.6 14.6 16 22l2.1-3.6" stroke="#eef0f5" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M18.1 18.4 23.6 9.2" stroke="#8b9cff" strokeWidth="1.9" strokeLinecap="round" />
          <path d="M20.1 8.9h3.7v3.7" stroke="#8b9cff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    ),
    size,
  );
}
