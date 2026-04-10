'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getPersons } from '@/lib/data/persons';
import type { PhotoEntry } from '@/lib/types/photo';
import { CUSTOM_PERSON_VALUE } from './PhotoEditLightbox';
import type { TranslationFn } from '@/lib/i18n/types';
import {
  buildAdminPhotoGroups,
  buildPhotoIndexMaps,
  slugFromSrc,
} from './adminPhotosTabUtils';

type PeopleEditorState = { photoIdx: number; personIdx: number | null };

type Params = {
  initialPhotos: PhotoEntry[];
  t: TranslationFn;
  onDataChange?: (photos: PhotoEntry[]) => void;
  onRefreshActionChange?: (action: (() => void) | null) => void;
  onToggleVisibilityActionChange?: (action: (() => void) | null) => void;
  onDeleteAllActionChange?: (action: (() => void) | null) => void;
  onHasHiddenChange?: (hasHidden: boolean) => void;
};

export function useAdminPhotosModel({
  initialPhotos,
  t,
  onDataChange,
  onRefreshActionChange,
  onToggleVisibilityActionChange,
  onDeleteAllActionChange,
  onHasHiddenChange,
}: Params) {
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

  const { photoIdxBySrc, backIdxByFrontSrc } = useMemo(() => buildPhotoIndexMaps(photos), [photos]);
  const groups = useMemo(() => buildAdminPhotoGroups(photos, photoIdxBySrc, t), [photos, photoIdxBySrc, t]);

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
          data.personId === CUSTOM_PERSON_VALUE || (!data.personId && (data.label ?? '').trim());
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

  const removePhoto = useCallback(
    (idx: number) => {
      setPhotos((prev) => prev.filter((_, i) => i !== idx));
      if (selectedPhotoIdx === idx) setSelectedPhotoIdx(null);
      else if (selectedPhotoIdx !== null && selectedPhotoIdx > idx) {
        setSelectedPhotoIdx(selectedPhotoIdx - 1);
      }
      setConfirmDeleteIdx(null);
    },
    [selectedPhotoIdx]
  );

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

  const openAddPerson = useCallback(() => {
    if (selectedPhotoIdx === null) return;
    setPeopleEditor({ photoIdx: selectedPhotoIdx, personIdx: null });
    setEditingPersonId(persons[0]?.id ?? '');
    setEditingLabel('');
    setEditingCoords([]);
  }, [persons, selectedPhotoIdx]);

  const openEditPerson = useCallback(
    (personIdx: number) => {
      if (selectedPhotoIdx === null) return;
      setPeopleEditor({ photoIdx: selectedPhotoIdx, personIdx });
      const photo = photos[selectedPhotoIdx]!;
      const entry = photo.people?.[personIdx];
      const hasPerson = entry?.personId;
      setEditingPersonId(hasPerson ? entry.personId! : CUSTOM_PERSON_VALUE);
      setEditingLabel(entry?.label ?? '');
      setEditingCoords(entry?.coords && entry.coords.length >= 4 ? [...entry.coords] : []);
    },
    [photos, selectedPhotoIdx]
  );

  const handleSaveEditedPerson = useCallback(() => {
    if (peopleEditor === null) return;
    savePersonFromLightbox(peopleEditor.photoIdx, peopleEditor.personIdx, {
      personId: editingPersonId,
      label: editingLabel,
      coords: editingCoords,
    });
    setPeopleEditor(null);
  }, [editingCoords, editingLabel, editingPersonId, peopleEditor, savePersonFromLightbox]);

  return {
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
  };
}
