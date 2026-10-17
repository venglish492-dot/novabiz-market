import { expect, type Page } from '@playwright/test';

export const PASSWORD = 'correct horse battery';

export function uniqueName(prefix = 'e2e') {
  return `${prefix}${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
}

export async function signUp(page: Page, username: string) {
  await page.goto(`/signup?username=${username}`);
  await page.fill('#email', `${username}@example.com`);
  await page.fill('#password', PASSWORD);
  await page.check('input[name=terms]');
  await page.click('button[type=submit]');
  await page.waitForURL(/\/dashboard/);
  await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
}

export async function signIn(page: Page, username: string) {
  await page.goto('/login');
  await page.fill('#email', `${username}@example.com`);
  await page.fill('#password', PASSWORD);
  await page.click('button[type=submit]');
  await page.waitForURL(/\/dashboard/);
}

export async function waitSaved(page: Page) {
  await expect(page.getByRole('status').filter({ hasText: /All changes saved|Saved/ }).first()).toBeVisible({ timeout: 20_000 });
}

/** A valid 1×1 PNG. */
export const PNG_1PX = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
