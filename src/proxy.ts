import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/proxy';

/** Areas that require a signed-in user. Pages re-check authorization on the server. */
const PROTECTED_PREFIXES = ['/account', '/library', '/admin'];

export async function proxy(request: NextRequest) {
  const { response, hasSession } = await updateSession(request);
  const { pathname, search } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  if (isProtected && !hasSession) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.search = `?next=${encodeURIComponent(pathname + search)}`;
    const redirect = NextResponse.redirect(loginUrl);
    // Preserve any cookie changes (e.g. cleared stale session) on the redirect.
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return redirect;
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Run on pages only: skip Next.js internals, static/metadata files,
     * images and the payment webhook (which authenticates by signature).
     */
    '/((?!_next/static|_next/image|api/webhooks|icon|apple-icon|opengraph-image|twitter-image|robots.txt|sitemap.xml|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|txt|xml)$).*)',
  ],
};
