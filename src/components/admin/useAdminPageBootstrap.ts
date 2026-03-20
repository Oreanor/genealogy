'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  applyMerge,
  computeMerge,
  hashData,
  mergeHasChanges,
  type MergeResolutions,
  type MergeResult,
} from '@/lib/utils/dataMerge';
import { setAdminWorkingPersons } from '@/lib/data/persons';
import { setAdminWorkingPlaceFallbacks } from '@/lib/data/mapFallbacks';
import {
  loadStoredPayload,
  saveToStorage,
  type AdminDataSections,
} from './adminPageClientUtils';

type ConflictState = {
  merge: MergeResult;
  serverData: AdminDataSections;
} | null;

export function useAdminPageBootstrap(serverData: AdminDataSections) {
  const serverHash = useMemo(() => hashData(serverData), [serverData]);

  const [initSnapshot] = useState(() => {
    const stored = loadStoredPayload();
    if (!stored) return { data: serverData, conflict: null as ConflictState };

    if (stored.bundledHash === serverHash) {
      return { data: stored.data, conflict: null as ConflictState };
    }

    const merge = computeMerge(stored.data, serverData);
    if (!mergeHasChanges(merge)) {
      return { data: stored.data, conflict: null as ConflictState, hashDirty: true };
    }

    return {
      data: stored.data,
      conflict: {
        merge,
        serverData,
      } as Exclude<ConflictState, null>,
    };
  });

  const [initialData, setInitialData] = useState(initSnapshot.data);
  const [dataVersion, setDataVersion] = useState(0);
  const [bundledConflict, setBundledConflict] = useState<ConflictState>(initSnapshot.conflict);

  useEffect(() => {
    if ('hashDirty' in initSnapshot) {
      saveToStorage(initSnapshot.data, serverHash);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReload = useCallback((data: AdminDataSections) => {
    setAdminWorkingPersons(null);
    setAdminWorkingPlaceFallbacks(null);
    setInitialData(data);
    setDataVersion((v) => v + 1);
  }, []);

  const handleBundledMergeApply = useCallback(
    (resolutions: MergeResolutions) => {
      if (!bundledConflict) return;
      const merged = applyMerge(initialData, bundledConflict.merge, resolutions);
      saveToStorage(merged, serverHash);
      setInitialData(merged);
      setDataVersion((v) => v + 1);
      setBundledConflict(null);
    },
    [bundledConflict, initialData, serverHash]
  );

  const handleBundledMergeCancel = useCallback(() => {
    saveToStorage(initialData, serverHash);
    setBundledConflict(null);
  }, [initialData, serverHash]);

  return {
    serverHash,
    initialData,
    dataVersion,
    bundledConflict,
    handleReload,
    handleBundledMergeApply,
    handleBundledMergeCancel,
  };
}
