'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { setAdminWorkingPersons } from '@/lib/data/persons';
import { setAdminWorkingPlaceFallbacks } from '@/lib/data/mapFallbacks';
import type { Person } from '@/lib/types/person';
import type { HistoryEntry } from '@/lib/types/history';
import type { PhotoEntry } from '@/lib/types/photo';
import type { GeocodedPoint } from '@/lib/constants/map';
import type { AdminDataSections } from './adminPageClientUtils';

type Params = {
  initialData: AdminDataSections;
  bundledHash: string;
  setGlobalRoot: (personId: string) => void;
  saveToStorage: (data: AdminDataSections, bundledHash: string) => void;
};

export function useAdminPageState({
  initialData,
  bundledHash,
  setGlobalRoot,
  saveToStorage,
}: Params) {
  const [rootPersonId, setRootPersonId] = useState(initialData.rootPersonId);
  const [photos, setPhotos] = useState(initialData.photos);
  const [placeFallbacks, setPlaceFallbacks] = useState(initialData.placeFallbacks);
  const [addPersonRowAction, setAddPersonRowAction] = useState<(() => void) | null>(null);
  const [deleteSelectedRowsAction, setDeleteSelectedRowsAction] = useState<(() => void) | null>(
    null
  );
  const [selectedRowsCount, setSelectedRowsCount] = useState(0);
  const [addTextEntryAction, setAddTextEntryAction] = useState<(() => void) | null>(null);
  const [refreshPhotosAction, setRefreshPhotosAction] = useState<(() => void) | null>(null);
  const [togglePhotosVisibilityAction, setTogglePhotosVisibilityAction] = useState<(() => void) | null>(
    null
  );
  const [deleteAllPhotosAction, setDeleteAllPhotosAction] = useState<(() => void) | null>(null);
  const [photosHaveHidden, setPhotosHaveHidden] = useState(false);

  const dataRef = useRef<AdminDataSections>(initialData);

  useEffect(() => {
    dataRef.current = { ...dataRef.current, rootPersonId };
  }, [rootPersonId]);

  useEffect(() => {
    setAdminWorkingPlaceFallbacks(placeFallbacks);
    return () => setAdminWorkingPlaceFallbacks(null);
  }, [placeFallbacks]);

  const persist = useCallback(() => saveToStorage(dataRef.current, bundledHash), [bundledHash, saveToStorage]);

  const handleAddRowActionChange = useCallback((action: (() => void) | null) => {
    setAddPersonRowAction(() => action);
  }, []);

  const handleDeleteSelectedRowsActionChange = useCallback((action: (() => void) | null) => {
    setDeleteSelectedRowsAction(() => action);
  }, []);

  const handlePersonsDataChange = useCallback(
    (persons: Person[]) => {
      dataRef.current = { ...dataRef.current, persons };
      setAdminWorkingPersons(persons);
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
    (history: HistoryEntry[]) => {
      dataRef.current = { ...dataRef.current, history };
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
    (nextPhotos: PhotoEntry[]) => {
      dataRef.current = { ...dataRef.current, photos: nextPhotos };
      setPhotos(nextPhotos);
      persist();
    },
    [persist]
  );

  const handlePlaceFallbacksChange = useCallback(
    (next: Record<string, GeocodedPoint>) => {
      setPlaceFallbacks(next);
      setAdminWorkingPlaceFallbacks(next);
      dataRef.current = { ...dataRef.current, placeFallbacks: next };
      persist();
    },
    [persist]
  );

  return {
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
  };
}
