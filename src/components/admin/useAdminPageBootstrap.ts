'use client';

import { useCallback, useState } from 'react';
import { setAdminWorkingPersons } from '@/lib/data/persons';
import { setAdminWorkingPlaceFallbacks } from '@/lib/data/mapFallbacks';
import type { AdminDataSections } from './adminPageClientUtils';

/**
 * Base data of the admin session. Edits are in-memory only (not persisted between visits);
 * `handleReload` swaps the base data (e.g. after an import) and remounts the editors via `dataVersion`.
 */
export function useAdminPageBootstrap(serverData: AdminDataSections) {
  const [initialData, setInitialData] = useState(serverData);
  const [dataVersion, setDataVersion] = useState(0);

  const handleReload = useCallback((data: AdminDataSections) => {
    setAdminWorkingPersons(null);
    setAdminWorkingPlaceFallbacks(null);
    setInitialData(data);
    setDataVersion((v) => v + 1);
  }, []);

  return { initialData, dataVersion, handleReload };
}
