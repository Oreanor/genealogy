'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

export interface AdminToolbarActions {
  onCopy: () => void;
  onDownload: () => void;
}

interface AdminToolbarContextValue {
  actions: AdminToolbarActions | null;
  setActions: (actions: AdminToolbarActions | null) => void;
}

const AdminToolbarContext = createContext<AdminToolbarContextValue | null>(null);

export function AdminToolbarProvider({ children }: { children: ReactNode }) {
  const [actions, setActions] = useState<AdminToolbarActions | null>(null);
  return (
    <AdminToolbarContext.Provider value={{ actions, setActions }}>
      {children}
    </AdminToolbarContext.Provider>
  );
}

export function useAdminToolbar() {
  const ctx = useContext(AdminToolbarContext);
  return ctx ?? { actions: null, setActions: (_: AdminToolbarActions | null) => {} };
}
