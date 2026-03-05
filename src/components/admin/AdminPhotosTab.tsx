'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getPersons } from '@/lib/data/persons';
import { getFullName } from '@/lib/utils/person';
import { useTranslations } from '@/lib/i18n/context';
import type { PhotoCategory, PhotoEntry } from '@/lib/types/photo';
import { Eye, EyeOff } from 'lucide-react';
import { Button, Input, Select } from '@/components/ui/atoms';
import { Dialog } from '@/components/ui/molecules/Dialog';

const DRAG_THRESHOLD_PX = 5;

function pxToPercent(value: number, total: number): number {
  return total > 0 ? Math.max(0, Math.min(100, (value / total) * 100)) : 0;
}

function slugFromSrc(src: string): string {
  return src.replace(/^\/photos\//, '').replace(/\//g, '-').replace(/\.(jpg|jpeg|png|gif|webp)$/i, '') || 'photo';
}

function isNew(photo: PhotoEntry): boolean {
  const hasCaption = Boolean(photo.caption?.trim());
  const hasPeople = Boolean(photo.people?.length);
  if (hasCaption || hasPeople) return false;
  return true;
}

interface AdminPhotosTabProps {
  initialPhotos: PhotoEntry[];
  onDataChange?: (photos: PhotoEntry[]) => void;
}

type PeopleEditorState = { photoIdx: number; personIdx: number | null };

const CUSTOM_PERSON_VALUE = '__custom__';

export function AdminPhotosTab({ initialPhotos, onDataChange }: AdminPhotosTabProps) {
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
        <Button variant="secondary" onClick={() => window.location.reload()}>
          {t('adminRefreshList')}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 160px)' }}>
      <div className="flex shrink-0 flex-wrap gap-2 pb-3">
        <Button variant="secondary" onClick={() => window.location.reload()}>
          {t('adminRefreshList')}
        </Button>
        {photos.some((p) => p.hidden) ? (
          <Button variant="secondary" onClick={() => setBulkAction('showAll')} className="gap-1.5">
            <Eye className="size-4" /> {t('adminShowAll')}
          </Button>
        ) : (
          <Button variant="secondary" onClick={() => setBulkAction('hideAll')} className="gap-1.5">
            <EyeOff className="size-4" /> {t('adminHideAll')}
          </Button>
        )}
        <Button variant="danger" onClick={() => setBulkAction('deleteAll')} size="md">
          {t('adminDeleteAll')}
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-1">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-3">
        {photos.map((photo, idx) => (
          <div key={photo.src} className="relative">
            <Button
              variant="secondary"
              onClick={() => setSelectedPhotoIdx(idx)}
              className={`relative w-full overflow-hidden rounded-lg border-2 border-(--border-subtle) bg-(--paper) p-0 aspect-3/4 hover:border-(--accent) hover:shadow-lg ${photo.hidden ? 'opacity-40' : ''}`}
            >
              <span className="block aspect-3/4 w-full overflow-hidden bg-(--paper-light)">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.src}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </span>
              {isNew(photo) && (
                <span className="absolute left-1 top-1 rounded bg-amber-500 px-1.5 py-0.5 text-xs font-medium text-white shadow">
                  {t('adminNew')}
                </span>
              )}
            </Button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setConfirmDeleteIdx(idx); }}
              className="absolute right-1 top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white shadow hover:bg-red-700"
              title={t('adminRemove')}
              aria-label={t('adminRemove')}
            >
              ✕
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); updatePhoto(idx, 'hidden', !photo.hidden); }}
              className={`absolute bottom-6 right-1 z-10 flex h-5 w-5 items-center justify-center rounded-full shadow ${photo.hidden ? 'bg-(--ink-muted) text-white' : 'bg-white/80 text-(--ink)'}`}
              title={photo.hidden ? t('adminShow') : t('adminHide')}
              aria-label={photo.hidden ? t('adminShow') : t('adminHide')}
            >
              {photo.hidden ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
            </button>
            <span className="mt-0.5 block truncate text-center text-xs leading-tight text-(--ink-muted)" title={photo.src}>
              {photo.src.split('/').pop()}
            </span>
          </div>
        ))}
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
          <p className="text-sm text-[var(--ink)]">{t('adminDeletePhotoConfirm')}</p>
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
          <p className="text-sm text-[var(--ink)]">
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

interface PhotoEditLightboxProps {
  photo: PhotoEntry;
  photoIdx: number;
  persons: ReturnType<typeof getPersons>;
  existingSeries: string[];
  onUpdate: (field: keyof PhotoEntry, value: unknown) => void;
  onOpenAddPerson: () => void;
  onOpenEditPerson: (personIdx: number) => void;
  onRemovePerson: (photoIdx: number, personIdx: number) => void;
  onClose: () => void;
  faceEditMode?: boolean;
  editingPersonId?: string;
  editingLabel?: string;
  editingCoords?: number[];
  onEditingPersonIdChange?: (id: string) => void;
  onEditingLabelChange?: (value: string) => void;
  onEditingCoordsChange?: (coords: number[]) => void;
  onSavePerson?: () => void;
  onCancelPerson?: () => void;
  isAddMode?: boolean;
}

const SERIES_NEW_VALUE = '__new__';

function SeriesControl({
  value,
  existingSeries,
  onChange,
}: {
  value: string;
  existingSeries: string[];
  onChange: (v: string) => void;
}) {
  const t = useTranslations();
  const [isCustom, setIsCustom] = useState(
    () => value !== '' && !existingSeries.includes(value)
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSelect = (v: string) => {
    if (v === SERIES_NEW_VALUE) {
      setIsCustom(true);
      onChange('');
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      setIsCustom(false);
      onChange(v);
    }
  };

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-(--ink)">
        {t('adminPhotoSeries')}
      </label>
      <Select
        value={isCustom ? SERIES_NEW_VALUE : value}
        onChange={(e) => handleSelect(e.target.value)}
        className="bg-[var(--paper)] px-3 py-2"
      >
        <option value="">&mdash;</option>
        {existingSeries.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
        <option value={SERIES_NEW_VALUE}>+ {t('adminPhotoSeriesPlaceholder')}</option>
      </Select>
      {isCustom && (
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t('adminPhotoSeriesPlaceholder')}
          className="mt-2 bg-[var(--paper)] px-3 py-2"
        />
      )}
    </div>
  );
}

function PhotoEditLightbox({
  photo,
  photoIdx,
  persons,
  existingSeries,
  onUpdate,
  onOpenAddPerson,
  onOpenEditPerson,
  onRemovePerson,
  onClose,
  faceEditMode = false,
  editingPersonId = '',
  editingLabel = '',
  editingCoords = [],
  onEditingPersonIdChange,
  onEditingLabelChange,
  onEditingCoordsChange,
  onSavePerson,
  onCancelPerson,
  isAddMode = false,
}: PhotoEditLightboxProps) {
  const t = useTranslations();
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const [firstPoint, setFirstPoint] = useState<{ x: number; y: number } | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; clientX: number; clientY: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [liveRect, setLiveRect] = useState<number[] | null>(null);

  const getPoint = useCallback(
    (e: React.MouseEvent<HTMLDivElement>): { x: number; y: number } => {
      const rect = leftPanelRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      const x = pxToPercent(e.clientX - rect.left, rect.width);
      const y = pxToPercent(e.clientY - rect.top, rect.height);
      return { x, y };
    },
    []
  );

  const commitRect = useCallback(
    (a: { x: number; y: number }, b: { x: number; y: number }) => {
      const left = Math.min(a.x, b.x);
      const top = Math.min(a.y, b.y);
      const right = Math.max(a.x, b.x);
      const bottom = Math.max(a.y, b.y);
      const coords = [left, top, right, bottom];
      onEditingCoordsChange?.(coords);
      setFirstPoint(null);
      setLiveRect(null);
    },
    [onEditingCoordsChange]
  );

  const handleLeftMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!faceEditMode || e.button !== 0) return;
      const pt = getPoint(e);
      setDragStart({ ...pt, clientX: e.clientX, clientY: e.clientY });
      setIsDragging(false);
    },
    [faceEditMode, getPoint]
  );

  const handleLeftMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!faceEditMode || !dragStart) return;
      const pt = getPoint(e);
      const dist = Math.sqrt(
        (e.clientX - dragStart.clientX) ** 2 + (e.clientY - dragStart.clientY) ** 2
      );
      if (!isDragging && dist > DRAG_THRESHOLD_PX) {
        setIsDragging(true);
      }
      if (isDragging) {
        const left = Math.min(dragStart.x, pt.x);
        const top = Math.min(dragStart.y, pt.y);
        const right = Math.max(dragStart.x, pt.x);
        const bottom = Math.max(dragStart.y, pt.y);
        setLiveRect([left, top, right, bottom]);
      }
    },
    [faceEditMode, dragStart, isDragging, getPoint]
  );

  const handleLeftMouseUp = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!faceEditMode || e.button !== 0) return;
      const pt = getPoint(e);
      if (isDragging && dragStart) {
        commitRect(dragStart, pt);
        setDragStart(null);
        setIsDragging(false);
        return;
      }
      if (firstPoint) {
        commitRect(firstPoint, pt);
        setFirstPoint(null);
      } else {
        setFirstPoint(pt);
      }
      setDragStart(null);
      setLiveRect(null);
    },
    [faceEditMode, firstPoint, isDragging, dragStart, getPoint, commitRect]
  );

  const handleLeftMouseLeave = useCallback(() => {
    if (!isDragging) return;
    setDragStart(null);
    setIsDragging(false);
    setLiveRect(null);
  }, [isDragging]);

  const displayCoords = liveRect ?? (editingCoords.length >= 4 ? editingCoords : null);
  const hasFirstPoint = firstPoint !== null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/85 p-4"
      role="dialog"
      aria-modal
      aria-label={t('adminCaption')}
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[95vh] w-full max-w-5xl flex-row gap-4 overflow-hidden rounded-xl border border-(--border) bg-(--paper) p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute right-3 top-3 p-1 text-2xl leading-none"
          aria-label={t('adminCancel')}
        >
          ×
        </Button>

        <div className="relative flex min-h-0 min-w-0 flex-1 items-center justify-center rounded-lg bg-(--paper-light) p-2">
          <button
            type="button"
            onClick={() => onUpdate('hidden', !photo.hidden)}
            className={`absolute bottom-3 right-3 z-10 flex h-7 w-7 items-center justify-center rounded-full shadow ${photo.hidden ? 'bg-[var(--ink-muted)] text-white' : 'bg-white/80 text-[var(--ink)]'}`}
            title={photo.hidden ? t('adminShow') : t('adminHide')}
            aria-label={photo.hidden ? t('adminShow') : t('adminHide')}
          >
            {photo.hidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
          <div
            ref={leftPanelRef}
            className={`relative inline-block max-h-[85vh] max-w-full ${faceEditMode ? 'cursor-crosshair' : ''}`}
            onMouseDown={faceEditMode ? handleLeftMouseDown : undefined}
            onMouseMove={faceEditMode ? handleLeftMouseMove : undefined}
            onMouseUp={faceEditMode ? handleLeftMouseUp : undefined}
            onMouseLeave={faceEditMode ? handleLeftMouseLeave : undefined}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.src}
              alt=""
              className="block max-h-[85vh] max-w-full select-none object-contain pointer-events-none"
              draggable={false}
            />
            {faceEditMode && hasFirstPoint && (
              <div
                className="absolute pointer-events-none h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[var(--accent)] shadow-md"
                style={{ left: `${firstPoint.x}%`, top: `${firstPoint.y}%` }}
              />
            )}
            {faceEditMode && displayCoords && displayCoords.length >= 4 && (
              <div
                className="absolute pointer-events-none border-2 border-[var(--accent)] bg-[var(--hotspot-fill)]"
                style={{
                  left: `${displayCoords[0]}%`,
                  top: `${displayCoords[1]}%`,
                  width: `${displayCoords[2]! - displayCoords[0]!}%`,
                  height: `${displayCoords[3]! - displayCoords[1]!}%`,
                }}
              />
            )}
          </div>
        </div>

        <div className="flex w-80 shrink-0 flex-col gap-4 overflow-y-auto pt-12">
          <div>
            <label className="mb-1 block text-sm font-medium text-(--ink)">
              {t('adminCaption')}
            </label>
            <Input
              type="text"
              value={photo.caption ?? ''}
              onChange={(e) => onUpdate('caption', e.target.value)}
              placeholder={t('adminCaptionPlaceholder')}
              className="bg-[var(--paper)] px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-(--ink)">
              {t('adminPhotoCategory')}
            </label>
            <Select
              value={photo.category ?? 'related'}
              onChange={(e) => onUpdate('category', e.target.value as PhotoCategory)}
              className="bg-[var(--paper)] px-3 py-2"
            >
              <option value="personal">{t('adminPhotoPersonal')}</option>
              <option value="group">{t('adminPhotoGroup')}</option>
              <option value="related">{t('adminPhotoRelated')}</option>
            </Select>
          </div>

          <SeriesControl
            value={photo.series ?? ''}
            existingSeries={existingSeries}
            onChange={(v) => onUpdate('series', v || undefined)}
          />

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-(--ink)">
                {t('adminPeopleOnPhoto')}
              </span>
              {!faceEditMode && (
                <Button variant="ghost" size="sm" onClick={onOpenAddPerson} className="text-sm text-[var(--accent)] hover:underline">
                  {t('adminAdd')}
                </Button>
              )}
            </div>
            {faceEditMode ? (
              <div className="space-y-3 rounded border border-(--border-subtle) bg-(--paper-light) p-3">
                <p className="text-xs text-(--ink-muted)">{t('adminPhotoFaceRectHint')}</p>
                <div>
                  <label className="mb-1 block text-sm font-medium text-(--ink)">
                    {t('adminPhotoPersonId')}
                  </label>
                  <Select
                    value={editingPersonId}
                    onChange={(e) => onEditingPersonIdChange?.(e.target.value)}
                    className="bg-[var(--paper)] px-3 py-2 w-full"
                  >
                    {(() => {
                      const sorted = [...persons].sort((a, b) =>
                        (getFullName(a) || a.id).localeCompare(getFullName(b) || b.id)
                      );
                      const groups: { letter: string; items: typeof sorted }[] = [];
                      for (const p of sorted) {
                        const letter = (p.lastName || getFullName(p) || p.id).charAt(0).toUpperCase();
                        const last = groups[groups.length - 1];
                        if (last && last.letter === letter) {
                          last.items.push(p);
                        } else {
                          groups.push({ letter, items: [p] });
                        }
                      }
                      return groups.map((g) => (
                        <optgroup key={g.letter} label={g.letter}>
                          {g.items.map((p) => (
                            <option key={p.id} value={p.id}>
                              {getFullName(p) || p.id}
                            </option>
                          ))}
                        </optgroup>
                      ));
                    })()}
                    <option value={CUSTOM_PERSON_VALUE}>{t('adminPhotoCustomName')}</option>
                  </Select>
                </div>
                {editingPersonId === CUSTOM_PERSON_VALUE && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-(--ink)">
                      {t('adminPhotoCustomNameLabel')}
                    </label>
                    <Input
                      type="text"
                      value={editingLabel}
                      onChange={(e) => onEditingLabelChange?.(e.target.value)}
                      placeholder={t('adminPhotoCustomNamePlaceholder')}
                      className="bg-[var(--paper)] px-3 py-2 w-full"
                    />
                  </div>
                )}
                <div className="flex gap-2">
                  <Button variant="primary" size="sm" onClick={onSavePerson}>
                    {t('adminDone')}
                  </Button>
                  <Button variant="secondary" size="sm" onClick={onCancelPerson}>
                    {t('adminCancel')}
                  </Button>
                </div>
              </div>
            ) : (
              <ul className="space-y-1">
                {(photo.people ?? []).map((person, personIdx) => {
                  const displayName = person.personId
                    ? (persons.find((p) => p.id === person.personId)
                        ? getFullName(persons.find((p) => p.id === person.personId)!)
                        : person.personId)
                    : (person.label ?? '—');
                  return (
                    <li
                      key={personIdx}
                      className="flex flex-wrap items-center gap-2 rounded border border-(--border-subtle) px-2 py-1.5 text-sm"
                    >
                      <span className="text-(--ink)">
                        {displayName}
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => onOpenEditPerson(personIdx)} className="text-[var(--accent)] hover:underline">
                        {t('adminEdit')}
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => onRemovePerson(photoIdx, personIdx)}>
                        ✕
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="mt-auto flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={onClose}>
              {t('adminCancel')}
            </Button>
            <Button variant="primary" onClick={onClose}>
              {t('adminDone')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

