'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from '@/lib/i18n/context';
import { usePersonsOverlayRevision } from '@/hooks/usePersonsOverlayRevision';
import { getPersons } from '@/lib/data/persons';
import { useAdminToolbar } from '@/lib/contexts/AdminToolbarContext';
import { useSetRootPersonId } from '@/lib/contexts/RootPersonContext';
import type { AdminTabId } from './AdminTabs';
import { AdminTabs } from './AdminTabs';
import { AdminPersonsTable } from './AdminPersonsTable';
import { AdminTextsTab } from './AdminTextsTab';
import { AdminPhotosTab } from './AdminPhotosTab';
import { ImportMergeDialog } from './ImportMergeDialog';
import { Dialog } from '@/components/ui/molecules/Dialog';
import { ADMIN_TAB_COOKIE } from '@/lib/constants/storage';
import type { Person } from '@/lib/types/person';
import type { HistoryEntry } from '@/lib/types/history';
import type { PhotoEntry } from '@/lib/types/photo';
import {
  computeMerge,
  applyMerge,
  buildDefaultResolutions,
  mergeHasChanges,
  mergeHasConflicts,
  validateImportData,
  hashData,
  type MergeResult,
  type MergeResolutions,
} from '@/lib/utils/dataMerge';
import { setAdminWorkingPersons } from '@/lib/data/persons';

export type { AdminDataSections } from '@/lib/utils/dataMerge';
type AdminDataSections = import('@/lib/utils/dataMerge').AdminDataSections;

function setTabCookie(tab: string) {
  try {
    document.cookie = `${ADMIN_TAB_COOKIE}=${tab};path=/;max-age=31536000`;
  } catch {
    // ignore
  }
}

const ADMIN_DATA_FILENAME = 'admin-data.json';

interface AdminPageClientProps {
  readonly rootPersonId: string;
  readonly persons: Person[];
  readonly photos: PhotoEntry[];
  readonly history: HistoryEntry[];
  readonly initialTab: AdminTabId;
}

function downloadFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function toCombinedJson(data: AdminDataSections): string {
  return JSON.stringify(data, null, 2);
}

interface StoredPayload {
  data: AdminDataSections;
  bundledHash: string;
}

function loadStoredPayload(): StoredPayload | null {
  // Admin data is no longer restored from localStorage.
  // Always start from the bundled server data.
  return null;
}

function saveToStorage(data: AdminDataSections, bundledHash: string) {
  // no-op: admin data is not persisted between sessions anymore
  void data;
  void bundledHash;
}

/**
 * Outer shell: resolves initial data from server props and wires
 * merge dialog when imported JSON differs from current data.
 */
export function AdminPageClient({
  rootPersonId: serverRoot,
  persons: serverPersons,
  photos: serverPhotos,
  history: serverHistory,
  initialTab,
}: AdminPageClientProps) {
  const serverData = useMemo<AdminDataSections>(
    () => ({
      rootPersonId: serverRoot,
      persons: serverPersons,
      photos: serverPhotos,
      history: serverHistory,
    }),
    [serverRoot, serverPersons, serverPhotos, serverHistory]
  );

  const serverHash = useMemo(() => hashData(serverData), [serverData]);

  // Resolve initial state from bundled server data in a single pass (lazy init)
  const [initSnapshot] = useState(() => {
    const stored = loadStoredPayload();
    if (!stored) return { data: serverData, conflict: null as null };

    if (stored.bundledHash === serverHash) {
      return { data: stored.data, conflict: null as null };
    }

    const merge = computeMerge(stored.data, serverData);
    if (!mergeHasChanges(merge)) {
      return { data: stored.data, conflict: null as null, hashDirty: true };
    }
    return {
      data: stored.data,
      conflict: { merge, serverData } as {
        merge: MergeResult;
        serverData: AdminDataSections;
      },
    };
  });

  const [initialData, setInitialData] = useState(initSnapshot.data);
  const [dataVersion, setDataVersion] = useState(0);
  const [bundledConflict, setBundledConflict] = useState(
    initSnapshot.conflict
  );

  // If hash is stale but no real diff, silently update it after mount
  useEffect(() => {
    if ('hashDirty' in initSnapshot) {
      saveToStorage(initSnapshot.data, serverHash);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReload = useCallback((data: AdminDataSections) => {
    setAdminWorkingPersons(null);
    setInitialData(data);
    setDataVersion((v) => v + 1);
  }, []);

  const handleBundledMergeApply = useCallback(
    (resolutions: MergeResolutions) => {
      if (!bundledConflict) return;
      const merged = applyMerge(
        initialData,
        bundledConflict.merge,
        resolutions
      );
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

  return (
    <>
      <AdminPageClientInner
        key={dataVersion}
        initialData={initialData}
        initialTab={initialTab}
        bundledHash={serverHash}
        onReload={handleReload}
      />
      {bundledConflict && (
        <ImportMergeDialog
          merge={bundledConflict.merge}
          title="adminSiteUpdated"
          onApply={handleBundledMergeApply}
          onCancel={handleBundledMergeCancel}
        />
      )}
    </>
  );
}

interface InnerProps {
  readonly initialData: AdminDataSections;
  readonly initialTab: AdminTabId;
  readonly bundledHash: string;
  readonly onReload: (data: AdminDataSections) => void;
}

function AdminPageClientInner({
  initialData,
  initialTab,
  bundledHash,
  onReload,
}: InnerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const personsOverlayRev = usePersonsOverlayRevision();
  const t = useTranslations();

  const personsForUi = useMemo(() => {
    void locale;
    void personsOverlayRev;
    return getPersons();
  }, [locale, personsOverlayRev]);
  const setGlobalRoot = useSetRootPersonId();

  const [rootPersonId, setRootPersonId] = useState(initialData.rootPersonId);
  const [photos, setPhotos] = useState(initialData.photos);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [importState, setImportState] = useState<{
    merge: MergeResult;
    imported: AdminDataSections;
  } | null>(null);
  const [addPersonRowAction, setAddPersonRowAction] = useState<(() => void) | null>(null);
  const [deleteSelectedRowsAction, setDeleteSelectedRowsAction] = useState<(() => void) | null>(null);
  const [selectedRowsCount, setSelectedRowsCount] = useState(0);
  const [addTextEntryAction, setAddTextEntryAction] = useState<(() => void) | null>(null);
  const [refreshPhotosAction, setRefreshPhotosAction] = useState<(() => void) | null>(null);
  const [togglePhotosVisibilityAction, setTogglePhotosVisibilityAction] = useState<(() => void) | null>(null);
  const [deleteAllPhotosAction, setDeleteAllPhotosAction] = useState<(() => void) | null>(null);
  const [photosHaveHidden, setPhotosHaveHidden] = useState(false);

  const dataRef = useRef<AdminDataSections>(initialData);

  useEffect(() => {
    dataRef.current = { ...dataRef.current, rootPersonId };
  }, [rootPersonId]);

  const persist = useCallback(
    () => saveToStorage(dataRef.current, bundledHash),
    [bundledHash]
  );

  const getCombinedJson = useCallback(
    () => toCombinedJson(dataRef.current),
    []
  );

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
        const merged = applyMerge(
          dataRef.current,
          merge,
          buildDefaultResolutions(merge)
        );
        saveToStorage(merged, bundledHash);
        onReload(merged);
        setAlertMessage(t('adminImportSuccess'));
        return;
      }

      setImportState({ merge, imported });
    },
    [onReload, bundledHash, t]
  );

  const handleMergeApply = useCallback(
    (resolutions: MergeResolutions) => {
      if (!importState) return;
      const merged = applyMerge(
        dataRef.current,
        importState.merge,
        resolutions
      );
      saveToStorage(merged, bundledHash);
      onReload(merged);
      setImportState(null);
      setAlertMessage(t('adminImportSuccess'));
    },
    [importState, onReload, bundledHash, t]
  );

  const handleSelectTab = useCallback(
    (id: AdminTabId) => {
      setTabCookie(id);
      const url = `${pathname ?? ''}?tab=${id}`;
      router.replace(url, { scroll: false });
    },
    [router, pathname]
  );

  const handleAddRowActionChange = useCallback((action: (() => void) | null) => {
    setAddPersonRowAction(() => action);
  }, []);

  const handleDeleteSelectedRowsActionChange = useCallback((action: (() => void) | null) => {
    setDeleteSelectedRowsAction(() => action);
  }, []);

  const handlePersonsDataChange = useCallback(
    (p: Person[]) => {
      dataRef.current = { ...dataRef.current, persons: p };
      setAdminWorkingPersons(p);
      persist();
    },
    [persist]
  );

  const handleRootChange = useCallback(
    (id: string) => {
      setRootPersonId(id);
      setGlobalRoot(id);
      dataRef.current = { ...dataRef.current, rootPersonId: id };
      persist();
    },
    [persist, setGlobalRoot]
  );

  const handleAddTextEntryActionChange = useCallback((action: (() => void) | null) => {
    setAddTextEntryAction(() => action);
  }, []);

  const handleHistoryChange = useCallback(
    (h: HistoryEntry[]) => {
      dataRef.current = { ...dataRef.current, history: h };
      persist();
    },
    [persist]
  );

  const handleRefreshPhotosActionChange = useCallback((action: (() => void) | null) => {
    setRefreshPhotosAction(() => action);
  }, []);

  const handleTogglePhotosVisibilityActionChange = useCallback((action: (() => void) | null) => {
    setTogglePhotosVisibilityAction(() => action);
  }, []);

  const handleDeleteAllPhotosActionChange = useCallback((action: (() => void) | null) => {
    setDeleteAllPhotosAction(() => action);
  }, []);

  const handlePhotosDataChange = useCallback(
    (p: PhotoEntry[]) => {
      dataRef.current = { ...dataRef.current, photos: p };
      setPhotos(p);
      persist();
    },
    [persist]
  );

  const { setActions } = useAdminToolbar();
  useEffect(() => {
    setActions({
      onCopy: () => void handleCopy(),
      onDownload: handleDownload,
      onImport: handleImport,
    });
    return () => setActions(null);
  }, [setActions, handleCopy, handleDownload, handleImport]);

  return (
    <div className="space-y-4">
      <AdminTabs
        active={initialTab}
        onSelect={handleSelectTab}
        onAddPersonRow={initialTab === 'persons' ? addPersonRowAction : null}
        onDeleteSelectedRows={initialTab === 'persons' ? deleteSelectedRowsAction : null}
        deleteSelectedDisabled={selectedRowsCount === 0}
        onAddTextEntry={initialTab === 'texts' ? addTextEntryAction : null}
        onRefreshPhotos={initialTab === 'photos' ? refreshPhotosAction : null}
        onTogglePhotosVisibility={initialTab === 'photos' ? togglePhotosVisibilityAction : null}
        onDeleteAllPhotos={initialTab === 'photos' ? deleteAllPhotosAction : null}
        photosToggleLabel={photosHaveHidden ? t('adminShowAll') : t('adminHideAll')}
      >
        <div className={initialTab === 'persons' ? '' : 'hidden'}>
          <AdminPersonsTable
            rootPersonId={rootPersonId}
            initialPersons={initialData.persons}
            photos={photos}
            onAddRowActionChange={handleAddRowActionChange}
            onDeleteSelectedRowsActionChange={handleDeleteSelectedRowsActionChange}
            onSelectedRowsCountChange={setSelectedRowsCount}
            onDataChange={handlePersonsDataChange}
            onRootChange={handleRootChange}
          />
        </div>
        <div className={initialTab === 'texts' ? '' : 'hidden'}>
          <AdminTextsTab
            initialHistory={initialData.history}
            persons={personsForUi}
            onAddEntryActionChange={handleAddTextEntryActionChange}
            onHistoryChange={handleHistoryChange}
          />
        </div>
        <div className={initialTab === 'photos' ? '' : 'hidden'}>
          <AdminPhotosTab
            initialPhotos={initialData.photos}
            onRefreshActionChange={handleRefreshPhotosActionChange}
            onToggleVisibilityActionChange={handleTogglePhotosVisibilityActionChange}
            onDeleteAllActionChange={handleDeleteAllPhotosActionChange}
            onHasHiddenChange={setPhotosHaveHidden}
            onDataChange={handlePhotosDataChange}
          />
        </div>
      </AdminTabs>

      {importState && (
        <ImportMergeDialog
          merge={importState.merge}
          onApply={handleMergeApply}
          onCancel={() => setImportState(null)}
        />
      )}

      {alertMessage !== null && (
        <Dialog
          open
          onClose={() => setAlertMessage(null)}
          variant="alert"
          confirmLabel={t('dialogOk')}
        >
          {alertMessage}
        </Dialog>
      )}
    </div>
  );
}
