'use client';

import { useEffect } from 'react';
import { useAdminToolbar } from '@/lib/contexts/AdminToolbarContext';

type Params = {
  handleCopy: () => Promise<void>;
  handleDownload: () => void;
  handleImport: (raw: unknown) => void;
};

export function useAdminToolbarBindings({
  handleCopy,
  handleDownload,
  handleImport,
}: Params) {
  const { setActions } = useAdminToolbar();

  useEffect(() => {
    setActions({
      onCopy: () => void handleCopy(),
      onDownload: handleDownload,
      onImport: handleImport,
    });
    return () => setActions(null);
  }, [setActions, handleCopy, handleDownload, handleImport]);
}
