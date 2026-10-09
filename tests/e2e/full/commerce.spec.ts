import { expect, test, type Cookie, type Page } from '@playwright/test';
import { SAAS, expectNoHorizontalOverflow, setLocale, watchConsole } from '../helpers';
import { createUser, fullStackConfigured, insert, passwordSession, select, setRole, type TestUser } from './backend';

/*
 * Full purchase lifecycle against a real Supabase backend with the sandbox
 * payment provider: sign-up → checkout → fulfilment → library → signed
 * download → review moderation → refund revokes access, plus authorization
 * checks (IDOR on downloads, non-staff admin access).
 */
test.skip(!fullStackConfigured, 'Set E2E_FULL=1, E2E_BASE_URL, E2E_SUPABASE_URL and E2E_SUPABASE_SECRET_KEY');
test.describe.configure({ mode: 'serial' });

const FILE_CONTENT = `vektor-lab e2e deliverable ${Date.now()}`;
const REVIEW_MARKER = `run ${Date.now().toString(36)}`;
let admin: TestUser;
let outsider: TestUser;
let buyer: { email: string; password: string; name: string };
let fileId = '';
let orderNumber = '';

// Sign-in is rate limited per IP (10/min), so each user signs in through the
// form once and later tests reuse that session's cookies.
const sessions = new Map<string, Cookie[]>();

async function signIn(page: Page, email: string, password: string, next = '/library') {
  await page.context().clearCookies();
  await setLocale(page, 'en');
  const saved = sessions.get(email);
  if (saved) {
    await page.context().addCookies(saved);
    await page.goto(next);
  } else {
    await page.goto(`/login?next=${encodeURIComponent(next)}`);
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    sessions.set(email, []);
  }
  await expect(page).toHaveURL(new RegExp(next.replace(/[?]/g, '\\?')));
  sessions.set(email, (await page.context().cookies()).filter((cookie) => cookie.name !== 'vl_locale'));
}

test.beforeAll(async () => {
  admin = await createUser('admin');
  await setRole(admin.id, 'super_admin');
  outsider = await createUser('outsider');
});

test('a buyer registers through the UI', async ({ page }) => {
  const console = watchConsole(page);
  buyer = { email: `buyer-${Date.now()}@example.test`, password: `Buyer-${Date.now()}-pw`, name: 'E2E Buyer' };
  await setLocale(page, 'en');
  await page.goto('/register');
  await page.getByLabel('Name').fill(buyer.name);
  await page.getByLabel('Email').fill(buyer.email);
  await page.getByLabel('Password').fill(buyer.password);
  await page.getByRole('button', { name: 'Create account' }).click();
  // With email confirmation disabled (local stack) the user is signed in straight away.
  await expect(page).toHaveURL(/\/library/);
  sessions.set(buyer.email, (await page.context().cookies()).filter((cookie) => cookie.name !== 'vl_locale'));
  await expect(page.getByRole('heading', { level: 1, name: 'Library' })).toBeVisible();
  await expect(page.getByText('Your library is empty')).toBeVisible();
  // Buyers have no admin entry point and the admin area does not exist for them.
  await expect(page.getByRole('link', { name: 'Admin' })).toHaveCount(0);
  console.expectClean();
  const response = await page.goto('/admin');
  expect(response?.status()).toBe(404);
});

test('staff upload a private product file through the admin', async ({ page }) => {
  await signIn(page, admin.email, admin.password, '/admin');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const [product] = await select<{ id: string }>('products', `slug=eq.${SAAS.slug}&select=id`);
  await page.goto(`/admin/products/${product.id}`);
  const uploader = page.locator('form').filter({ has: page.locator('input[type="file"][name="file"]') });
  await uploader.locator('input[name="label"]').fill('Model (XLSX)');
  await uploader.locator('input[type="file"]').setInputFiles({ name: 'saas-model.xlsx', mimeType: 'application/octet-stream', buffer: Buffer.from(FILE_CONTENT) });
  await uploader.getByRole('button', { name: 'Upload file' }).click();
  await expect(uploader.getByText('File uploaded')).toBeVisible();

  const files = await select<{ id: string; storage_path: string; is_current: boolean }>(
    'product_files',
    `product_id=eq.${product.id}&kind=eq.download&select=id,storage_path,is_current&order=created_at.desc&limit=1`,
  );
  expect(files[0]?.is_current).toBe(true);
  expect(files[0]?.storage_path).toContain(product.id);
  fileId = files[0].id;

  const audit = await select<{ actor_id: string }>('audit_logs', `entity_id=eq.${fileId}&action=eq.file.uploaded&select=actor_id`);
  expect(audit.map((entry) => entry.actor_id)).toEqual([admin.id]);
});

test('nobody can download before buying (IDOR and anonymous)', async ({ page, request }) => {
  const anonymous = await request.get(`/api/download?file=${fileId}`, { maxRedirects: 0 });
  expect(anonymous.status()).toBe(401);

  await signIn(page, outsider.email, outsider.password);
  const denied = await page.request.get(`/api/download?file=${fileId}&mode=json`);
  expect(denied.status()).toBe(403);
  expect(await denied.text()).not.toContain('token=');
});

test('a coupon that does not exist is rejected and never grants access', async ({ page }) => {
  await signIn(page, buyer.email, buyer.password);
  await page.goto(`/products/${SAAS.slug}`);
  await page.getByRole('button', { name: 'Add to cart' }).first().click();
  await page.goto('/checkout?coupon=FREEDEMO');
  await expect(page.getByText('This promo code does not exist.')).toBeVisible();
  await expect(page.getByRole('button', { name: /Continue to payment/ })).toBeVisible();
  const [profile] = await select<{ id: string }>('profiles', `email=eq.${encodeURIComponent(buyer.email)}&select=id`);
  expect(await select('entitlements', `user_id=eq.${profile.id}&select=id`)).toEqual([]);
});

test('checkout with the sandbox provider fulfils the order via the server', async ({ page }) => {
  const console = watchConsole(page);
  await signIn(page, buyer.email, buyer.password, '/checkout');
  await expect(page.getByText(SAAS.en).first()).toBeVisible();
  await page.getByRole('radio', { name: /Test payment \(sandbox\)/ }).check();
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: /Continue to payment/ }).click();

  await expect(page).toHaveURL(/\/checkout\/sandbox\?order=/);
  // The order exists but is not paid yet — visiting the success page must not grant anything.
  const orderId = new URL(page.url()).searchParams.get('order')!;
  const [pending] = await select<{ status: string; total_amount: number; is_test: boolean; order_number: string }>(
    'orders',
    `id=eq.${orderId}&select=status,total_amount,is_test,order_number`,
  );
  expect(pending.status).toBe('payment_pending');
  expect(Number(pending.total_amount)).toBe(3490);
  expect(pending.is_test).toBe(true);
  orderNumber = pending.order_number;

  await page.getByRole('button', { name: 'Simulate success' }).click();
  await expect(page).toHaveURL(/\/checkout\/success/);
  await expect(page.getByRole('heading', { level: 1, name: 'Payment confirmed' })).toBeVisible();
  await expect(page.getByText(orderNumber)).toBeVisible();
  await expect(page.getByText('Test order: no payment was taken')).toBeVisible();

  const [paid] = await select<{ status: string; paid_at: string | null }>('orders', `id=eq.${orderId}&select=status,paid_at`);
  expect(paid.status).toBe('paid');
  expect(paid.paid_at).not.toBeNull();
  // Includes the celebration effect on the success page (must respect the CSP).
  await page.waitForTimeout(1500);
  console.expectClean();
});

test('the library delivers the file through a short-lived signed URL', async ({ page }) => {
  await signIn(page, buyer.email, buyer.password);
  await expect(page.getByText(SAAS.en).first()).toBeVisible();
  const download = await page.request.get(`/api/download?file=${fileId}&mode=json`);
  expect(download.status()).toBe(200);
  expect(download.headers()['cache-control']).toContain('no-store');
  const { url } = (await download.json()) as { url: string };
  expect(url).toContain('token=');
  const file = await page.request.get(url);
  expect(await file.text()).toBe(FILE_CONTENT);

  // The UI button triggers the same flow and the attempt is logged.
  await page.getByRole('link', { name: /Download/ }).first().click();
  await page.goto('/account/downloads');
  await expect(page.getByText('Success').first()).toBeVisible();

  await page.goto('/account/purchases');
  await expect(page.getByText(orderNumber)).toBeVisible();
  await expect(page.getByText('Paid').first()).toBeVisible();
});

test('the outsider is still denied after the purchase by someone else', async ({ page }) => {
  await signIn(page, outsider.email, outsider.password);
  const denied = await page.request.get(`/api/download?file=${fileId}&mode=json`);
  expect(denied.status()).toBe(403);
});

test('only verified buyers can review, and reviews appear after moderation', async ({ page }) => {
  await signIn(page, buyer.email, buyer.password, `/products/${SAAS.slug}`);
  await page.getByRole('radio', { name: '5 out of 5' }).click();
  await page.getByRole('textbox', { name: 'Review' }).fill(`Clear structure; the cohort sheet saved me a weekend of work (${REVIEW_MARKER}).`);
  await page.getByRole('button', { name: 'Submit review' }).click();
  await expect(page.getByText('Thank you! Your review will appear after moderation.')).toBeVisible();

  const [review] = await select<{ id: string; status: string; verified_purchase: boolean }>('reviews', `select=id,status,verified_purchase&order=created_at.desc&limit=1`);
  expect(review.status).toBe('pending');
  expect(review.verified_purchase).toBe(true);

  // Not visible publicly until approved.
  await page.context().clearCookies();
  await setLocale(page, 'en');
  await page.goto(`/products/${SAAS.slug}`);
  await expect(page.getByText(REVIEW_MARKER)).toHaveCount(0);

  await signIn(page, admin.email, admin.password, '/admin/reviews');
  await page.getByRole('button', { name: 'Approve' }).first().click();
  await expect.poll(async () => (await select<{ status: string }>('reviews', `id=eq.${review.id}&select=status`))[0].status).toBe('approved');

  await page.context().clearCookies();
  await setLocale(page, 'en');
  await page.goto(`/products/${SAAS.slug}`);
  await expect(page.getByText(REVIEW_MARKER)).toBeVisible();
  await expect(page.getByText('Verified purchase').first()).toBeVisible();
});

test('a server-side coupon discounts the order total', async ({ page }) => {
  const code = `E2E${Date.now().toString().slice(-6)}`;
  await insert('coupons', { code, type: 'percent', amount: 20, is_active: true });
  await signIn(page, buyer.email, buyer.password);
  await page.goto('/products/startup-os-notion-workspace');
  await page.getByRole('button', { name: 'Add to cart' }).first().click();
  await page.goto(`/checkout?coupon=${code}`);
  await expect(page.getByText(`Promo code ${code} applied`)).toBeVisible();
  // 2 990 ₽ − 20 % = 2 392 ₽, computed on the server.
  await expect(page.getByRole('button', { name: /Continue to payment · ₽2,392/ })).toBeVisible();
  await expect(page.getByText('−₽598')).toBeVisible();
});

test('staff refund revokes access to the files', async ({ page }) => {
  await signIn(page, admin.email, admin.password, '/admin/orders');
  page.once('dialog', (dialog) => dialog.accept());
  const row = page.getByRole('row').filter({ hasText: orderNumber });
  await row.getByRole('button', { name: 'Refund' }).click();
  await expect.poll(async () => (await select<{ status: string }>('orders', `order_number=eq.${orderNumber}&select=status`))[0].status).toBe('refunded');

  await signIn(page, buyer.email, buyer.password);
  const denied = await page.request.get(`/api/download?file=${fileId}&mode=json`);
  expect(denied.status()).toBe(403);
  await expect(page.getByText('Your library is empty')).toBeVisible();
});

test('a signed-in buyer cannot tamper with roles, orders or entitlements through the API', async () => {
  const session = await passwordSession(buyer.email, buyer.password);
  const api = (path: string, init: RequestInit = {}) =>
    fetch(`${process.env.E2E_SUPABASE_URL}${path}`, {
      ...init,
      headers: { apikey: process.env.E2E_SUPABASE_PUBLISHABLE_KEY!, Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    });

  const escalate = await api(`/rest/v1/profiles?id=eq.${session.user.id}`, { method: 'PATCH', body: JSON.stringify({ role: 'super_admin' }) });
  expect(escalate.ok).toBe(false);

  const [product] = await select<{ id: string }>('products', `slug=eq.${SAAS.slug}&select=id`);
  const grant = await api('/rest/v1/entitlements', { method: 'POST', body: JSON.stringify({ user_id: session.user.id, product_id: product.id }) });
  expect(grant.ok).toBe(false);

  const [order] = await select<{ id: string }>('orders', `order_number=eq.${orderNumber}&select=id`);
  const markPaid = await api(`/rest/v1/orders?id=eq.${order.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'paid' }) });
  expect(markPaid.ok && (await markPaid.json()).length > 0).toBe(false);

  const fulfil = await api('/rest/v1/rpc/fulfil_order', { method: 'POST', body: JSON.stringify({ p_order_id: order.id }) });
  expect(fulfil.ok).toBe(false);

  const others = await api(`/rest/v1/orders?select=id&user_id=neq.${session.user.id}`);
  expect(await others.json()).toEqual([]);

  const [profile] = await select<{ role: string }>('profiles', `id=eq.${session.user.id}&select=role`);
  expect(profile.role).toBe('buyer');
  const [after] = await select<{ status: string }>('orders', `id=eq.${order.id}&select=status`);
  expect(after.status).toBe('refunded');
});

test('signed-in and admin pages fit narrow screens', async ({ page }) => {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 800 });
    await signIn(page, buyer.email, buyer.password);
    for (const path of ['/library', '/account', '/account/purchases', '/account/licenses', '/account/downloads', '/account/profile', '/account/settings']) {
      await page.goto(path);
      await expectNoHorizontalOverflow(page, `${path} @${width}`);
    }
    await signIn(page, admin.email, admin.password, '/admin');
    for (const path of ['/admin', '/admin/products', '/admin/orders', '/admin/settings']) {
      await page.goto(path);
      await expectNoHorizontalOverflow(page, `${path} @${width}`);
    }
  }
});
