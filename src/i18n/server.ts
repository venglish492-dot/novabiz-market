import 'server-only';
import { cache } from 'react';
import { cookies, headers } from 'next/headers';
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from './config';
import ru, { type Dictionary } from './dictionaries/ru';
import en from './dictionaries/en';

const dictionaries: Record<Locale, Dictionary> = { ru, en };

function fromAcceptLanguage(header: string | null): Locale | null {
  if (!header) return null;
  const preferred = header
    .split(',')
    .map((part) => {
      const [tag, q] = part.trim().split(';q=');
      return { tag: tag.toLowerCase(), q: q ? Number.parseFloat(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  for (const { tag } of preferred) {
    const base = tag.split('-')[0];
    if (isLocale(base)) return base;
  }
  return null;
}

/** The visitor's locale: explicit cookie choice first, then browser preference. */
export const getLocale = cache(async (): Promise<Locale> => {
  const cookieStore = await cookies();
  const saved = cookieStore.get(LOCALE_COOKIE)?.value;
  if (isLocale(saved)) return saved;
  const headerStore = await headers();
  return fromAcceptLanguage(headerStore.get('accept-language')) ?? DEFAULT_LOCALE;
});

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export const getI18n = cache(async () => {
  const locale = await getLocale();
  return { locale, t: dictionaries[locale] };
});
