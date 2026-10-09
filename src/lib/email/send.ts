import 'server-only';
import { serverConfig } from '@/lib/config/server';
import { siteConfig } from '@/lib/config/site';
import { logger } from '@/lib/logger';

/**
 * Transactional email through Resend's REST API. Optional: when RESEND_API_KEY
 * and EMAIL_FROM are not set, emails are skipped (and logged) — the library
 * and order pages remain the source of truth for the customer.
 * Account emails (confirmation, password reset) are sent by Supabase Auth.
 */
export async function sendEmail(input: { to: string; subject: string; html: string; text: string }): Promise<boolean> {
  if (!serverConfig.email.configured) {
    logger.info('email.skipped_not_configured', { subject: input.subject });
    return false;
  }
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serverConfig.email.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: serverConfig.email.from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
        reply_to: siteConfig.email,
      }),
      cache: 'no-store',
    });
    if (!response.ok) {
      logger.error('email.send_failed', { status: response.status });
      return false;
    }
    return true;
  } catch (error) {
    logger.error('email.send_error', { error });
    return false;
  }
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
