'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from '@/lib/i18n/context';
import { usePersonsOverlayRevision } from '@/hooks/usePersonsOverlayRevision';
import { getPersons } from '@/lib/data/persons';
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
import {
  saveToStorage,
  setTabCookie,
  type AdminDataSections,
} from './adminPageClientUtils';
import { useAdminPageBootstrap } from './useAdminPageBootstrap';
import { useAdminPageState } from './useAdminPageState';
import { useAdminImportFlow } from './useAdminImportFlow';
import { useAdminToolbarBindings } from './useAdminToolbarBindings';

interface AdminPageClientProps {
  readonly rootPersonId: string;
  readonly persons: Person[];
  readonly photos: PhotoEntry[];
  readonly history: HistoryEntry[];
  readonly placeFallbacks: Record<string, GeocodedPoint>;
  readonly initialTab: AdminTabId;
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
  placeFallbacks: serverPlaceFallbacks,
  initialTab,
}: AdminPageClientProps) {
  const serverData = useMemo<AdminDataSections>(
    () => ({
      rootPersonId: serverRoot,
      persons: serverPersons,
      photos: serverPhotos,
      history: serverHistory,
      placeFallbacks: serverPlaceFallbacks,
    }),
    [serverRoot, serverPersons, serverPhotos, serverHistory, serverPlaceFallbacks]
  );
  const {
    serverHash,
    initialData,
    dataVersion,
    bundledConflict,
    handleReload,
    handleBundledMergeApply,
    handleBundledMergeCancel,
  } = useAdminPageBootstrap(serverData);

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
  } = useAdminPageState({
    initialData,
    bundledHash,
    setGlobalRoot,
    saveToStorage,
  });
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
    bundledHash,
    onReload,
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
