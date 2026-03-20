'use client';

import { useTranslations } from '@/lib/i18n/context';
import type { PhotoEntry } from '@/lib/types/photo';
import { Button } from '@/components/ui/atoms';
import { Dialog } from '@/components/ui/molecules/Dialog';
import { PhotoEditLightbox } from './PhotoEditLightbox';
import { AdminPhotosGroups } from './AdminPhotosGroups';
import { useAdminPhotosModel } from './useAdminPhotosModel';

interface AdminPhotosTabProps {
  initialPhotos: PhotoEntry[];
  onDataChange?: (photos: PhotoEntry[]) => void;
  onRefreshActionChange?: (action: (() => void) | null) => void;
  onToggleVisibilityActionChange?: (action: (() => void) | null) => void;
  onDeleteAllActionChange?: (action: (() => void) | null) => void;
  onHasHiddenChange?: (hasHidden: boolean) => void;
}

export function AdminPhotosTab({
  initialPhotos,
  onDataChange,
  onRefreshActionChange,
  onToggleVisibilityActionChange,
  onDeleteAllActionChange,
  onHasHiddenChange,
}: AdminPhotosTabProps) {
  const t = useTranslations();
  const {
    loading,
    photos,
    persons,
    existingSeries,
    groups,
    photoIdxBySrc,
    backIdxByFrontSrc,
    selectedPhotoIdx,
    setSelectedPhotoIdx,
    confirmDeleteIdx,
    setConfirmDeleteIdx,
    bulkAction,
    setBulkAction,
    executeBulkAction,
    updatePhoto,
    removePhoto,
    removePersonFromPhoto,
    peopleEditor,
    setPeopleEditor,
    editingPersonId,
    setEditingPersonId,
    editingLabel,
    setEditingLabel,
    editingCoords,
    setEditingCoords,
    openAddPerson,
    openEditPerson,
    handleSaveEditedPerson,
    refreshPhotos,
  } = useAdminPhotosModel({
    initialPhotos,
    t,
    onDataChange,
    onRefreshActionChange,
    onToggleVisibilityActionChange,
    onDeleteAllActionChange,
    onHasHiddenChange,
  });

  if (loading) {
    return (
      <div className="py-8 text-center text-(--ink-muted)">
        {t('adminPhotosScanning')}
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-(--ink-muted)">{t('adminPhotosNoPhotos')}</p>
        <Button variant="secondary" onClick={refreshPhotos}>
          {t('adminRefreshList')}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-140px)] flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto pb-1">
        <div className="space-y-4">
          <AdminPhotosGroups
            groups={groups}
            backIdxByFrontSrc={backIdxByFrontSrc}
            photoIdxBySrc={photoIdxBySrc}
            t={t}
            onSelectPhotoIdx={setSelectedPhotoIdx}
            onSetConfirmDeleteIdx={setConfirmDeleteIdx}
            onUpdatePhoto={updatePhoto}
          />
        </div>
      </div>
      {confirmDeleteIdx !== null && (
        <Dialog
          open
          onClose={() => setConfirmDeleteIdx(null)}
          title={t('adminRemove')}
          variant="confirm"
          confirmLabel={t('adminRemove')}
          cancelLabel={t('adminCancel')}
          onConfirm={() => removePhoto(confirmDeleteIdx)}
        >
          <p className="text-sm text-(--ink)">{t('adminDeletePhotoConfirm')}</p>
        </Dialog>
      )}
      {bulkAction !== null && (
        <Dialog
          open
          onClose={() => setBulkAction(null)}
          title={bulkAction === 'deleteAll' ? t('adminDeleteAll') : bulkAction === 'showAll' ? t('adminShowAll') : t('adminHideAll')}
          variant="confirm"
          confirmLabel={t('dialogConfirm')}
          cancelLabel={t('adminCancel')}
          onConfirm={executeBulkAction}
        >
          <p className="text-sm text-(--ink)">
            {bulkAction === 'deleteAll'
              ? t('adminDeleteAllConfirm')
              : bulkAction === 'showAll'
                ? t('adminShowAllConfirm')
                : t('adminHideAllConfirm')}
          </p>
        </Dialog>
      )}

      {selectedPhotoIdx !== null && (
        <PhotoEditLightbox
          photo={photos[selectedPhotoIdx]!}
          photoIdx={selectedPhotoIdx}
          persons={persons}
          existingSeries={existingSeries}
          onUpdate={(field, value) => updatePhoto(selectedPhotoIdx, field, value)}
          onOpenAddPerson={openAddPerson}
          onOpenEditPerson={openEditPerson}
          onRemovePerson={removePersonFromPhoto}
          onClose={() => setSelectedPhotoIdx(null)}
          faceEditMode={
            peopleEditor !== null && peopleEditor.photoIdx === selectedPhotoIdx
          }
          editingPersonId={editingPersonId}
          editingLabel={editingLabel}
          editingCoords={editingCoords}
          onEditingPersonIdChange={setEditingPersonId}
          onEditingLabelChange={setEditingLabel}
          onEditingCoordsChange={setEditingCoords}
          onSavePerson={handleSaveEditedPerson}
          onCancelPerson={() => setPeopleEditor(null)}
          isAddMode={peopleEditor !== null && peopleEditor.personIdx === null}
        />
      )}
    </div>
  );
}
