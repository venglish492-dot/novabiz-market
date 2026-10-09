'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { AdminDictionary } from '@/i18n/admin';

const AdminI18nContext = createContext<AdminDictionary | null>(null);

export function AdminI18nProvider({ dictionary, children }: { dictionary: AdminDictionary; children: ReactNode }) {
  return <AdminI18nContext.Provider value={dictionary}>{children}</AdminI18nContext.Provider>;
}

export function useAdminT(): AdminDictionary {
  const value = useContext(AdminI18nContext);
  if (!value) throw new Error('useAdminT must be used inside <AdminI18nProvider>');
  return value;
}
