import { expect, type Page } from '@playwright/test';

export const BASE_URL = process.env.E2E_BASE_URL || `http://127.0.0.1:${process.env.E2E_PORT || 3200}`;

export const SAAS = {
  slug: 'saas-unit-economics-financial-model',
  en: 'SaaS Unit Economics & 5-Year Financial Model',
  ru: 'Финансовая модель SaaS и юнит-экономика на 5 лет',
};
export const NOTION = { slug: 'startup-os-notion-workspace', en: 'Startup OS — Notion Workspace' };

/** Set the UI language via the same cookie the language switcher writes. */
export async function setLocale(page: Page, locale: 'ru' | 'en') {
  await page.context().addCookies([{ name: 'vl_locale', value: locale, url: BASE_URL }]);
}

/** Collect console errors and uncaught exceptions for the lifetime of the page. */
export function watchConsole(page: Page) {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return {
    errors,
    expectClean() {
      expect(errors, errors.join('\n')).toEqual([]);
    },
  };
}

export async function expectNoHorizontalOverflow(page: Page, label = '') {
  const result = await page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    const offenders: string[] = [];
    for (const element of Array.from(document.querySelectorAll('body *'))) {
      const rect = element.getBoundingClientRect();
      if (!rect.width || !rect.height || rect.right <= width + 1) continue;
      // Intentional horizontal scrollers clip their children.
      if (element.closest('.no-scrollbar, .overflow-x-auto, dialog:not([open]), [aria-hidden="true"]')) continue;
      offenders.push(`${element.tagName.toLowerCase()}.${String(element.getAttribute('class') ?? '').slice(0, 80)} → ${Math.round(rect.right)}px`);
    }
    return { overflow: document.documentElement.scrollWidth - width, offenders: offenders.slice(0, 6) };
  });
  expect(result.overflow, `${label} wider than viewport:\n${result.offenders.join('\n')}`).toBeLessThanOrEqual(0);
}
