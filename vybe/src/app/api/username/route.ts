import { NextResponse } from 'next/server';
import { isUsernameAvailable } from '@/features/profiles/service';
import { clientIp } from '@/lib/security/request';
import { rateLimit } from '@/lib/security/rate-limit';

export async function GET(request: Request) {
  const name = new URL(request.url).searchParams.get('name') ?? '';
  const limit = await rateLimit(`username:${await clientIp()}`, 60, 60);
  if (!limit.ok) return NextResponse.json({ available: false, error: 'Slow down a little and try again.' }, { status: 429 });
  const result = await isUsernameAvailable(name.slice(0, 64));
  return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
}
