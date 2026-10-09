import { notFound } from 'next/navigation';
import { FlaskConical } from 'lucide-react';
import { getI18n } from '@/i18n/server';
import { requireUser } from '@/lib/auth/session';
import { serverConfig } from '@/lib/config/server';
import { getOrder } from '@/lib/account/queries';
import { completeSandboxAction } from '@/lib/actions/checkout';
import { formatMoney } from '@/lib/format';
import { uuidSchema } from '@/lib/validation/schemas';
import { Button } from '@/components/ui/Button';

type Props = { searchParams: Promise<{ order?: string; session?: string }> };

export const metadata = { robots: { index: false, follow: false } };

/**
 * Development-only stand-in for a hosted payment page. Unreachable unless
 * PAYMENTS_SANDBOX_ENABLED=true on a non-production deployment.
 */
export default async function SandboxPaymentPage({ searchParams }: Props) {
  if (!serverConfig.sandbox.enabled) notFound();
  const { t, locale } = await getI18n();
  const { order: rawOrder, session } = await searchParams;
  await requireUser('/checkout');
  const parsed = uuidSchema.safeParse(rawOrder);
  const order = parsed.success ? await getOrder(parsed.data) : null;
  if (!order || !order.isTest || !session) notFound();

  return (
    <div className="container-page max-w-lg py-20">
      <div className="rounded-2xl border-2 border-dashed border-warning/60 bg-warning-soft p-8 text-center">
        <FlaskConical className="mx-auto h-8 w-8 text-warning" aria-hidden />
        <p className="t-eyebrow mt-4 text-warning">Sandbox · {t.common.test}</p>
        <h1 className="mt-3 text-2xl font-semibold text-fg">{t.checkout.providerSandbox}</h1>
        <p className="mt-3 text-sm leading-relaxed text-fg-muted">{t.checkout.providerSandboxNote}</p>
        <p className="mt-6 text-3xl font-semibold tabular-nums text-fg">{formatMoney(order.total, order.currency, locale)}</p>
        <p className="t-mono mt-1 text-xs text-fg-subtle">{order.orderNumber}</p>
        <form action={completeSandboxAction} className="mt-8 grid gap-2 sm:grid-cols-2">
          <input type="hidden" name="order" value={order.id} />
          <input type="hidden" name="session" value={session} />
          <Button type="submit" name="outcome" value="success">
            Simulate success
          </Button>
          <Button type="submit" name="outcome" value="failure" variant="secondary">
            Simulate failure
          </Button>
        </form>
      </div>
    </div>
  );
}
