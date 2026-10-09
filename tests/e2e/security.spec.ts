import { expect, test } from '@playwright/test';

test.describe('access control and platform safety', () => {
  for (const path of ['/account', '/account/purchases', '/account/downloads', '/library', '/admin', '/admin/products', '/admin/orders', '/admin/settings']) {
    test(`anonymous ${path} redirects to sign-in`, async ({ request }) => {
      const response = await request.get(path, { maxRedirects: 0 });
      expect(response.status()).toBe(307);
      const location = response.headers()['location'] ?? '';
      expect(location).toContain('/login?next=');
      expect(decodeURIComponent(location)).toContain(path);
    });
  }

  test('downloads require a session — including guessed order/product IDs', async ({ request }) => {
    for (const query of [
      '',
      '?file=00000000-0000-4000-8000-000000000000',
      '?orderId=someone-elses-order&productId=whatever',
      '?file=../../etc/passwd',
    ]) {
      const response = await request.get(`/api/download${query}`, { maxRedirects: 0 });
      expect(response.status(), query).toBe(401);
      expect(response.headers()['cache-control']).toContain('no-store');
      expect(response.headers()['location']).toBeUndefined();
    }
  });

  test('payment webhook refuses unsigned events', async ({ request }) => {
    const response = await request.post('/api/webhooks/stripe', {
      data: { id: 'evt_fake', type: 'checkout.session.completed', data: { object: { metadata: { order_id: 'x' } } } },
    });
    expect([400, 404]).toContain(response.status());
    expect(await response.text()).not.toContain('received');
  });

  test('the sandbox checkout cannot be reached without the sandbox provider', async ({ request }) => {
    const response = await request.get('/checkout/sandbox?order=00000000-0000-4000-8000-000000000000&session=sbx_x');
    expect(response.status()).toBe(404);
  });

  test('security headers are set', async ({ request }) => {
    const response = await request.get('/');
    const headers = response.headers();
    expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(headers['content-security-policy']).toContain("object-src 'none'");
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['x-powered-by']).toBeUndefined();
  });

  test('search API validates input and returns only public data', async ({ request }) => {
    const response = await request.get(`/api/search?q=${encodeURIComponent('notion')}`);
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain('startup-os-notion-workspace');
    expect(body).not.toMatch(/storage_path|product-files|service_role/);
    const long = await request.get(`/api/search?q=${'a'.repeat(5000)}`);
    expect(long.status()).toBeLessThan(500);
  });

  test('robots and sitemap expose only public pages', async ({ request }) => {
    const robots = await (await request.get('/robots.txt')).text();
    for (const path of ['/admin', '/account', '/library', '/checkout', '/api/']) expect(robots).toContain(`Disallow: ${path}`);
    expect(robots).toContain('Sitemap: https://vektorlab.uz/sitemap.xml');

    const sitemap = await (await request.get('/sitemap.xml')).text();
    expect(sitemap).toContain('https://vektorlab.uz/products/saas-unit-economics-financial-model');
    expect(sitemap).not.toMatch(/\/admin|\/account|\/library|\/checkout|\/cart/);
  });

  test('product Open Graph images render', async ({ request }) => {
    const response = await request.get('/og/products/saas-unit-economics-financial-model');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('image/png');
    expect((await request.get('/og/products/not-real')).status()).toBe(404);
  });
});
