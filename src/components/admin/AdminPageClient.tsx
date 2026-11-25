'use client';

import { useCallback, useMemo, useRef, useState, type RefObject } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from '@/lib/i18n/context';
import { usePersons } from '@/hooks/usePersons';
import { useSetRootPersonId } from '@/lib/contexts/RootPersonContext';
import type { AdminTabId } from './AdminTabs';
import { AdminTabs } from './AdminTabs';
import { AdminPersonsTable } from './AdminPersonsTable';
import { AdminTextsTab } from './AdminTextsTab';
import { AdminPhotosTab } from './AdminPhotosTab';
import { ImportMergeDialog } from './ImportMergeDialog';
import { Dialog } from '@/components/ui/molecules/Dialog';
import type { Person } from '@/lib/types/person';
import type { HistoryEntry } from '@/lib/types/history';
import type { PhotoEntry } from '@/lib/types/photo';
import type { GeocodedPoint } from '@/lib/constants/map';
import type { LineDynamicsDataset } from '@/lib/types/lineDynamics';
import { setTabCookie, type AdminDataSections } from './adminPageClientUtils';
import { useAdminPageBootstrap } from './useAdminPageBootstrap';
import { useAdminPageState } from './useAdminPageState';
import { useAdminImportFlow } from './useAdminImportFlow';
import { useAdminToolbarBindings } from './useAdminToolbarBindings';
import { UNSAVED_BASELINE, useUnsavedChangesGuard } from './useUnsavedChangesGuard';
import { hashData } from '@/lib/utils/dataMerge';

interface AdminPageClientProps {
  readonly rootPersonId: string;
  readonly persons: Person[];
  readonly photos: PhotoEntry[];
  readonly history: HistoryEntry[];
  readonly placeFallbacks: Record<string, GeocodedPoint>;
  readonly lineDynamics: LineDynamicsDataset;
  readonly initialTab: AdminTabId;
}

/**
 * Outer shell: resolves initial data from server props and remounts the editors when
 * imported data replaces it. Owns the "last exported state" baseline so it survives remounts.
 */
export function AdminPageClient({
  rootPersonId: serverRoot,
  persons: serverPersons,
  photos: serverPhotos,
  history: serverHistory,
  placeFallbacks: serverPlaceFallbacks,
  lineDynamics: serverLineDynamics,
  initialTab,
}: AdminPageClientProps) {
  const serverData = useMemo<AdminDataSections>(
    () => ({
      rootPersonId: serverRoot,
      persons: serverPersons,
      photos: serverPhotos,
      history: serverHistory,
      placeFallbacks: serverPlaceFallbacks,
      lineDynamics: serverLineDynamics,
    }),
    [
      serverRoot,
      serverPersons,
      serverPhotos,
      serverHistory,
      serverPlaceFallbacks,
      serverLineDynamics,
    ]
  );
  const { initialData, dataVersion, handleReload } = useAdminPageBootstrap(serverData);
  // null = take the baseline once the editors have mounted (see useUnsavedChangesGuard).
  const baselineHashRef = useRef<string | null>(null);

  const handleImportedReload = useCallback(
    (data: AdminDataSections) => {
      // Imported data is not in data.json yet: it stays "unsaved" until exported.
      baselineHashRef.current = UNSAVED_BASELINE;
      handleReload(data);
    },
    [handleReload]
  );

  return (
    <AdminPageClientInner
      key={dataVersion}
      initialData={initialData}
      initialTab={initialTab}
      baselineHashRef={baselineHashRef}
      onReload={handleImportedReload}
    />
  );
}

interface InnerProps {
  readonly initialData: AdminDataSections;
  readonly initialTab: AdminTabId;
  readonly baselineHashRef: RefObject<string | null>;
  readonly onReload: (data: AdminDataSections) => void;
}

function AdminPageClientInner({
  initialData,
  initialTab,
  baselineHashRef,
  onReload,
}: InnerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations();

  const personsForUi = usePersons();
  const setGlobalRoot = useSetRootPersonId();
  const {
    rootPersonId,
    photos,
    placeFallbacks,
    photosHaveHidden,
    setPhotosHaveHidden,
    selectedRowsCount,
    setSelectedRowsCount,
    addPersonRowAction,
    deleteSelectedRowsAction,
    addTextEntryAction,
    refreshPhotosAction,
    togglePhotosVisibilityAction,
    deleteAllPhotosAction,
    dataRef,
    handleAddRowActionChange,
    handleDeleteSelectedRowsActionChange,
    handlePersonsDataChange,
    handleRootChange,
    handleAddTextEntryActionChange,
    handleHistoryChange,
    handleRefreshPhotosActionChange,
    handleTogglePhotosVisibilityActionChange,
    handleDeleteAllPhotosActionChange,
    handlePhotosDataChange,
    handlePlaceFallbacksChange,
  } = useAdminPageState({ initialData, setGlobalRoot });
  // The photo editor rewrites its list after the async folder scan; only then is the data "as loaded".
  const [photosReady, setPhotosReady] = useState(false);
  useUnsavedChangesGuard({
    dataRef,
    baselineHashRef,
    ready: photosReady,
    confirmMessage: t('adminUnsavedChangesConfirm'),
  });
  const handleExported = useCallback(() => {
    baselineHashRef.current = hashData(dataRef.current);
  }, [baselineHashRef, dataRef]);
  const {
    alertMessage,
    setAlertMessage,
    importState,
    setImportState,
    handleCopy,
    handleDownload,
    handleImport,
    handleMergeApply,
  } = useAdminImportFlow({
    dataRef,
    onReload,
    onExported: handleExported,
    t,
  });

  const handleSelectTab = useCallback(
    (id: AdminTabId) => {
      setTabCookie(id);
      const url = `${pathname ?? ''}?tab=${id}`;
      router.replace(url, { scroll: false });
    },
    [router, pathname]
  );
  useAdminToolbarBindings({ handleCopy, handleDownload, handleImport });

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
            placeFallbacks={placeFallbacks}
            onAddRowActionChange={handleAddRowActionChange}
            onDeleteSelectedRowsActionChange={handleDeleteSelectedRowsActionChange}
            onSelectedRowsCountChange={setSelectedRowsCount}
            onDataChange={handlePersonsDataChange}
            onRootChange={handleRootChange}
            onPlaceFallbacksChange={handlePlaceFallbacksChange}
          />
        </div>
        <div className={initialTab === 'texts' ? '' : 'hidden'}>
          <AdminTextsTab
            initialHistory={initialData.history}
            persons={personsForUi}
            photos={photos}
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
            onReadyChange={setPhotosReady}
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
