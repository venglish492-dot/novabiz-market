import 'server-only';
import { getI18n } from '@/i18n/server';
import { getAdminDictionary } from '@/i18n/admin';

export async function getAdminI18n() {
  const { locale, t } = await getI18n();
  return { locale, t, a: getAdminDictionary(locale) };
}
