'use client';

import { useCallback, useState } from 'react';
import {
  applyMerge,
  buildDefaultResolutions,
  computeMerge,
  mergeHasChanges,
  mergeHasConflicts,
  parseAdminImportData,
  type MergeResolutions,
  type MergeResult,
} from '@/lib/utils/dataMerge';
import type { TranslationFn } from '@/lib/i18n/types';
import {
  ADMIN_DATA_FILENAME,
  downloadFile,
  toCombinedJson,
  type AdminDataSections,
} from './adminPageClientUtils';

type Params = {
  dataRef: React.RefObject<AdminDataSections>;
  onReload: (data: AdminDataSections) => void;
  /** Called after the current data was exported (copied / downloaded). */
  onExported: () => void;
  t: TranslationFn;
};

export function useAdminImportFlow({ dataRef, onReload, onExported, t }: Params) {
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [importState, setImportState] = useState<{
    merge: MergeResult;
    imported: AdminDataSections;
  } | null>(null);

  const getCombinedJson = useCallback(() => toCombinedJson(dataRef.current), [dataRef]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(getCombinedJson());
      onExported();
      setAlertMessage(t('adminCopied'));
    } catch {
      setAlertMessage(t('adminCopyFailed'));
    }
  }, [getCombinedJson, onExported, t]);

  const handleDownload = useCallback(() => {
    downloadFile(ADMIN_DATA_FILENAME, getCombinedJson());
    onExported();
    setAlertMessage(t('adminDownloaded'));
  }, [getCombinedJson, onExported, t]);

  const handleImport = useCallback(
    (fileText: string) => {
      let raw: unknown;
      try {
        raw = JSON.parse(fileText);
      } catch {
        setAlertMessage(t('adminImportError'));
        return;
      }
      const imported = parseAdminImportData(raw);
      if (!imported) {
        setAlertMessage(t('adminImportError'));
        return;
      }
      const merge = computeMerge(dataRef.current, imported);

      if (!mergeHasChanges(merge)) {
        setAlertMessage(t('adminImportNoChanges'));
        return;
      }

      if (!mergeHasConflicts(merge)) {
        const merged = applyMerge(dataRef.current, merge, buildDefaultResolutions(merge));
        onReload(merged);
        setAlertMessage(t('adminImportSuccess'));
        return;
      }

      setImportState({ merge, imported });
    },
    [dataRef, onReload, t]
  );

  const handleMergeApply = useCallback(
    (resolutions: MergeResolutions) => {
      if (!importState) return;
      const merged = applyMerge(dataRef.current, importState.merge, resolutions);
      onReload(merged);
      setImportState(null);
      setAlertMessage(t('adminImportSuccess'));
    },
    [dataRef, importState, onReload, t]
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
