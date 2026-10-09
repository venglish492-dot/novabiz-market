import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { safeNextPath } from '@/lib/auth/session';
import { logger } from '@/lib/logger';

const OTP_TYPES: EmailOtpType[] = ['signup', 'invite', 'magiclink', 'recovery', 'email_change', 'email'];

/**
 * Completes email confirmation, password recovery and OAuth sign-in.
 * Supports both the PKCE `code` flow and `token_hash` email links.
 * The redirect target is restricted to same-origin relative paths.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const next = safeNextPath(searchParams.get('next'), '/library');
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;

  const supabase = await createSupabaseServerClient();
  if (supabase) {
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(new URL(next, request.url));
      logger.warn('auth.callback.code_failed', { code: error.code });
    } else if (tokenHash && type && OTP_TYPES.includes(type)) {
      const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
      if (!error) return NextResponse.redirect(new URL(type === 'recovery' ? '/reset-password' : next, request.url));
      logger.warn('auth.callback.otp_failed', { code: error.code });
    }
  }
  return NextResponse.redirect(new URL('/login?error=callback', request.url));
}
