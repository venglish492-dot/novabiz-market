'use client';

import { createContext, useContext, type ReactNode } from 'react';

export interface ClientSession {
  user: { id: string; name: string | null; email: string; isAdmin: boolean; isStaff: boolean } | null;
  accountsEnabled: boolean;
  checkoutAvailable: boolean;
}

const SessionContext = createContext<ClientSession>({ user: null, accountsEnabled: false, checkoutAvailable: false });

export function SessionProvider({ value, children }: { value: ClientSession; children: ReactNode }) {
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): ClientSession {
  return useContext(SessionContext);
}
