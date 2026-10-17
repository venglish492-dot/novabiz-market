import type { Metadata, Viewport } from 'next';
import './globals.css';
import '@/features/themes/font-faces';
import { brand } from '@/config/brand';
import { env } from '@/lib/env';
import { ToastProvider } from '@/components/ui/Toast';

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: { default: `${brand.name} — ${brand.headline}`, template: `%s · ${brand.name}` },
  description: brand.description,
  applicationName: brand.name,
  openGraph: { type: 'website', siteName: brand.name, title: `${brand.name} — ${brand.headline}`, description: brand.description },
  twitter: { card: 'summary_large_image' },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: brand.colors.background,
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

/** Brand colours from the central config override the CSS token defaults. */
const brandVars = `:root{--color-bg:${brand.colors.background};--color-surface:${brand.colors.surface};--color-raised:${brand.colors.surfaceRaised};--color-primary:${brand.colors.primary};--color-secondary:${brand.colors.secondary};--color-lavender:${brand.colors.highlight};--color-text:${brand.colors.text};--color-muted:${brand.colors.textMuted};}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <style dangerouslySetInnerHTML={{ __html: brandVars }} />
      </head>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
