'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

interface AdminToolbarActions {
  onCopy: () => void;
  onDownload: () => void;
  /** Raw text of the chosen file; parsing and validation errors are reported by the handler. */
  onImport: (fileText: string) => void;
}

interface AdminToolbarContextValue {
  actions: AdminToolbarActions | null;
  setActions: (actions: AdminToolbarActions | null) => void;
}

const AdminToolbarContext = createContext<AdminToolbarContextValue | null>(null);

export function AdminToolbarProvider({ children }: { children: ReactNode }) {
  const [actions, setActions] = useState<AdminToolbarActions | null>(null);
  const value = useMemo(() => ({ actions, setActions }), [actions]);
  return (
    <AdminToolbarContext.Provider value={value}>
      {children}
    </AdminToolbarContext.Provider>
  );
}

export function useAdminToolbar() {
  const ctx = useContext(AdminToolbarContext);
  return ctx ?? { actions: null, setActions: () => {} };
}
