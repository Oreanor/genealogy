'use client';

import { useCallback, useState } from 'react';
import {
  applyMerge,
  buildDefaultResolutions,
  computeMerge,
  mergeHasChanges,
  mergeHasConflicts,
  validateImportData,
  type MergeResolutions,
  type MergeResult,
} from '@/lib/utils/dataMerge';
import type { TranslationFn } from '@/lib/i18n/types';
import {
  ADMIN_DATA_FILENAME,
  downloadFile,
  saveToStorage,
  toCombinedJson,
  type AdminDataSections,
} from './adminPageClientUtils';

type Params = {
  dataRef: React.RefObject<AdminDataSections>;
  bundledHash: string;
  onReload: (data: AdminDataSections) => void;
  t: TranslationFn;
};

export function useAdminImportFlow({ dataRef, bundledHash, onReload, t }: Params) {
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [importState, setImportState] = useState<{
    merge: MergeResult;
    imported: AdminDataSections;
  } | null>(null);

  const getCombinedJson = useCallback(() => toCombinedJson(dataRef.current), [dataRef]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(getCombinedJson());
      setAlertMessage(t('adminCopied'));
    } catch {
      setAlertMessage(t('adminCopyFailed'));
    }
  }, [getCombinedJson, t]);

  const handleDownload = useCallback(() => {
    downloadFile(ADMIN_DATA_FILENAME, getCombinedJson());
    setAlertMessage(t('adminDownloaded'));
  }, [getCombinedJson, t]);

  const handleImport = useCallback(
    (raw: unknown) => {
      if (!validateImportData(raw)) {
        setAlertMessage(t('adminImportError'));
        return;
      }

      const imported = raw;
      const merge = computeMerge(dataRef.current, imported);

      if (!mergeHasChanges(merge)) {
        setAlertMessage(t('adminImportNoChanges'));
        return;
      }

      if (!mergeHasConflicts(merge)) {
        const merged = applyMerge(dataRef.current, merge, buildDefaultResolutions(merge));
        saveToStorage(merged, bundledHash);
        onReload(merged);
        setAlertMessage(t('adminImportSuccess'));
        return;
      }

      setImportState({ merge, imported });
    },
    [bundledHash, dataRef, onReload, t]
  );

  const handleMergeApply = useCallback(
    (resolutions: MergeResolutions) => {
      if (!importState) return;
      const merged = applyMerge(dataRef.current, importState.merge, resolutions);
      saveToStorage(merged, bundledHash);
      onReload(merged);
      setImportState(null);
      setAlertMessage(t('adminImportSuccess'));
    },
    [bundledHash, dataRef, importState, onReload, t]
  );

  return {
    alertMessage,
    setAlertMessage,
    importState,
    setImportState,
    handleCopy,
    handleDownload,
    handleImport,
    handleMergeApply,
  };
}
