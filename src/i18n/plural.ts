import { INTL_LOCALE, interpolate, type Locale } from './config.ts';

export interface PluralForms {
  one: string;
  few: string;
  many: string;
  other: string;
}

const rulesCache = new Map<Locale, Intl.PluralRules>();

/** Choose the right plural form for `count` and interpolate `{count}`. */
export function plural(forms: PluralForms, count: number, locale: Locale): string {
  let rules = rulesCache.get(locale);
  if (!rules) {
    rules = new Intl.PluralRules(INTL_LOCALE[locale]);
    rulesCache.set(locale, rules);
  }
  const category = rules.select(count) as keyof PluralForms | 'zero' | 'two';
  const template = category in forms ? forms[category as keyof PluralForms] : forms.other;
  return interpolate(template, { count });
}
