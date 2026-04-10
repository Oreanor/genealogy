'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from '@/lib/i18n/context';
import type { Person } from '@/lib/types/person';
import { getFullName } from '@/lib/utils/person';
import { FALLBACK_COUNTRY_SUFFIX, type GeocodedPoint } from '@/lib/constants/map';
import { normalizePlace, splitPlaceList, toPlaceFallbackKey } from '@/lib/utils/mapPlace';
import { initLeafletMap, destroyLeafletMap } from '@/lib/utils/leafletMap';
import {
  getAvatarForPerson,
  getAvatarOptionsForPersonFromList,
  getAvatarCropStyles,
  type AvatarSource,
} from '@/lib/data/photos';
import type { PhotoEntry } from '@/lib/types/photo';
import { Dialog } from '@/components/ui/molecules/Dialog';
import {
  INITIAL_COLUMN_WIDTHS,
  minWidthForColumn,
  type CityReviewState,
} from './adminPersonsTableUtils';
import { useAdminPersonsTableState } from './useAdminPersonsTableState';
import { AdminPersonsTableHeader } from './AdminPersonsTableHeader';
import { AdminPersonsTableRow } from './AdminPersonsTableRow';
import { AvatarPickerDialog } from './AvatarPickerDialog';
import { CityReviewDialog } from './CityReviewDialog';

function FaceThumbnail({ source, size = 40 }: { source: AvatarSource; size?: number }) {
  const { src, faceRect } = source;
  const wrapperStyle = { width: size, height: size };
  if (faceRect) {
    return (
      <span
        className="inline-block overflow-hidden rounded-full bg-(--paper-light)"
        style={wrapperStyle}
      >
        <span
          className="block h-full w-full"
          style={getAvatarCropStyles(faceRect, src)}
          aria-hidden
        />
      </span>
    );
  }
  return (
    <span
      className="inline-block overflow-hidden rounded-full bg-(--paper-light)"
      style={wrapperStyle}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="h-full w-full object-cover" />
    </span>
  );
}

interface AdminPersonsTableProps {
  rootPersonId: string;
  initialPersons: Person[];
  photos: PhotoEntry[];
  placeFallbacks: Record<string, GeocodedPoint>;
  onDataChange?: (persons: Person[]) => void;
  onRootChange?: (personId: string) => void;
  onPlaceFallbacksChange?: (placeFallbacks: Record<string, GeocodedPoint>) => void;
  onAddRowActionChange?: (action: (() => void) | null) => void;
  onDeleteSelectedRowsActionChange?: (action: (() => void) | null) => void;
  onSelectedRowsCountChange?: (count: number) => void;
}

export function AdminPersonsTable({
  rootPersonId,
  initialPersons,
  photos,
  placeFallbacks,
  onDataChange,
  onRootChange,
  onPlaceFallbacksChange,
  onAddRowActionChange,
  onDeleteSelectedRowsActionChange,
  onSelectedRowsCountChange,
}: AdminPersonsTableProps) {
  const t = useTranslations();
  const locale = useLocale();
  const {
    persons,
    sortedPersons,
    personIndexById,
    selectedIds,
    setSelectedIds,
    sortConfig,
    cycleSort,
    addRow,
    removeSelectedRows,
    updatePerson,
    setParent,
  } = useAdminPersonsTableState({
    initialPersons,
    locale,
    onDataChange,
  });
  const [confirmRootOpen, setConfirmRootOpen] = useState(false);
  const [pendingRootId, setPendingRootId] = useState<string | null>(null);
  const [confirmBulkDeleteOpen, setConfirmBulkDeleteOpen] = useState(false);
  const [parentPicker, setParentPicker] = useState<{ rowIdx: number; type: 'father' | 'mother' } | null>(null);
  const [parentPickerQuery, setParentPickerQuery] = useState('');
  const parentPickerRef = useRef<HTMLDivElement>(null);
  const [avatarPickerRowIdx, setAvatarPickerRowIdx] = useState<number | null>(null);
  const [cityReview, setCityReview] = useState<CityReviewState | null>(null);
  const cityMapHostRef = useRef<HTMLDivElement | null>(null);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(INITIAL_COLUMN_WIDTHS);
  const resizingRef = useRef<{ id: string; startX: number; startWidth: number } | null>(null);

  const handleSetRootClick = useCallback(
    (personId: string) => {
      if (personId === rootPersonId) return;
      setPendingRootId(personId);
      setConfirmRootOpen(true);
    },
    [rootPersonId]
  );

  const handleConfirmRoot = useCallback(() => {
    if (pendingRootId) {
      onRootChange?.(pendingRootId);
      setPendingRootId(null);
    }
  }, [pendingRootId, onRootChange]);

  const filteredPickerPersons = useMemo(() => {
    if (!parentPickerQuery.trim()) return persons;
    const q = parentPickerQuery.trim().toLowerCase();
    return persons.filter((p) => {
      const name = (getFullName(p) || p.id).toLowerCase();
      return name.includes(q) || p.id.toLowerCase().includes(q);
    });
  }, [persons, parentPickerQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (parentPickerRef.current && !parentPickerRef.current.contains(e.target as Node)) {
        setParentPicker(null);
      }
    };
    if (parentPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [parentPicker]);

  const requestDeleteSelectedRows = useCallback(() => {
    if (selectedIds.size === 0) return;
    setConfirmBulkDeleteOpen(true);
  }, [selectedIds]);

  useEffect(() => {
    onAddRowActionChange?.(addRow);
    return () => onAddRowActionChange?.(null);
  }, [addRow, onAddRowActionChange]);

  useEffect(() => {
    onDeleteSelectedRowsActionChange?.(requestDeleteSelectedRows);
    return () => onDeleteSelectedRowsActionChange?.(null);
  }, [requestDeleteSelectedRows, onDeleteSelectedRowsActionChange]);

  useEffect(() => {
    onSelectedRowsCountChange?.(selectedIds.size);
  }, [selectedIds, onSelectedRowsCountChange]);

  const startResize = useCallback((id: string, clientX: number) => {
    const startWidth = columnWidths[id] ?? INITIAL_COLUMN_WIDTHS[id] ?? minWidthForColumn(id);
    resizingRef.current = { id, startX: clientX, startWidth };

    const onMove = (e: MouseEvent) => {
      const st = resizingRef.current;
      if (!st) return;
      const nextWidth = Math.max(
        minWidthForColumn(st.id),
        st.startWidth + (e.clientX - st.startX)
      );
      setColumnWidths((prev) => ({ ...prev, [st.id]: nextWidth }));
    };
    const onUp = () => {
      resizingRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [columnWidths]);

  const handleResizeMouseDown = useCallback(
    (id: string) => (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      startResize(id, e.clientX);
    },
    [startResize]
  );

  const renderResizeHandle = (id: string) => (
    <div
      className="absolute -right-1 top-0 z-20 h-full w-4 cursor-col-resize select-none"
      onMouseDown={handleResizeMouseDown(id)}
      title=""
    >
      <span className="pointer-events-none absolute inset-y-1 left-1/2 w-px -translate-x-1/2 bg-(--border-subtle) opacity-0" />
    </div>
  );

  const upsertPlaceFallback = useCallback(
    (city: string, point: GeocodedPoint) => {
      const key = toPlaceFallbackKey(city);
      onPlaceFallbacksChange?.({
        ...placeFallbacks,
        [key]: point,
      });
    },
    [onPlaceFallbacksChange, placeFallbacks]
  );

  const geocodeCity = useCallback(async (city: string): Promise<GeocodedPoint | null> => {
    const ask = async (q: string) => {
      const res = await fetch(`/api/map/geocode?q=${encodeURIComponent(q)}`, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { point: GeocodedPoint | null };
      return data.point;
    };
    const normalized = normalizePlace(city);
    let point = await ask(city);
    if (!point && normalized !== city) point = await ask(normalized);
    const hasCyrillic = /[а-яёА-ЯЁ]/.test(normalized);
    if (!point && hasCyrillic) point = await ask(`${normalized}${FALLBACK_COUNTRY_SUFFIX}`);
    return point;
  }, []);

  const handleCityBlur = useCallback(
    async (index: number, field: 'birthPlace' | 'residenceCity', rawValue: string) => {
      if (!rawValue.trim()) return;
      const unknownCity = splitPlaceList(rawValue).find(
        (city) => !placeFallbacks[toPlaceFallbackKey(city)]
      );
      if (!unknownCity) return;
      const geocodedPoint = await geocodeCity(unknownCity);
      setCityReview({
        rowIdx: index,
        field,
        city: unknownCity,
        geocodedPoint,
        manualLat: geocodedPoint ? String(geocodedPoint.lat) : '',
        manualLon: geocodedPoint ? String(geocodedPoint.lon) : '',
      });
    },
    [geocodeCity, placeFallbacks]
  );

  useEffect(() => {
    if (!cityReview || !cityMapHostRef.current) return;
    const mapHost = cityMapHostRef.current;
    let disposed = false;
    let map: import('leaflet').Map | null = null;
    let marker: import('leaflet').Marker | null = null;
    let clickHandler: ((e: import('leaflet').LeafletMouseEvent) => void) | null = null;

    const init = async () => {
      const lat = Number.parseFloat(cityReview.manualLat.replace(',', '.'));
      const lon = Number.parseFloat(cityReview.manualLon.replace(',', '.'));
      const hasManualPoint = Number.isFinite(lat) && Number.isFinite(lon);
      const center: readonly [number, number] = hasManualPoint
        ? [lat, lon]
        : cityReview.geocodedPoint
          ? [cityReview.geocodedPoint.lat, cityReview.geocodedPoint.lon]
          : [56.5, 37.5];
      const zoom = hasManualPoint || cityReview.geocodedPoint ? 9 : 4;
      const leaflet = await initLeafletMap(mapHost, center, zoom);
      if (disposed) return;
      map = leaflet.map;
      const L = leaflet.L;

      if (hasManualPoint) {
        marker = L.marker([lat, lon]).addTo(map);
      } else if (cityReview.geocodedPoint) {
        marker = L.marker([cityReview.geocodedPoint.lat, cityReview.geocodedPoint.lon]).addTo(map);
      }

      clickHandler = (e) => {
        if (!map) return;
        const pickedLat = Number(e.latlng.lat.toFixed(6));
        const pickedLon = Number(e.latlng.lng.toFixed(6));
        setCityReview((prev) =>
          prev
            ? {
                ...prev,
                manualLat: String(pickedLat),
                manualLon: String(pickedLon),
              }
            : prev
        );
        if (marker) map.removeLayer(marker);
        marker = L.marker([pickedLat, pickedLon]).addTo(map);
      };
      map.on('click', clickHandler);
    };

    void init();

    return () => {
      disposed = true;
      if (map && clickHandler) {
        map.off('click', clickHandler);
      }
      destroyLeafletMap(mapHost);
    };
  }, [cityReview]);

  return (
    <div className="space-y-2">
      <div className="overflow-auto border border-(--border) bg-(--paper) max-h-[calc(100vh-142px)] md:max-h-[calc(100vh-126px)]">
        <table className="w-full min-w-[800px] border-collapse text-sm">
          <AdminPersonsTableHeader
            persons={persons}
            selectedIds={selectedIds}
            setSelectedIds={setSelectedIds}
            columnWidths={columnWidths}
            sortConfig={sortConfig}
            cycleSort={cycleSort}
            renderResizeHandle={renderResizeHandle}
            t={t}
          />
          <tbody>
            {sortedPersons.map((person, displayIdx) => {
              const actualIdx = personIndexById.get(person.id) ?? -1;
              if (actualIdx < 0) return null;
              const avatar = getAvatarForPerson(person.id, person.avatarPhotoSrc);
              return (
                <AdminPersonsTableRow
                key={person.id + displayIdx}
                  person={person}
                  actualIdx={actualIdx}
                  rootPersonId={rootPersonId}
                  persons={persons}
                  selectedIds={selectedIds}
                  setSelectedIds={setSelectedIds}
                  columnWidths={columnWidths}
                  handleSetRootClick={handleSetRootClick}
                  updatePerson={updatePerson}
                  handleCityBlur={handleCityBlur}
                  avatar={avatar}
                  onOpenAvatarPicker={() => setAvatarPickerRowIdx(actualIdx)}
                  renderFaceThumbnail={(source, size = 40) => (
                    <FaceThumbnail source={source} size={size} />
                  )}
                  parentPicker={parentPicker}
                  parentPickerQuery={parentPickerQuery}
                  setParentPickerQuery={setParentPickerQuery}
                  filteredPickerPersons={filteredPickerPersons}
                  parentPickerRef={parentPickerRef}
                  setParent={setParent}
                  openParentPicker={(rowIdx, type) => {
                    setParentPicker({ rowIdx, type });
                    setParentPickerQuery('');
                  }}
                  closeParentPicker={() => setParentPicker(null)}
                  t={t}
                />
              );
            })}
          </tbody>
        </table>
      </div>
      <Dialog
        open={confirmRootOpen}
        onClose={() => { setConfirmRootOpen(false); setPendingRootId(null); }}
        title={t('adminRootColumn')}
        variant="confirm"
        confirmLabel={t('dialogConfirm')}
        cancelLabel={t('adminCancel')}
        onConfirm={handleConfirmRoot}
      >
        {t('adminRootChangeConfirm')}
      </Dialog>

      <Dialog
        open={confirmBulkDeleteOpen}
        onClose={() => setConfirmBulkDeleteOpen(false)}
        title={t('adminDeleteRows')}
        variant="confirm"
        confirmLabel={t('dialogConfirm')}
        cancelLabel={t('adminCancel')}
        onConfirm={() => {
          removeSelectedRows();
          setConfirmBulkDeleteOpen(false);
        }}
      >
        {t('adminDeleteRowsConfirm', { count: selectedIds.size })}
      </Dialog>

      <AvatarPickerDialog
        open={avatarPickerRowIdx !== null}
        person={avatarPickerRowIdx !== null ? persons[avatarPickerRowIdx] ?? null : null}
        options={
          avatarPickerRowIdx !== null
            ? (() => {
                const person = persons[avatarPickerRowIdx];
                if (!person) return [];
                const optionsRaw = getAvatarOptionsForPersonFromList(photos, person.id);
                const categoryBySrc = new Map(
                  photos.map((p): [string, PhotoEntry['category']] => [p.src, p.category])
                );
                return [
                  ...optionsRaw.filter((opt) => categoryBySrc.get(opt.src) === 'personal'),
                  ...optionsRaw.filter((opt) => categoryBySrc.get(opt.src) === 'group'),
                ];
              })()
            : []
        }
        onClose={() => setAvatarPickerRowIdx(null)}
        onSelect={(src) => {
          if (avatarPickerRowIdx === null) return;
          updatePerson(avatarPickerRowIdx, 'avatarPhotoSrc', src);
        }}
        renderFaceThumbnail={(source, size = 40) => <FaceThumbnail source={source} size={size} />}
        t={t}
      />

      <CityReviewDialog
        cityReview={cityReview}
        cityMapHostRef={cityMapHostRef}
        setCityReview={setCityReview}
        onApply={(city, point) => upsertPlaceFallback(city, point)}
      />
    </div>
  );
}
