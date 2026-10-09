/**
 * Localization configuration.
 *
 * Active locales are rendered today. `PLANNED_LOCALES` documents the next
 * language (Uzbek) so content structures can already carry it: every
 * `LocalizedText` accepts an optional `uz` value which is used as soon as the
 * locale is activated.
 */
export const LOCALES = ['ru', 'en'] as const;
export const PLANNED_LOCALES = ['uz'] as const;

export type Locale = (typeof LOCALES)[number];
export type AnyLocale = Locale | (typeof PLANNED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'ru';
export const LOCALE_COOKIE = 'vl_locale';

export const INTL_LOCALE: Record<Locale, string> = {
  ru: 'ru-RU',
  en: 'en-US',
};

export const LOCALE_LABEL: Record<Locale, string> = {
  ru: 'Русский',
  en: 'English',
};

export type LocalizedText = Record<Locale, string> & Partial<Record<AnyLocale, string>>;
export type LocalizedList = Record<Locale, string[]> & Partial<Record<AnyLocale, string[]>>;

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/** Resolve a localized value with a predictable fallback chain. */
export function pick(text: Partial<Record<AnyLocale, string>> | null | undefined, locale: Locale): string {
  if (!text) return '';
  return text[locale] || text.en || text.ru || '';
}

export function pickList(list: Partial<Record<AnyLocale, string[]>> | null | undefined, locale: Locale): string[] {
  if (!list) return [];
  const value = list[locale];
  if (value && value.length) return value;
  return list.en ?? list.ru ?? [];
}

/** Replace `{name}` placeholders in a translated string. */
export function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  );
}
