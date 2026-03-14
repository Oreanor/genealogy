'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { getRootPersonId } from '@/lib/data/root';

interface RootPersonContextValue {
  rootPersonId: string;
  setRootPersonId: (id: string) => void;
}

const RootPersonContext = createContext<RootPersonContextValue | null>(null);

export function RootPersonProvider({ children }: { children: ReactNode }) {
  const [rootPersonId, setRootPersonId] = useState(() => getRootPersonId());
  const value = useMemo(
    () => ({ rootPersonId, setRootPersonId }),
    [rootPersonId]
  );
  return (
    <RootPersonContext.Provider value={value}>
      {children}
    </RootPersonContext.Provider>
  );
}

export function useRootPersonId(): string {
  const ctx = useContext(RootPersonContext);
  if (!ctx) return getRootPersonId();
  return ctx.rootPersonId;
}

export function useSetRootPersonId(): (id: string) => void {
  const ctx = useContext(RootPersonContext);
  if (!ctx) return () => {};
  return ctx.setRootPersonId;
}
