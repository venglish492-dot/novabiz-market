'use server';

import { z } from 'zod';
import { getDb } from '@/lib/db';
import { getCurrentUser, requireAdmin } from '@/lib/auth/session';
import { clientIp } from '@/lib/security/request';
import { rateLimit } from '@/lib/security/rate-limit';
import { revalidatePath } from 'next/cache';

const REPORT_REASONS = ['spam', 'impersonation', 'harassment', 'explicit', 'violence', 'illegal', 'copyright', 'other'] as const;

export type SimpleState = { ok?: boolean; error?: string; message?: string } | undefined;

export async function reportAction(_prev: SimpleState, form: FormData): Promise<SimpleState> {
  const parsed = z
    .object({
      targetType: z.enum(['profile', 'media']),
      targetId: z.uuid(),
      reason: z.enum(REPORT_REASONS),
      details: z.string().trim().max(1000).default(''),
    })
    .safeParse({ targetType: form.get('targetType'), targetId: form.get('targetId'), reason: form.get('reason'), details: form.get('details') ?? '' });
  if (!parsed.success) return { error: 'Choose a reason for the report.' };
  const limit = await rateLimit(`report:${await clientIp()}`, 10, 3600);
  if (!limit.ok) return { error: 'You’ve sent several reports recently. Try again later.' };
  const user = await getCurrentUser();
  const db = await getDb();
  await db.query('insert into reports (target_type, target_id, reason, details, reporter_user_id) values ($1, $2, $3, $4, $5)', [
    parsed.data.targetType,
    parsed.data.targetId,
    parsed.data.reason,
    parsed.data.details,
    user?.id ?? null,
  ]);
  return { ok: true, message: 'Thanks — our moderators will review this report.' };
}

export async function contactAction(_prev: SimpleState, form: FormData): Promise<SimpleState> {
  const parsed = z
    .object({
      name: z.string().trim().min(1, 'Tell us your name.').max(80),
      email: z.string().trim().pipe(z.email('Enter a valid email address.')),
      topic: z.enum(['support', 'bug', 'abuse', 'feedback', 'other']),
      message: z.string().trim().min(10, 'Write a little more so we can help.').max(4000),
    })
    .safeParse({ name: form.get('name'), email: form.get('email'), topic: form.get('topic'), message: form.get('message') });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  // Honeypot: bots fill every field.
  if (form.get('website')) return { ok: true, message: 'Message received.' };
  const limit = await rateLimit(`contact:${await clientIp()}`, 5, 3600);
  if (!limit.ok) return { error: 'Too many messages from this network. Try again later.' };
  const db = await getDb();
  await db.query('insert into contact_messages (name, email, topic, message) values ($1, $2, $3, $4)', [parsed.data.name, parsed.data.email, parsed.data.topic, parsed.data.message]);
  return { ok: true, message: 'Message received. We usually reply within two working days.' };
}

// ----- Moderation (admins only) ---------------------------------------------------------

export async function resolveReportAction(id: string, status: 'resolved' | 'dismissed') {
  const admin = await requireAdmin();
  const db = await getDb();
  await db.query(`update reports set status = $2, resolved_by = $3, resolved_at = now() where id = $1`, [id, status, admin.id]);
  revalidatePath('/admin');
}

export async function setProfileFlagAction(profileId: string, flag: 'suspended' | 'verified' | 'featured', value: boolean) {
  await requireAdmin();
  const db = await getDb();
  const column = flag === 'suspended' ? 'suspended_at' : flag === 'verified' ? 'is_verified' : 'is_featured';
  if (flag === 'suspended') await db.query(`update profiles set suspended_at = ${value ? 'now()' : 'null'} where id = $1`, [profileId]);
  else await db.query(`update profiles set ${column} = $2 where id = $1`, [profileId, value]);
  revalidatePath('/admin');
}

export async function setMediaPrivateAction(assetId: string) {
  await requireAdmin();
  const db = await getDb();
  await db.query(`update assets set visibility = 'private' where id = $1`, [assetId]);
  revalidatePath('/admin');
}
