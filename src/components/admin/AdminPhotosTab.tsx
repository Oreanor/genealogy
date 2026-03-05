'use client';

import { useCallback, useEffect, useState } from 'react';
import { getPersons } from '@/lib/data/persons';
import { getFullName } from '@/lib/utils/person';
import { useTranslations } from '@/lib/i18n/context';
import type { PhotoCategory, PhotoEntry, PhotoPerson, PhotoPersonShape } from '@/lib/types/photo';
import { PhotoHotspotEditor } from './PhotoHotspotEditor';
import { ImageLightbox } from '@/components/ui/ImageLightbox';

const DRAWABLE_SHAPES: PhotoPersonShape[] = ['point', 'circle', 'rect'];

function slugFromSrc(src: string): string {
  return src.replace(/^\/photos\//, '').replace(/\//g, '-').replace(/\.(jpg|jpeg|png|gif|webp)$/i, '') || 'photo';
}

interface AdminPhotosTabProps {
  initialPhotos: PhotoEntry[];
  onDataChange?: (photos: PhotoEntry[]) => void;
}

type PeopleEditorState = { photoIdx: number; personIdx: number | null };

export function AdminPhotosTab({ initialPhotos, onDataChange }: AdminPhotosTabProps) {
  const t = useTranslations();
  const [loading, setLoading] = useState(true);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [peopleEditor, setPeopleEditor] = useState<PeopleEditorState | null>(null);
  const [photos, setPhotos] = useState<PhotoEntry[]>(() =>
    JSON.parse(JSON.stringify(initialPhotos))
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

  const updatePhoto = useCallback(
    (index: number, field: keyof PhotoEntry, value: unknown) => {
      setPhotos((prev) => {
        const next = [...prev];
        next[index] = { ...next[index]!, [field]: value };
        return next;
      });
    },
    []
  );

  const updatePerson = useCallback(
    (photoIdx: number, personIdx: number, field: keyof PhotoPerson, value: unknown) => {
      setPhotos((prev) => {
        const next = [...prev];
        const photo = next[photoIdx]!;
        const people = [...(photo.people ?? [])];
        people[personIdx] = { ...people[personIdx]!, [field]: value };
        next[photoIdx] = { ...photo, people };
        return next;
      });
    },
    []
  );

  const openAddPerson = useCallback((photoIdx: number) => {
    setPeopleEditor({ photoIdx, personIdx: null });
  }, []);

  const openEditPerson = useCallback((photoIdx: number, personIdx: number) => {
    setPeopleEditor({ photoIdx, personIdx });
  }, []);

  const savePersonFromLightbox = useCallback(
    (photoIdx: number, personIdx: number | null, data: { personId: string; shape: PhotoPersonShape; coords: number[] }) => {
      setPhotos((prev) => {
        const next = [...prev];
        const photo = next[photoIdx]!;
        const people = [...(photo.people ?? [])];
        const entry = { personId: data.personId, shape: data.shape, coords: data.coords.length ? data.coords : undefined };
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

  const removePersonFromPhoto = useCallback(
    (photoIdx: number, personIdx: number) => {
      setPhotos((prev) => {
        const next = [...prev];
        const photo = next[photoIdx]!;
        const people = (photo.people ?? []).filter((_, i) => i !== personIdx);
        next[photoIdx] = { ...photo, people };
        return next;
      });
    },
    []
  );

  useEffect(() => {
    onDataChange?.(photos);
  }, [photos, onDataChange]);

  const isReady = (p: PhotoEntry) => {
    const cat = p.category ?? 'related';
    if (cat === 'personal' && p.personId) return true;
    if (cat === 'group' && p.people && p.people.length > 0) return true;
    if (cat === 'related' && (p.caption?.trim() || p.personId)) return true;
    return Boolean(p.caption?.trim() || (p.people && p.people.length > 0));
  };

  if (loading) {
    return (
      <div className="py-8 text-center text-[var(--ink-muted)]">
        {t('adminPhotosScanning')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] p-3 text-sm text-[var(--ink)]">
        <p className="font-medium">{t('adminHowItWorks')}</p>
        <p className="mt-1 text-[var(--ink-muted)]">
          {t('adminPhotosHowItWorks')}
        </p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--ink)] hover:bg-[var(--paper-light)]"
        >
          {t('adminRefreshList')}
        </button>
      </div>

      {photos.length === 0 ? (
        <p className="text-[var(--ink-muted)]">
          {t('adminPhotosNoPhotos')}
        </p>
      ) : (
        <div className="space-y-4">
          {photos.map((photo, photoIdx) => {
            const ready = isReady(photo);
            return (
              <div
                key={photo.src}
                className={`rounded-xl border p-4 ${
                  ready
                    ? 'border-green-500/30 bg-green-50/30 dark:bg-green-950/20'
                    : 'border-[var(--border)] bg-[var(--paper)]'
                }`}
              >
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setLightboxSrc(photo.src)}
                    className="h-16 w-16 shrink-0 overflow-hidden rounded object-cover transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.src} alt="" className="h-full w-full object-cover" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-sm text-[var(--ink)]">
                      {photo.src}
                    </p>
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs ${
                        ready
                          ? 'bg-green-200/80 text-green-800 dark:bg-green-900/50'
                          : 'bg-amber-200/80 text-amber-800 dark:bg-amber-900/50'
                      }`}
                    >
                      {ready ? t('adminSigned') : t('adminNew')}
                    </span>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--ink)]">
                      {t('adminPhotoCategory')}
                    </label>
                    <select
                      value={photo.category ?? 'related'}
                      onChange={(e) =>
                        updatePhoto(photoIdx, 'category', e.target.value as PhotoCategory)
                      }
                      className="w-full rounded border border-[var(--border-subtle)] bg-transparent px-3 py-2 text-[var(--ink)]"
                    >
                      <option value="personal">{t('adminPhotoPersonal')}</option>
                      <option value="group">{t('adminPhotoGroup')}</option>
                      <option value="related">{t('adminPhotoRelated')}</option>
                    </select>
                  </div>
                  {(photo.category === 'personal' || photo.category === 'related') && (
                    <div>
                      <label className="mb-1 block text-sm font-medium text-[var(--ink)]">
                        {t('adminPhotoPersonId')}
                      </label>
                      <select
                        value={photo.personId ?? ''}
                        onChange={(e) =>
                          updatePhoto(photoIdx, 'personId', e.target.value || undefined)
                        }
                        className="w-full rounded border border-[var(--border-subtle)] bg-transparent px-3 py-2 text-[var(--ink)]"
                      >
                        <option value="">—</option>
                        {persons.map((p) => (
                          <option key={p.id} value={p.id}>
                            {getFullName(p) || p.id}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--ink)]">
                      {t('adminCaption')}
                    </label>
                    <input
                      type="text"
                      value={photo.caption ?? ''}
                      onChange={(e) => updatePhoto(photoIdx, 'caption', e.target.value)}
                      placeholder={t('adminCaptionPlaceholder')}
                      className="w-full rounded border border-[var(--border-subtle)] bg-transparent px-3 py-2 text-[var(--ink)]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--ink)]">
                      {t('adminPhotoBackSrc')}
                    </label>
                    <input
                      type="text"
                      value={photo.backSrc ?? ''}
                      onChange={(e) => updatePhoto(photoIdx, 'backSrc', e.target.value || undefined)}
                      placeholder="/photos/..."
                      className="w-full rounded border border-[var(--border-subtle)] bg-transparent px-3 py-2 text-[var(--ink)]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--ink)]">
                      {t('adminPhotoBackCaption')}
                    </label>
                    <input
                      type="text"
                      value={photo.backCaption ?? ''}
                      onChange={(e) =>
                        updatePhoto(photoIdx, 'backCaption', e.target.value || undefined)
                      }
                      placeholder={t('adminCaptionPlaceholder')}
                      className="w-full rounded border border-[var(--border-subtle)] bg-transparent px-3 py-2 text-[var(--ink)]"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-[var(--ink)]">
                      {t('adminPeopleOnPhoto')}
                    </span>
                    <button
                      type="button"
                      onClick={() => openAddPerson(photoIdx)}
                      className="text-sm text-[var(--accent)] hover:underline"
                    >
                      {t('adminAdd')}
                    </button>
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
                          className="flex flex-wrap items-center gap-2 rounded border border-[var(--border-subtle)] px-2 py-1.5 text-sm"
                        >
                          <span className="text-[var(--ink)]">
                            {name ? getFullName(name) : person.personId}
                          </span>
                          <span className="rounded bg-[var(--paper-light)] px-1.5 py-0.5 text-xs text-[var(--ink-muted)]">
                            {shapeLabel}
                          </span>
                          <button
                            type="button"
                            onClick={() => openEditPerson(photoIdx, personIdx)}
                            className="text-[var(--accent)] hover:underline"
                          >
                            {t('adminEdit')}
                          </button>
                          <button
                            type="button"
                            onClick={() => removePersonFromPhoto(photoIdx, personIdx)}
                            className="text-[var(--ink-muted)] hover:text-red-600"
                          >
                            ✕
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {lightboxSrc && (
        <ImageLightbox
          src={lightboxSrc}
          open={!!lightboxSrc}
          onClose={() => setLightboxSrc(null)}
        />
      )}
      {peopleEditor && (() => {
        const photo = photos[peopleEditor.photoIdx]!;
        const existing = peopleEditor.personIdx !== null ? photo.people?.[peopleEditor.personIdx] : null;
        const initialPersonId = existing?.personId ?? persons[0]?.id ?? '';
        const initialShape: PhotoPersonShape = existing?.shape && DRAWABLE_SHAPES.includes(existing.shape)
          ? existing.shape
          : 'rect';
        const initialCoords = existing?.coords ?? [];
        return (
          <PeopleEditorLightbox
            key={`${peopleEditor.photoIdx}-${peopleEditor.personIdx}`}
            photoSrc={photo.src}
            initialPersonId={initialPersonId}
            initialShape={initialShape}
            initialCoords={initialCoords}
            persons={persons}
            onSave={(data) => savePersonFromLightbox(peopleEditor.photoIdx, peopleEditor.personIdx, data)}
            onClose={() => setPeopleEditor(null)}
          />
        );
      })()}
    </div>
  );
}

interface PeopleEditorLightboxProps {
  photoSrc: string;
  initialPersonId: string;
  initialShape: PhotoPersonShape;
  initialCoords: number[];
  persons: ReturnType<typeof getPersons>;
  onSave: (data: { personId: string; shape: PhotoPersonShape; coords: number[] }) => void;
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
    setPersonId(initialPersonId);
    setShape(initialShape);
    setCoords(initialCoords);
  }, [initialPersonId, initialShape, initialCoords]);

  const handleDone = () => {
    onSave({ personId, shape, coords });
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      role="dialog"
      aria-modal
      aria-label={t('adminPeopleOnPhoto')}
      onClick={onClose}
    >
      <div
        className="flex max-h-[95vh] w-full max-w-4xl flex-col gap-4 overflow-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium text-[var(--ink)]">
            {t('adminPhotoPersonId')}
          </label>
          <select
            value={personId}
            onChange={(e) => setPersonId(e.target.value)}
            className="rounded border border-[var(--border-subtle)] bg-[var(--paper)] px-3 py-2 text-[var(--ink)]"
          >
            {persons.map((p) => (
              <option key={p.id} value={p.id}>
                {getFullName(p) || p.id}
              </option>
            ))}
          </select>
          <div className="flex-1" />
          <button
            type="button"
            onClick={handleDone}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--nav-btn-ink)] hover:opacity-90"
          >
            {t('adminDone')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--border)] bg-[var(--paper-light)] px-4 py-2 text-sm text-[var(--ink)] hover:bg-[var(--border-subtle)]"
          >
            {t('adminCancel')}
          </button>
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
