'use client';

import { useCallback, useEffect, useState } from 'react';
import { getPersons } from '@/lib/data/persons';
import { getFullName } from '@/lib/utils/person';
import { useTranslations } from '@/lib/i18n/context';
import type { PhotoCategory, PhotoEntry, PhotoPersonShape } from '@/lib/types/photo';
import { PhotoHotspotEditor } from './PhotoHotspotEditor';
import { Button, Input, Select } from '@/components/ui/atoms';

const DRAWABLE_SHAPES: PhotoPersonShape[] = ['point', 'circle', 'rect'];

function slugFromSrc(src: string): string {
  return src.replace(/^\/photos\//, '').replace(/\//g, '-').replace(/\.(jpg|jpeg|png|gif|webp)$/i, '') || 'photo';
}

function isNew(photo: PhotoEntry): boolean {
  const hasCaption = Boolean(photo.caption?.trim());
  const hasPerson = Boolean(photo.personId);
  const hasPeople = Boolean(photo.people?.length);
  const cat = photo.category ?? 'related';
  if (cat === 'personal' && hasPerson) return false;
  if (cat === 'group' && hasPeople) return false;
  if (hasCaption || hasPerson || hasPeople) return false;
  return true;
}

interface AdminPhotosTabProps {
  initialPhotos: PhotoEntry[];
  onDataChange?: (photos: PhotoEntry[]) => void;
}

type PeopleEditorState = { photoIdx: number; personIdx: number | null };

export function AdminPhotosTab({ initialPhotos, onDataChange }: AdminPhotosTabProps) {
  const t = useTranslations();
  const [loading, setLoading] = useState(true);
  const [selectedPhotoIdx, setSelectedPhotoIdx] = useState<number | null>(null);
  const [peopleEditor, setPeopleEditor] = useState<PeopleEditorState | null>(null);
  const [photos, setPhotos] = useState<PhotoEntry[]>(() =>
    structuredClone(initialPhotos.length > 0 ? initialPhotos : [])
  );
  const persons = getPersons();

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
      data: { personId: string; shape: PhotoPersonShape; coords: number[] }
    ) => {
      setPhotos((prev) => {
        const next = [...prev];
        const photo = next[photoIdx]!;
        const people = [...(photo.people ?? [])];
        const entry = {
          personId: data.personId,
          shape: data.shape,
          coords: data.coords.length ? data.coords : undefined,
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
    <div className="space-y-4">
      <div className="rounded-lg border border-(--border-subtle) bg-(--surface) p-3 text-sm text-(--ink)">
        <p className="font-medium">{t('adminHowItWorks')}</p>
        <p className="mt-1 text-(--ink-muted)">{t('adminPhotosHowItWorks')}</p>
        <p className="mt-1 text-(--ink-muted)">{t('adminSaveReminder')}</p>
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => window.location.reload()}>
          {t('adminRefreshList')}
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        {photos.map((photo, idx) => (
          <Button
            key={photo.src}
            variant="secondary"
            onClick={() => setSelectedPhotoIdx(idx)}
            className="relative shrink-0 overflow-hidden rounded-lg border-2 border-[var(--border-subtle)] bg-[var(--paper)] p-0 aspect-[3/4] w-24 sm:w-28 hover:border-[var(--accent)] hover:shadow-lg"
          >
            <span className="block aspect-[3/4] w-24 overflow-hidden bg-(--paper-light) sm:w-28">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.src}
                alt=""
                className="h-full w-full object-cover"
              />
            </span>
            {isNew(photo) && (
              <span className="absolute right-1 top-1 rounded bg-amber-500 px-1.5 py-0.5 text-xs font-medium text-white shadow">
                {t('adminNew')}
              </span>
            )}
          </Button>
        ))}
      </div>

      {selectedPhotoIdx !== null && (
        <PhotoEditLightbox
          photo={photos[selectedPhotoIdx]!}
          photoIdx={selectedPhotoIdx}
          persons={persons}
          onUpdate={(field, value) => updatePhoto(selectedPhotoIdx, field, value)}
          onOpenAddPerson={() => setPeopleEditor({ photoIdx: selectedPhotoIdx, personIdx: null })}
          onOpenEditPerson={(personIdx) =>
            setPeopleEditor({ photoIdx: selectedPhotoIdx, personIdx })
          }
          onRemovePerson={removePersonFromPhoto}
          onClose={() => setSelectedPhotoIdx(null)}
        />
      )}

      {peopleEditor && (() => {
        const photo = photos[peopleEditor.photoIdx]!;
        const existing =
          peopleEditor.personIdx !== null ? photo.people?.[peopleEditor.personIdx] : null;
        const initialPersonId = existing?.personId ?? persons[0]?.id ?? '';
        const initialShape: PhotoPersonShape =
          existing?.shape && DRAWABLE_SHAPES.includes(existing.shape) ? existing.shape : 'rect';
        const initialCoords = existing?.coords ?? [];
        return (
          <PeopleEditorLightbox
            key={`${peopleEditor.photoIdx}-${peopleEditor.personIdx}`}
            photoSrc={photo.src}
            initialPersonId={initialPersonId}
            initialShape={initialShape}
            initialCoords={initialCoords}
            persons={persons}
            onSave={(data) =>
              savePersonFromLightbox(peopleEditor.photoIdx, peopleEditor.personIdx, data)
            }
            onClose={() => setPeopleEditor(null)}
          />
        );
      })()}
    </div>
  );
}

interface PhotoEditLightboxProps {
  photo: PhotoEntry;
  photoIdx: number;
  persons: ReturnType<typeof getPersons>;
  onUpdate: (field: keyof PhotoEntry, value: unknown) => void;
  onOpenAddPerson: () => void;
  onOpenEditPerson: (personIdx: number) => void;
  onRemovePerson: (photoIdx: number, personIdx: number) => void;
  onClose: () => void;
}

function PhotoEditLightbox({
  photo,
  photoIdx,
  persons,
  onUpdate,
  onOpenAddPerson,
  onOpenEditPerson,
  onRemovePerson,
  onClose,
}: PhotoEditLightboxProps) {
  const t = useTranslations();

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

        <div className="flex min-h-0 min-w-0 flex-1 items-center justify-center rounded-lg bg-(--paper-light) p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.src}
            alt=""
            className="max-h-[85vh] max-w-full object-contain"
          />
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

          {(photo.category === 'personal' || photo.category === 'related') && (
            <div>
              <label className="mb-1 block text-sm font-medium text-(--ink)">
                {t('adminPhotoPersonId')}
              </label>
              <Select
                value={photo.personId ?? ''}
                onChange={(e) => onUpdate('personId', e.target.value || undefined)}
                className="bg-[var(--paper)] px-3 py-2"
              >
                <option value="">—</option>
                {persons.map((p) => (
                  <option key={p.id} value={p.id}>
                    {getFullName(p) || p.id}
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-(--ink)">
                {t('adminPeopleOnPhoto')}
              </span>
            <Button variant="ghost" size="sm" onClick={onOpenAddPerson} className="text-sm text-[var(--accent)] hover:underline">
              {t('adminAdd')}
            </Button>
            </div>
            <ul className="space-y-1">
              {(photo.people ?? []).map((person, personIdx) => {
                const name = persons.find((p) => p.id === person.personId);
                const shapeLabel =
                  person.shape === 'point'
                    ? t('adminPhotoPoint')
                    : person.shape === 'circle'
                      ? t('adminPhotoCircle')
                      : person.shape === 'polygon'
                        ? t('adminPolygon')
                        : t('adminRect');
                return (
                  <li
                    key={personIdx}
                    className="flex flex-wrap items-center gap-2 rounded border border-(--border-subtle) px-2 py-1.5 text-sm"
                  >
                    <span className="text-(--ink)">
                      {name ? getFullName(name) : person.personId}
                    </span>
                    <span className="rounded bg-(--paper-light) px-1.5 py-0.5 text-xs text-(--ink-muted)">
                      {shapeLabel}
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

interface PeopleEditorLightboxProps {
  photoSrc: string;
  initialPersonId: string;
  initialShape: PhotoPersonShape;
  initialCoords: number[];
  persons: ReturnType<typeof getPersons>;
  onSave: (data: {
    personId: string;
    shape: PhotoPersonShape;
    coords: number[];
  }) => void;
  onClose: () => void;
}

function PeopleEditorLightbox({
  photoSrc,
  initialPersonId,
  initialShape,
  initialCoords,
  persons,
  onSave,
  onClose,
}: PeopleEditorLightboxProps) {
  const t = useTranslations();
  const [personId, setPersonId] = useState(initialPersonId);
  const [shape, setShape] = useState<PhotoPersonShape>(initialShape);
  const [coords, setCoords] = useState<number[]>(initialCoords);

  useEffect(() => {
    const id = setTimeout(() => {
      setPersonId(initialPersonId);
      setShape(initialShape);
      setCoords(initialCoords);
    }, 0);
    return () => clearTimeout(id);
  }, [initialPersonId, initialShape, initialCoords]);

  const handleDone = () => {
    onSave({ personId, shape, coords });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      role="dialog"
      aria-modal
      aria-label={t('adminPeopleOnPhoto')}
      onClick={onClose}
    >
      <div
        className="flex max-h-[95vh] w-full max-w-4xl flex-col gap-4 overflow-auto rounded-xl border border-(--border) bg-(--surface) p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium text-(--ink)">
            {t('adminPhotoPersonId')}
          </label>
          <Select
            value={personId}
            onChange={(e) => setPersonId(e.target.value)}
            className="bg-[var(--paper)] px-3 py-2 max-w-xs"
          >
            {persons.map((p) => (
              <option key={p.id} value={p.id}>
                {getFullName(p) || p.id}
              </option>
            ))}
          </Select>
          <div className="flex-1" />
          <Button variant="primary" onClick={handleDone}>
            {t('adminDone')}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            {t('adminCancel')}
          </Button>
        </div>
        <PhotoHotspotEditor
          src={photoSrc}
          coords={coords}
          shape={DRAWABLE_SHAPES.includes(shape) ? shape : 'rect'}
          onChange={(newCoords, newShape) => {
            setCoords(newCoords);
            setShape(newShape);
          }}
          imageClassName="max-w-4xl"
        />
      </div>
    </div>
  );
}
