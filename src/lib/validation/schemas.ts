import { z } from 'zod';

/* Shared input validation. Every server action and route handler validates
   its input with these schemas before touching the database. */

export const emailSchema = z.email().max(254).transform((v) => v.trim().toLowerCase());
export const passwordSchema = z.string().min(8).max(128);
export const nameSchema = z.string().trim().min(1).max(120);
export const uuidSchema = z.uuid();

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
  next: z.string().max(500).optional(),
});

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  next: z.string().max(500).optional(),
});

export const forgotSchema = z.object({ email: emailSchema });

export const resetSchema = z
  .object({ password: passwordSchema, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'mismatch' });

export const productIdsSchema = z.array(uuidSchema).max(50);

export const couponCodeSchema = z
  .string()
  .trim()
  .max(32)
  .transform((v) => v.toUpperCase())
  .pipe(z.string().regex(/^[A-Z0-9_-]{3,32}$/));

export const checkoutSchema = z.object({
  productIds: productIdsSchema.min(1),
  couponCode: z.string().max(40).optional().default(''),
  provider: z.enum(['stripe', 'sandbox']),
  acceptTerms: z.literal(true),
});

export const reviewSchema = z.object({
  productId: uuidSchema,
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional().default(''),
  body: z.string().trim().min(20).max(4000),
});

export const newsletterSchema = z.object({
  email: emailSchema,
  locale: z.enum(['ru', 'en']).default('ru'),
});

export const analyticsEventSchema = z.object({
  name: z.enum([
    'page_view',
    'product_view',
    'search',
    'filter',
    'wishlist_add',
    'add_to_cart',
    'remove_from_cart',
    'begin_checkout',
    'payment_start',
    'payment_success',
    'payment_failed',
    'download',
    'review_submit',
  ]),
  productId: uuidSchema.optional(),
  sessionId: z.string().max(64).optional(),
  path: z.string().max(300).optional(),
  props: z.record(z.string().max(40), z.union([z.string().max(200), z.number(), z.boolean()])).optional(),
});

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .max(120);
