import { expect, test } from '@playwright/test';
import { PASSWORD, PNG_1PX, signIn, signUp, uniqueName, waitSaved } from './helpers';

test.describe.configure({ mode: 'serial' });

const username = uniqueName('creator');

test('a visitor can claim a username, build and publish a page', async ({ page, browser }) => {
  // Claim from the homepage
  await page.goto('/');
  await page.getByLabel('Choose your username').first().fill(username);
  await expect(page.getByText('Available — it’s yours if you want it.')).toBeVisible();
  await page.getByRole('button', { name: /Create your free page/ }).first().click();
  await expect(page).toHaveURL(new RegExp(`/signup\\?username=${username}`));
  await expect(page.locator('#username')).toHaveValue(username);

  await signUp(page, username);

  // Profile details autosave
  await page.goto('/dashboard/profile');
  await page.getByLabel('Display name').fill('E2E Creator');
  await page.getByLabel('Description', { exact: true }).fill('Built by an automated test.');
  await waitSaved(page);

  // A dangerous link is refused and never saved
  await page.goto('/dashboard/socials');
  await page.getByRole('button', { name: 'Add Instagram' }).click();
  const url = page.getByLabel('URL or handle');
  await url.fill('javascript:alert(1)');
  await url.blur();
  await expect(page.getByText('Only https://, http:// and mailto: links are allowed.').first()).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'Fix to save' })).toBeVisible();

  // A handle expands to a real URL
  await url.fill('@e2e_creator');
  await url.blur();
  await expect(url).toHaveValue('https://instagram.com/e2e_creator');
  await waitSaved(page);

  // Switch layout, then publish
  await page.goto('/dashboard/layouts');
  await page.getByRole('button', { name: /^Multi-Tab Identity panel/ }).click();
  await waitSaved(page);
  await page.getByRole('button', { name: /^Publish/ }).first().click();
  await expect(page.getByText('Published', { exact: true }).first()).toBeVisible();

  // Refresh keeps everything
  await page.reload();
  await page.goto('/dashboard/profile');
  await expect(page.getByLabel('Display name')).toHaveValue('E2E Creator');

  // Public page shows the saved data to an anonymous visitor
  const visitor = await browser.newPage();
  await visitor.goto(`/@${username}`);
  await expect(visitor.getByRole('heading', { name: 'E2E Creator' })).toBeVisible();
  await expect(visitor.getByRole('link', { name: 'Instagram' })).toHaveAttribute('href', 'https://instagram.com/e2e_creator');
  // Multi-Tab layout with only icon links: no empty "Links" tab is rendered.
  await expect(visitor.getByRole('tab', { name: /Links/ })).toHaveCount(0);
  const html = await visitor.content();
  expect(html).not.toContain(`${username}@example.com`);
  await visitor.close();
});

test('duplicate usernames are rejected', async ({ request }) => {
  const res = await request.get(`/api/username?name=${username.toUpperCase()}`);
  const body = await res.json();
  expect(body.available).toBe(false);
  expect(body.error).toMatch(/taken/);
});

test('sign out and back in', async ({ page }) => {
  await signIn(page, username);
  await page.goto('/dashboard/settings');
  await page.getByRole('button', { name: 'Sign out' }).first().click();
  await page.waitForURL('/');
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login/);
  await page.fill('#email', `${username}@example.com`);
  await page.fill('#password', 'wrong password!!');
  await page.click('button[type=submit]');
  await expect(page.getByText('That email and password don’t match.')).toBeVisible();
  await page.fill('#password', PASSWORD);
  await page.click('button[type=submit]');
  await page.waitForURL(/\/dashboard/);
});

test('widgets and tabs appear on the published page', async ({ page, browser }) => {
  await signIn(page, username);
  await page.goto('/dashboard/widgets');
  await page.getByRole('button', { name: 'Add tab' }).click();
  await page.getByLabel('Tab name').fill('About');
  await page.getByRole('button', { name: /Text A short paragraph/ }).click();
  await page.getByRole('button', { name: 'Add Text' }).click();
  await page.getByLabel('Title', { exact: true }).fill('Hello widget');
  await page.getByLabel('Text', { exact: true }).fill('Widget body text');
  await page.getByLabel('Tab', { exact: true }).selectOption({ label: 'About' });
  await waitSaved(page);
  await page.getByRole('button', { name: /^Publish/ }).first().click();
  await expect(page.getByText(/Live at/)).toBeVisible();

  const visitor = await browser.newPage();
  await visitor.goto(`/@${username}`);
  await visitor.getByRole('tab', { name: /About/ }).click();
  await expect(visitor.getByRole('tabpanel')).toContainText('Widget body text');
  await visitor.close();
});

test('uploads are validated, and private files stay private', async ({ page, browser }) => {
  await signIn(page, username);
  await page.goto('/dashboard/media');
  const input = page.locator('input[type=file]').first();

  await input.setInputFiles({ name: 'pixel.png', mimeType: 'image/png', buffer: PNG_1PX });
  await expect(page.getByText('pixel.png').first()).toBeVisible();

  // An HTML file pretending to be a PNG is refused by the server
  await input.setInputFiles({ name: 'evil.png', mimeType: 'image/png', buffer: Buffer.from('<html><script>alert(1)</script></html>') });
  await expect(page.getByText(/isn’t supported/)).toBeVisible();

  // Make the image private: the owner can open it, other people can't
  const item = page.locator('li', { hasText: 'pixel.png' }).first();
  await item.getByLabel(/Visibility of/).selectOption('private');
  const link = await item.getByRole('link', { name: /Open pixel.png/ }).getAttribute('href');
  const id = link!.split('/').pop();
  await expect.poll(async () => (await page.request.get(`/api/files/${id}`)).status()).toBe(200);
  const stranger = await browser.newContext();
  expect((await stranger.request.get(`/api/files/${id}`)).status()).toBe(404);
  expect((await stranger.request.get(`/media/${id}`)).status()).toBe(404);
  await stranger.close();
});
