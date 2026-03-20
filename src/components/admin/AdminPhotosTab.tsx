'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getPersons } from '@/lib/data/persons';
import { splitAllPhotosForCarousels } from '@/lib/data/photos';
import { useTranslations } from '@/lib/i18n/context';
import type { PhotoEntry } from '@/lib/types/photo';
import { ChevronDown, Eye, EyeOff, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/atoms';
import { Dialog } from '@/components/ui/molecules/Dialog';
import { CUSTOM_PERSON_VALUE, PhotoEditLightbox } from './PhotoEditLightbox';

function slugFromSrc(src: string): string {
  return src.replace(/^\/photos\//, '').replace(/\//g, '-').replace(/\.(jpg|jpeg|png|gif|webp)$/i, '') || 'photo';
}

function isNew(photo: PhotoEntry): boolean {
  const hasCaption = Boolean(photo.caption?.trim());
  const hasPeople = Boolean(photo.people?.length);
  if (hasCaption || hasPeople) return false;
  return true;
}

type PhotoItem = { photo: PhotoEntry; idx: number };

const BACK_SUFFIX_RE = /_back\.(jpg|jpeg|png|gif|webp)$/i;
function isBackSrc(src: string): boolean {
  return BACK_SUFFIX_RE.test(src);
}

function getFrontSrcForBack(src: string): string {
  return src.replace(/_back\./, '.');
}

type AdminPhotoGroupProps = {
  title: string;
  items: PhotoItem[];
  backIdxByFrontSrc: Map<string, number>;
  photoIdxBySrc: Map<string, number>;
  t: (key: string, params?: Record<string, string | number>) => string;
  onSelectPhotoIdx: (idx: number) => void;
  onSetConfirmDeleteIdx: (idx: number) => void;
  onUpdatePhoto: (index: number, field: keyof PhotoEntry, value: unknown) => void;
};

function AdminPhotoGroup({
  title,
  items,
  backIdxByFrontSrc,
  photoIdxBySrc,
  t,
  onSelectPhotoIdx,
  onSetConfirmDeleteIdx,
  onUpdatePhoto,
}: AdminPhotoGroupProps) {
  const defaultExpanded = false;
  const [expanded, setExpanded] = useState(defaultExpanded);

  const countLabel = useMemo(() => {
    const n = items.length;
    return n === 1 ? '1' : String(n);
  }, [items.length]);

  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      <button
        type="button"
        className="group inline-flex items-center gap-2 rounded px-1 py-0.5 text-left"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <span className="inline-flex items-center gap-0.5 text-sm font-medium text-(--ink-muted) group-hover:text-(--ink)">
          {title}
          <span className="ml-1 text-xs text-(--ink-muted)/80">({countLabel})</span>
          <ChevronDown
            className={`size-4 text-(--ink-muted) transition-transform ${
              expanded ? 'rotate-0' : '-rotate-90'
            }`}
            aria-hidden
          />
        </span>
      </button>

      {expanded && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-3">
          {items.map(({ photo, idx }) => {
            const backIdx =
              backIdxByFrontSrc.get(photo.src) ??
              (photo.backSrc ? photoIdxBySrc.get(photo.backSrc) : undefined);

            return (
              <div key={photo.src} className="relative">
                <Button
                  variant="secondary"
                  onClick={() => onSelectPhotoIdx(idx)}
                  className={`relative w-full overflow-hidden rounded-lg border-2 border-(--border-subtle) bg-(--paper) p-0 aspect-3/4 hover:border-(--accent) hover:shadow-lg ${
                    photo.hidden ? 'opacity-40' : ''
                  }`}
                >
                  <span className="block aspect-3/4 w-full overflow-hidden bg-(--paper-light)">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.src} alt="" className="h-full w-full object-cover" />
                  </span>

                  {backIdx !== undefined && (
                    <span
                      role="presentation"
                      onClick={(e) => {
                        // Prevent triggering the photo-card click (which opens the lightbox).
                        e.stopPropagation();
                        onSelectPhotoIdx(backIdx);
                      }}
                      className="absolute bottom-0.5 right-0.5 flex cursor-pointer items-center justify-center rounded bg-black/50 p-0.5"
                      aria-label={t('adminEditBack')}
                      title={t('adminEditBack')}
                    >
                      <RotateCw className="size-3.5 text-white" aria-hidden />
                    </span>
                  )}

                  {isNew(photo) && (
                    <span className="absolute left-1 top-1 rounded bg-amber-500 px-1.5 py-0.5 text-xs font-medium text-white shadow">
                      {t('adminNew')}
                    </span>
                  )}
                </Button>

                <span
                  role="presentation"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSetConfirmDeleteIdx(idx);
                  }}
                  className="absolute right-1 top-1 z-10 flex cursor-pointer items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white shadow hover:bg-red-700"
                  title={t('adminRemove')}
                  aria-label={t('adminRemove')}
                >
                  ✕
                </span>

                <span
                  role="presentation"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdatePhoto(idx, 'hidden', !photo.hidden);
                  }}
                  className={`absolute bottom-6 right-1 z-10 flex cursor-pointer h-5 w-5 items-center justify-center rounded-full border border-(--border-subtle) shadow ${
                    photo.hidden ? 'bg-(--ink-muted) text-white' : 'bg-(--paper-light) text-(--ink)'
                  }`}
                  title={photo.hidden ? t('adminShow') : t('adminHide')}
                  aria-label={photo.hidden ? t('adminShow') : t('adminHide')}
                >
                  {photo.hidden ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                </span>

                <span
                  className="mt-0.5 block truncate text-center text-xs leading-tight text-(--ink-muted)"
                  title={photo.src}
                >
                  {photo.src.split('/').pop()}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface AdminPhotosTabProps {
  initialPhotos: PhotoEntry[];
  onDataChange?: (photos: PhotoEntry[]) => void;
  onRefreshActionChange?: (action: (() => void) | null) => void;
  onToggleVisibilityActionChange?: (action: (() => void) | null) => void;
  onDeleteAllActionChange?: (action: (() => void) | null) => void;
  onHasHiddenChange?: (hasHidden: boolean) => void;
}

type PeopleEditorState = { photoIdx: number; personIdx: number | null };

export function AdminPhotosTab({
  initialPhotos,
  onDataChange,
  onRefreshActionChange,
  onToggleVisibilityActionChange,
  onDeleteAllActionChange,
  onHasHiddenChange,
}: AdminPhotosTabProps) {
  const t = useTranslations();
  const [loading, setLoading] = useState(true);
  const [selectedPhotoIdx, setSelectedPhotoIdx] = useState<number | null>(null);
  const [confirmDeleteIdx, setConfirmDeleteIdx] = useState<number | null>(null);
  const [bulkAction, setBulkAction] = useState<'showAll' | 'hideAll' | 'deleteAll' | null>(null);
  const [peopleEditor, setPeopleEditor] = useState<PeopleEditorState | null>(null);
  const [editingPersonId, setEditingPersonId] = useState('');
  const [editingLabel, setEditingLabel] = useState('');
  const [editingCoords, setEditingCoords] = useState<number[]>([]);
  const [photos, setPhotos] = useState<PhotoEntry[]>(() =>
    structuredClone(initialPhotos.length > 0 ? initialPhotos : [])
  );
  const persons = getPersons();
  const existingSeries = useMemo(
    () => [...new Set(photos.map((p) => p.series).filter(Boolean) as string[])].sort(),
    [photos]
  );

  const photoIdxBySrc = useMemo(
    () => new Map(photos.map((p, idx) => [p.src, idx] as const)),
    [photos]
  );

  const backIdxByFrontSrc = useMemo(() => {
    const map = new Map<string, number>();
    photos.forEach((p, idx) => {
      if (!isBackSrc(p.src)) return;
      const frontSrc = getFrontSrcForBack(p.src);
      // Use the first matching back; data.json typically contains only one.
      if (!map.has(frontSrc)) map.set(frontSrc, idx);
    });
    return map;
  }, [photos]);

  const toItems = useCallback(
    (list: PhotoEntry[]): PhotoItem[] =>
      list
        .map((photo) => {
          const idx = photoIdxBySrc.get(photo.src);
          return idx === undefined ? null : { photo, idx };
        })
        .filter((x): x is PhotoItem => x !== null),
    [photoIdxBySrc]
  );

  useEffect(() => {
    fetch('/api/admin/photos/scan')
      .then((r) => r.json())
      .then((data: { paths: string[] }) => {
        setPhotos((prev) => {
          const bySrc = new Map(prev.map((p) => [p.src, p]));
          const merged: PhotoEntry[] = [];
          for (const path of data.paths ?? []) {
            const existing = bySrc.get(path);
            if (existing) {
              merged.push(existing);
            } else {
              merged.push({
                id: slugFromSrc(path),
                src: path,
                caption: '',
                category: 'related',
                people: [],
              });
            }
          }
          return merged;
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updatePhoto = useCallback((index: number, field: keyof PhotoEntry, value: unknown) => {
    setPhotos((prev) => {
      const next = [...prev];
      next[index] = { ...next[index]!, [field]: value };
      return next;
    });
  }, []);

  const savePersonFromLightbox = useCallback(
    (
      photoIdx: number,
      personIdx: number | null,
      data: { personId?: string; label?: string; coords: number[] }
    ) => {
      setPhotos((prev) => {
        const next = [...prev];
        const photo = next[photoIdx]!;
        const people = [...(photo.people ?? [])];
        const useCustom =
          data.personId === CUSTOM_PERSON_VALUE ||
          (!data.personId && (data.label ?? '').trim());
        const entry = {
          ...(useCustom
            ? { label: (data.label ?? '').trim() || undefined }
            : { personId: data.personId }),
          coords: data.coords.length >= 4 ? data.coords : undefined,
        };
        if (personIdx === null) {
          people.push(entry);
        } else {
          people[personIdx] = { ...people[personIdx]!, ...entry };
        }
        next[photoIdx] = { ...photo, people };
        return next;
      });
      setPeopleEditor(null);
    },
    []
  );

  const removePhoto = useCallback((idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
    if (selectedPhotoIdx === idx) setSelectedPhotoIdx(null);
    else if (selectedPhotoIdx !== null && selectedPhotoIdx > idx) {
      setSelectedPhotoIdx(selectedPhotoIdx - 1);
    }
    setConfirmDeleteIdx(null);
  }, [selectedPhotoIdx]);

  const executeBulkAction = useCallback(() => {
    if (bulkAction === 'showAll') {
      setPhotos((prev) => prev.map((p) => ({ ...p, hidden: undefined })));
    } else if (bulkAction === 'hideAll') {
      setPhotos((prev) => prev.map((p) => ({ ...p, hidden: true })));
    } else if (bulkAction === 'deleteAll') {
      setPhotos([]);
      setSelectedPhotoIdx(null);
    }
    setBulkAction(null);
  }, [bulkAction]);

  const removePersonFromPhoto = useCallback((photoIdx: number, personIdx: number) => {
    setPhotos((prev) => {
      const next = [...prev];
      const photo = next[photoIdx]!;
      const people = (photo.people ?? []).filter((_, i) => i !== personIdx);
      next[photoIdx] = { ...photo, people };
      return next;
    });
  }, []);

  useEffect(() => {
    onDataChange?.(photos);
  }, [photos, onDataChange]);

  useEffect(() => {
    onHasHiddenChange?.(photos.some((p) => p.hidden));
  }, [photos, onHasHiddenChange]);

  const refreshPhotos = useCallback(() => window.location.reload(), []);
  const toggleAllVisibility = useCallback(() => {
    setBulkAction(photos.some((p) => p.hidden) ? 'showAll' : 'hideAll');
  }, [photos]);
  const deleteAllPhotos = useCallback(() => setBulkAction('deleteAll'), []);

  useEffect(() => {
    onRefreshActionChange?.(refreshPhotos);
    return () => onRefreshActionChange?.(null);
  }, [onRefreshActionChange, refreshPhotos]);

  useEffect(() => {
    onToggleVisibilityActionChange?.(toggleAllVisibility);
    return () => onToggleVisibilityActionChange?.(null);
  }, [onToggleVisibilityActionChange, toggleAllVisibility]);

  useEffect(() => {
    onDeleteAllActionChange?.(deleteAllPhotos);
    return () => onDeleteAllActionChange?.(null);
  }, [onDeleteAllActionChange, deleteAllPhotos]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (peopleEditor) setPeopleEditor(null);
        else setSelectedPhotoIdx(null);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [peopleEditor]);

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
    <div className="flex flex-col" style={{ height: 'calc(100vh - 140px)' }}>
      <div className="min-h-0 flex-1 overflow-y-auto pb-1">
        <div className="space-y-4">
          {(() => {
            const items: PhotoItem[] = photos.map((photo, idx) => ({ photo, idx }));
            const frontItems = items.filter(({ photo }) => !isBackSrc(photo.src));
            const newItems = frontItems.filter(({ photo }) => isNew(photo));
            const restPhotos = frontItems.map((i) => i.photo).filter((p) => !isNew(p));

            const split = splitAllPhotosForCarousels(restPhotos);

            const personal = toItems(split.personal);
            const group = toItems(split.group);
            const related = toItems(split.related);
            const bySeries = split.bySeries.map(({ seriesName, photos: seriesPhotos }) => ({
              seriesName,
              items: toItems(seriesPhotos),
            }));

            return (
              <>
                <AdminPhotoGroup
                  key="adminNew"
                  title={t('adminNew')}
                  items={newItems}
                  backIdxByFrontSrc={backIdxByFrontSrc}
                  photoIdxBySrc={photoIdxBySrc}
                  t={t}
                  onSelectPhotoIdx={setSelectedPhotoIdx}
                  onSetConfirmDeleteIdx={setConfirmDeleteIdx}
                  onUpdatePhoto={updatePhoto}
                />
                <AdminPhotoGroup
                  key="adminPhotoPersonal"
                  title={t('adminPhotoPersonal')}
                  items={personal}
                  backIdxByFrontSrc={backIdxByFrontSrc}
                  photoIdxBySrc={photoIdxBySrc}
                  t={t}
                  onSelectPhotoIdx={setSelectedPhotoIdx}
                  onSetConfirmDeleteIdx={setConfirmDeleteIdx}
                  onUpdatePhoto={updatePhoto}
                />
                <AdminPhotoGroup
                  key="adminPhotoGroup"
                  title={t('adminPhotoGroup')}
                  items={group}
                  backIdxByFrontSrc={backIdxByFrontSrc}
                  photoIdxBySrc={photoIdxBySrc}
                  t={t}
                  onSelectPhotoIdx={setSelectedPhotoIdx}
                  onSetConfirmDeleteIdx={setConfirmDeleteIdx}
                  onUpdatePhoto={updatePhoto}
                />
                <AdminPhotoGroup
                  key="adminPhotoRelated"
                  title={t('adminPhotoRelated')}
                  items={related}
                  backIdxByFrontSrc={backIdxByFrontSrc}
                  photoIdxBySrc={photoIdxBySrc}
                  t={t}
                  onSelectPhotoIdx={setSelectedPhotoIdx}
                  onSetConfirmDeleteIdx={setConfirmDeleteIdx}
                  onUpdatePhoto={updatePhoto}
                />
                {bySeries.map(({ seriesName, items }) => (
                  <AdminPhotoGroup
                    key={seriesName}
                    title={t('photoSeriesTitle', { name: seriesName })}
                    items={items}
                    backIdxByFrontSrc={backIdxByFrontSrc}
                    photoIdxBySrc={photoIdxBySrc}
                    t={t}
                    onSelectPhotoIdx={setSelectedPhotoIdx}
                    onSetConfirmDeleteIdx={setConfirmDeleteIdx}
                    onUpdatePhoto={updatePhoto}
                  />
                ))}
              </>
            );
          })()}
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
          onOpenAddPerson={() => {
            setPeopleEditor({ photoIdx: selectedPhotoIdx, personIdx: null });
            setEditingPersonId(persons[0]?.id ?? '');
            setEditingLabel('');
            setEditingCoords([]);
          }}
          onOpenEditPerson={(personIdx) => {
            setPeopleEditor({ photoIdx: selectedPhotoIdx, personIdx });
            const photo = photos[selectedPhotoIdx]!;
            const entry = photo.people?.[personIdx];
            const hasPerson = entry?.personId;
            setEditingPersonId(hasPerson ? entry.personId! : CUSTOM_PERSON_VALUE);
            setEditingLabel(entry?.label ?? '');
            setEditingCoords(
              entry?.coords && entry.coords.length >= 4 ? [...entry.coords] : []
            );
          }}
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
          onSavePerson={() => {
            if (peopleEditor === null) return;
            savePersonFromLightbox(peopleEditor.photoIdx, peopleEditor.personIdx, {
              personId: editingPersonId,
              label: editingLabel,
              coords: editingCoords,
            });
            setPeopleEditor(null);
          }}
          onCancelPerson={() => setPeopleEditor(null)}
          isAddMode={peopleEditor !== null && peopleEditor.personIdx === null}
        />
      )}
    </div>
  );
}
