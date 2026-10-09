import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { getI18n } from '@/i18n/server';
import { I18nProvider } from '@/i18n/client';
import { getSessionUser } from '@/lib/auth/session';
import { isAdminRole, isStaffRole } from '@/lib/auth/roles';
import { getOwnedProductIdsForUser } from '@/lib/account/queries';
import { isCheckoutAvailable } from '@/lib/payments';
import { publicSupabase, siteConfig } from '@/lib/config/site';
import { JsonLd, organizationLd, websiteLd } from '@/lib/seo/jsonld';
import { THEME_BOOT_SCRIPT } from '@/lib/config/theme';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { ToastProvider } from '@/components/providers/ToastProvider';
import { CommerceProvider } from '@/components/providers/CommerceProvider';
import { UIProvider } from '@/components/providers/UIProvider';

const sans = Geist({ subsets: ['latin', 'cyrillic'], variable: '--font-geist-sans', display: 'swap' });
const mono = Geist_Mono({ subsets: ['latin', 'cyrillic'], variable: '--font-geist-mono', display: 'swap' });

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    metadataBase: new URL(siteConfig.url),
    title: { default: t.meta.title, template: `%s — ${siteConfig.name}` },
    description: t.meta.description,
    applicationName: siteConfig.name,
    alternates: { canonical: '/' },
    openGraph: {
      type: 'website',
      siteName: siteConfig.name,
      title: t.meta.title,
      description: t.meta.description,
      url: siteConfig.url,
    },
    twitter: { card: 'summary_large_image', title: t.meta.title, description: t.meta.description },
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#07080a' },
    { media: '(prefers-color-scheme: light)', color: '#f3f4f6' },
  ],
  colorScheme: 'dark light',
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { locale, t } = await getI18n();
  const user = await getSessionUser();
  const ownedProductIds = user ? await getOwnedProductIdsForUser(user.id) : [];

  const session = {
    user: user
      ? { id: user.id, name: user.name, email: user.email, isAdmin: isAdminRole(user.role), isStaff: isStaffRole(user.role) }
      : null,
    accountsEnabled: publicSupabase.configured,
    checkoutAvailable: isCheckoutAvailable(),
  };

  return (
    <html lang={locale} data-theme="dark" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body>
        <I18nProvider locale={locale} dictionary={t}>
          <SessionProvider value={session}>
            <ToastProvider>
              <CommerceProvider ownedProductIds={ownedProductIds}>
                <UIProvider>{children}</UIProvider>
              </CommerceProvider>
            </ToastProvider>
          </SessionProvider>
        </I18nProvider>
        <JsonLd data={[organizationLd(), websiteLd(locale)]} />
      </body>
    </html>
  );
}
