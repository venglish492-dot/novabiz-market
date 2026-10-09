import type { Metadata } from 'next';
import Link from 'next/link';
import { CircleX } from 'lucide-react';
import { getI18n } from '@/i18n/server';
import { pageMetadata } from '@/lib/seo/metadata';
import { ButtonLink } from '@/components/ui/Button';

type Props = { searchParams: Promise<{ failed?: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return pageMetadata({ title: t.checkout.result.cancelledTitle, description: t.meta.description, path: '/checkout/cancelled', noIndex: true });
}

/** Returned here from the provider when payment was cancelled or failed. The cart is kept. */
export default async function CheckoutCancelledPage({ searchParams }: Props) {
  const { t } = await getI18n();
  const failed = (await searchParams).failed === '1';
  return (
    <div className="container-page max-w-2xl py-20 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-line-strong bg-surface-2 text-fg-muted">
        <CircleX className="h-6 w-6" aria-hidden />
      </span>
      <h1 className="t-h1 mt-6 text-fg">{failed ? t.checkout.result.failedTitle : t.checkout.result.cancelledTitle}</h1>
      <p className="t-lead mx-auto mt-4 max-w-lg">{failed ? t.checkout.result.failedBody : t.checkout.result.cancelledBody}</p>
      <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
        <ButtonLink href="/checkout">{t.common.retry}</ButtonLink>
        <ButtonLink href="/cart" variant="secondary">
          {t.checkout.result.backToCart}
        </ButtonLink>
        <Link href="/contact" className="inline-flex h-11 items-center justify-center px-5 text-sm text-fg-muted hover:text-fg">
          {t.common.contactSupport}
        </Link>
      </div>
    </div>
  );
}
