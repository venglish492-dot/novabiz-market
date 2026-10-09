import { INTL_LOCALE, type Locale } from '../i18n/config.ts';
import type { CurrencyCode } from '../types/index.ts';

const moneyFormatters = new Map<string, Intl.NumberFormat>();

/**
 * Format a monetary amount stored in major units. Uses a fixed time-zone-free
 * formatter so server and client render identical output.
 */
export function formatMoney(amount: number, currency: CurrencyCode, locale: Locale): string {
  const fractional = Math.round(amount * 100) % 100 !== 0;
  const key = `${locale}:${currency}:${fractional}`;
  let formatter = moneyFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(INTL_LOCALE[locale], {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: fractional ? 2 : 0,
      maximumFractionDigits: 2,
    });
    moneyFormatters.set(key, formatter);
  }
  return formatter.format(amount);
}

/** Format an ISO date (or timestamp) deterministically in UTC. */
export function formatDate(
  value: string | Date,
  locale: Locale,
  style: 'month-year' | 'long' | 'short' | 'datetime' = 'long',
): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '';
  const options: Intl.DateTimeFormatOptions =
    style === 'month-year'
      ? { month: 'long', year: 'numeric' }
      : style === 'short'
        ? { day: 'numeric', month: 'short', year: 'numeric' }
        : style === 'datetime'
          ? { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
          : { day: 'numeric', month: 'long', year: 'numeric' };
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], { ...options, timeZone: 'UTC' }).format(date);
}

export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(INTL_LOCALE[locale]).format(value);
}

export function formatBytes(bytes: number, locale: Locale): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / 1024 ** exponent;
  return `${new Intl.NumberFormat(INTL_LOCALE[locale], { maximumFractionDigits: exponent === 0 ? 0 : 1 }).format(value)} ${units[exponent]}`;
}

/** Convert a major-unit amount to integer minor units for payment providers. */
export function toMinorUnits(amount: number, currency: CurrencyCode): number {
  const exponent = ZERO_DECIMAL_CURRENCIES.has(currency.toUpperCase()) ? 0 : 2;
  return Math.round(amount * 10 ** exponent);
}

const ZERO_DECIMAL_CURRENCIES = new Set(['JPY', 'KRW', 'VND', 'CLP', 'XOF', 'XAF', 'ISK', 'UGX']);
