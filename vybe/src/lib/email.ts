import 'server-only';
import { env } from '@/lib/env';
import { logger } from '@/lib/logger';

export function emailConfigured(): boolean {
  return Boolean(env.email.resendApiKey && env.email.from);
}

/** Sends a transactional email through Resend. Returns false when not configured or on failure. */
export async function sendEmail(to: string, subject: string, text: string): Promise<boolean> {
  if (!emailConfigured()) return false;
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.email.resendApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: env.email.from, to, subject, text }),
    });
    if (!response.ok) logger.warn('email.send_failed', { status: response.status });
    return response.ok;
  } catch (error) {
    logger.warn('email.send_failed', { error });
    return false;
  }
}
