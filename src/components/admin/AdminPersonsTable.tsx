'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from '@/lib/i18n/context';
import type { Person } from '@/lib/types/person';
import { getFullName } from '@/lib/utils/person';
import { mergeOnePerson } from '@/lib/utils/personMerge';
import { addPersonNameLock } from '@/lib/utils/personNameLocks';
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
import { Button, Input } from '@/components/ui/atoms';
import { ImageIcon } from 'lucide-react';

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

const PERSON_ID_PAD = 3;

/** Numeric part of id (e.g. p001, p002) for sorting; NaN otherwise */
function personIdNum(id: string): number {
  const m = /^p(\d+)$/.exec(id);
  return m ? Number.parseInt(m[1]!, 10) : Number.NaN;
}

function isEmptyPersonRow(person: Person): boolean {
  const last = (person.lastName ?? '').trim();
  const first = (person.firstName ?? '').trim();
  const patr = (person.patronymic ?? '').trim();
  return last === '' && first === '' && patr === '';
}

/** Empty/new rows first, then by surname alphabetically. */
function sortPersonsDefault(ps: Person[]): Person[] {
  return [...ps].sort((a, b) => {
    const aLast = (a.lastName ?? '').trim();
    const bLast = (b.lastName ?? '').trim();
    const aFirst = (a.firstName ?? '').trim();
    const bFirst = (b.firstName ?? '').trim();
    const aPatr = (a.patronymic ?? '').trim();
    const bPatr = (b.patronymic ?? '').trim();

    const aEmpty = aLast === '' && aFirst === '' && aPatr === '';
    const bEmpty = bLast === '' && bFirst === '' && bPatr === '';
    if (aEmpty !== bEmpty) return aEmpty ? -1 : 1;

    if (aLast !== bLast) return aLast.localeCompare(bLast, 'ru', { sensitivity: 'base' });
    if (aFirst !== bFirst) return aFirst.localeCompare(bFirst, 'ru', { sensitivity: 'base' });
    if (aPatr !== bPatr) return aPatr.localeCompare(bPatr, 'ru', { sensitivity: 'base' });

    const na = personIdNum(a.id);
    const nb = personIdNum(b.id);
    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
    return a.id.localeCompare(b.id, 'ru', { sensitivity: 'base' });
  });
}

type SortDirection = 'asc' | 'desc';
type SortKey = keyof Person;

function compareValues(a: string, b: string): number {
  return a.localeCompare(b, 'ru', { sensitivity: 'base', numeric: true });
}

function sortPersonsByColumn(
  ps: Person[],
  sortBy: SortKey,
  direction: SortDirection
): Person[] {
  const factor = direction === 'asc' ? 1 : -1;
  return [...ps].sort((a, b) => {
    const av = String(a[sortBy] ?? '').trim();
    const bv = String(b[sortBy] ?? '').trim();
    const cmp = compareValues(av, bv);
    if (cmp !== 0) return cmp * factor;

    // Stable tie-breaker: default persons ordering.
    return sortPersonsDefault([a, b])[0] === a ? -1 : 1;
  });
}

/** Table columns (no id, no #); Father/Mother rendered separately. */
const COLUMNS: (keyof Person)[] = [
  'lastName',
  'firstName',
  'patronymic',
  'birthDate',
  'deathDate',
  'birthPlace',
  'residenceCity',
  'occupation',
  'comment',
  'gender',
];

const COLUMN_LABELS: Partial<Record<keyof Person, string>> = {
  firstName: 'adminFirstName',
  patronymic: 'adminPatronymic',
  lastName: 'adminLastName',
  birthDate: 'adminBirthDate',
  deathDate: 'adminDeathDate',
  birthPlace: 'adminBirthPlace',
  residenceCity: 'adminResidenceCity',
  occupation: 'adminOccupation',
  comment: 'adminComment',
  gender: 'adminGender',
};

const INITIAL_COLUMN_WIDTHS: Record<string, number> = {
  lastName: 120,
  firstName: 120,
  patronymic: 120,
  birthDate: 92,
  deathDate: 92,
  birthPlace: 110,
  residenceCity: 110,
  occupation: 120,
  comment: 140,
  gender: 56,
  avatar: 52,
  father: 180,
  mother: 180,
};

function minWidthForColumn(id: string): number {
  if (id === 'gender') return 48;
  if (id === 'avatar') return 44;
  if (id === 'birthDate' || id === 'deathDate') return 82;
  if (id === 'father' || id === 'mother') return 120;
  return 90;
}

function nextPersonId(persons: Person[]): string {
  const nums = persons
    .map((p) => personIdNum(p.id))
    .filter((n) => !Number.isNaN(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return `p${String(max + 1).padStart(PERSON_ID_PAD, '0')}`;
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
  const [persons, setPersons] = useState<Person[]>(() =>
    sortPersonsDefault(
      JSON.parse(JSON.stringify(initialPersons)).map((w: Person) => {
        const bDisk =
          initialPersons.find((b) => b.id === w.id) ??
          ({
            ...w,
            firstName: '',
            lastName: '',
            patronymic: '',
          } as Person);
        return mergeOnePerson(bDisk, w, locale, true);
      })
    )
  );
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>(null);
  const [confirmRootOpen, setConfirmRootOpen] = useState(false);
  const [pendingRootId, setPendingRootId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [confirmBulkDeleteOpen, setConfirmBulkDeleteOpen] = useState(false);
  const [parentPicker, setParentPicker] = useState<{ rowIdx: number; type: 'father' | 'mother' } | null>(null);
  const [parentPickerQuery, setParentPickerQuery] = useState('');
  const parentPickerRef = useRef<HTMLDivElement>(null);
  const [avatarPickerRowIdx, setAvatarPickerRowIdx] = useState<number | null>(null);
  const [cityReview, setCityReview] = useState<{
    rowIdx: number;
    field: 'birthPlace' | 'residenceCity';
    city: string;
    geocodedPoint: GeocodedPoint | null;
    manualLat: string;
    manualLon: string;
  } | null>(null);
  const cityMapHostRef = useRef<HTMLDivElement | null>(null);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(INITIAL_COLUMN_WIDTHS);
  const resizingRef = useRef<{ id: string; startX: number; startWidth: number } | null>(null);
  const personsRef = useRef<Person[]>(persons);
  const prevLocaleRef = useRef(locale);
  const [sessionOrderIds, setSessionOrderIds] = useState<string[]>(() => {
    const merged = sortPersonsDefault(
      JSON.parse(JSON.stringify(initialPersons)).map((w: Person) => {
        const bDisk =
          initialPersons.find((b) => b.id === w.id) ??
          ({
            ...w,
            firstName: '',
            lastName: '',
            patronymic: '',
          } as Person);
        return mergeOnePerson(bDisk, w, locale, true);
      })
    );
    return merged.map((p) => p.id);
  });

  useEffect(() => {
    personsRef.current = persons;
  }, [persons]);

  useEffect(() => {
    onDataChange?.(persons);
  }, [persons, onDataChange]);

  useEffect(() => {
    setPersons((prev) =>
      sortPersonsDefault(
        prev.map((w) => {
          const bDisk =
            initialPersons.find((b) => b.id === w.id) ??
            ({
              ...w,
              firstName: '',
              lastName: '',
              patronymic: '',
            } as Person);
          return mergeOnePerson(bDisk, w, locale, true);
        })
      )
    );
  }, [locale, initialPersons]);

  useLayoutEffect(() => {
    const localeChanged = prevLocaleRef.current !== locale;
    prevLocaleRef.current = locale;
    if (!localeChanged) return;
    setSessionOrderIds(() => {
      const nextPersons = persons;
      const emptyRows = nextPersons.filter(isEmptyPersonRow);
      const filledRows = nextPersons.filter((p) => !isEmptyPersonRow(p));
      const sortedFilled = sortPersonsDefault(filledRows);
      return [...emptyRows, ...sortedFilled].map((p) => p.id);
    });
  }, [persons, locale]);

  useEffect(() => {
    // Reorder only on explicit sort change (not on every cell edit).
    setSessionOrderIds(() => {
      const nextPersons = personsRef.current;
      const emptyRows = nextPersons.filter(isEmptyPersonRow);
      const filledRows = nextPersons.filter((p) => !isEmptyPersonRow(p));
      const sortedFilled = sortConfig
        ? sortPersonsByColumn(filledRows, sortConfig.key, sortConfig.direction)
        : sortPersonsDefault(filledRows);
      return [...emptyRows, ...sortedFilled].map((p) => p.id);
    });
  }, [sortConfig]);

  useEffect(() => {
    // Keep current visual order during edits; only reconcile add/remove rows.
    setSessionOrderIds((prev) => {
      const currentIds = persons.map((p) => p.id);
      const currentSet = new Set(currentIds);
      const kept = prev.filter((id) => currentSet.has(id));
      const keptSet = new Set(kept);
      const added = currentIds.filter((id) => !keptSet.has(id));
      if (added.length === 0 && kept.length === prev.length) return prev;
      return [...kept, ...added];
    });
  }, [persons]);

  useEffect(() => {
    setSelectedIds((prev) => {
      const ids = new Set(persons.map((p) => p.id));
      const next = new Set<string>();
      prev.forEach((id) => {
        if (ids.has(id)) next.add(id);
      });
      return next;
    });
  }, [persons]);

  const sortedPersons = useMemo(() => {
    const byId = new Map(persons.map((p) => [p.id, p] as const));
    const ordered = sessionOrderIds
      .map((id) => byId.get(id))
      .filter((p): p is Person => Boolean(p));
    if (ordered.length === persons.length) return ordered;
    const seen = new Set(ordered.map((p) => p.id));
    const tail = persons.filter((p) => !seen.has(p.id));
    return [...ordered, ...tail];
  }, [persons, sessionOrderIds]);

  const personIndexById = useMemo(
    () => new Map(persons.map((p, idx) => [p.id, idx] as const)),
    [persons]
  );

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

  const updatePerson = useCallback((index: number, field: keyof Person, value: Person[keyof Person]) => {
    setPersons((prev) => {
      const id = prev[index]?.id;
      if (
        id &&
        (field === 'firstName' || field === 'lastName' || field === 'patronymic')
      ) {
        addPersonNameLock(id);
      }
      const next = [...prev];
      const p = { ...next[index]! };
      (p as Record<string, unknown>)[field] = value;
      next[index] = p;
      return next;
    });
  }, []);

  const setParent = useCallback((index: number, type: 'father' | 'mother', personId: string) => {
    setPersons((prev) => {
      const next = [...prev];
      const p = { ...next[index]! };
      if (type === 'father') p.fatherId = personId || undefined;
      else p.motherId = personId || undefined;
      next[index] = p;
      return next;
    });
  }, []);

  const getParentId = useCallback((person: Person, type: 'father' | 'mother') => {
    return type === 'father' ? (person.fatherId ?? '') : (person.motherId ?? '');
  }, []);

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

  const addRow = useCallback(() => {
    setPersons((prev) => {
      const newPerson: Person = {
        id: nextPersonId(prev),
        firstName: '',
        birthPlace: '',
        residenceCity: '',
        occupation: '',
        comment: '',
        gender: 'm',
      };
      // New empty row should appear at the top immediately.
      setSessionOrderIds((order) => [newPerson.id, ...order.filter((id) => id !== newPerson.id)]);
      return [newPerson, ...prev];
    });
  }, []);

  const removeSelectedRows = useCallback(() => {
    setPersons((prev) => prev.filter((p) => !selectedIds.has(p.id)));
    setSelectedIds(new Set());
    setConfirmBulkDeleteOpen(false);
  }, [selectedIds]);

  const requestDeleteSelectedRows = useCallback(() => {
    if (selectedIds.size === 0) return;
    setConfirmBulkDeleteOpen(true);
  }, [selectedIds]);

  const cycleSort = useCallback((key: SortKey) => {
    setSortConfig((prev) => {
      if (!prev || prev.key !== key) return { key, direction: 'asc' };
      if (prev.direction === 'asc') return { key, direction: 'desc' };
      return null;
    });
  }, []);

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

  const knownCityNames = useMemo(() => {
    const byKey = new Map<string, string>();
    Object.keys(placeFallbacks).forEach((key) => byKey.set(key, key));
    persons.forEach((person) => {
      const cities = [
        ...(person.birthPlace?.trim() ? [person.birthPlace] : []),
        ...splitPlaceList(person.residenceCity),
      ];
      cities.forEach((city) => {
        const normalized = normalizePlace(city);
        if (!normalized) return;
        const key = toPlaceFallbackKey(normalized);
        if (!byKey.has(key)) byKey.set(key, normalized);
      });
    });
    return [...byKey.values()];
  }, [persons, placeFallbacks]);

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

  void knownCityNames;

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
      const leaflet = await initLeafletMap(cityMapHostRef.current!, center, zoom);
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
      destroyLeafletMap(cityMapHostRef.current);
    };
  }, [cityReview]);

  return (
    <div className="space-y-2">
      <div className="overflow-auto border border-(--border) bg-(--paper) max-h-[calc(100vh-142px)] md:max-h-[calc(100vh-126px)]">
        <table className="w-full min-w-[800px] border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-(--surface) shadow-[0_1px_0_0_var(--border-subtle)]">
            <tr className="border-b border-(--border)">
              <th className="w-14 p-2 text-center" title={t('adminRemove')}>
                <input
                  type="checkbox"
                  checked={persons.length > 0 && selectedIds.size === persons.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedIds(new Set(persons.map((p) => p.id)));
                    } else {
                      setSelectedIds(new Set());
                    }
                  }}
                  aria-label={t('adminSelectAllRows')}
                />
              </th>
              <th
                style={{ width: 56, minWidth: 56, maxWidth: 56 }}
                className="border-l border-(--border-subtle) p-2 text-center font-medium text-(--ink) whitespace-nowrap"
                title={t('adminRootColumn')}
              >
                {t('adminRootColumn')}
              </th>
              {COLUMNS.map((col) => (
                <th
                  key={col}
                  style={{ width: columnWidths[col], minWidth: columnWidths[col] }}
                  className="group relative cursor-pointer select-none border-l border-(--border-subtle) p-2 pr-3 text-left font-medium text-(--ink)"
                  onClick={() => cycleSort(col)}
                >
                  <span className="inline-flex items-center gap-1">
                    {COLUMN_LABELS[col] ? t(COLUMN_LABELS[col]!) : col}
                    <span className="text-[10px] font-normal leading-none opacity-70">
                      {sortConfig?.key === col
                        ? sortConfig.direction === 'asc'
                          ? '▲'
                          : '▼'
                        : ''}
                    </span>
                  </span>
                  {renderResizeHandle(col)}
                </th>
              ))}
              <th
                style={{ width: columnWidths.avatar, minWidth: columnWidths.avatar }}
                className="group relative border-l border-(--border-subtle) p-1 pr-3 text-center font-medium text-(--ink)"
              >
                {t('adminPortraitColumn')}
                {renderResizeHandle('avatar')}
              </th>
              <th
                style={{ width: columnWidths.father, minWidth: columnWidths.father }}
                className="group relative border-l border-(--border-subtle) p-2 pr-3 text-left font-medium text-(--ink)"
              >
                {t('adminFatherColumn')}
                {renderResizeHandle('father')}
              </th>
              <th
                style={{ width: columnWidths.mother, minWidth: columnWidths.mother }}
                className="group relative border-l border-(--border-subtle) p-2 text-left font-medium text-(--ink)"
              >
                {t('adminMotherColumn')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedPersons.map((person, displayIdx) => {
              const actualIdx = personIndexById.get(person.id) ?? -1;
              if (actualIdx < 0) return null;
              const isRoot = person.id === rootPersonId;
              return (
              <tr
                key={person.id + displayIdx}
                className="border-b border-(--border-subtle) hover:bg-(--paper-light)/50"
              >
                <td className="p-1 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(person.id)}
                    onChange={(e) => {
                      setSelectedIds((prev) => {
                        const next = new Set(prev);
                        if (e.target.checked) next.add(person.id);
                        else next.delete(person.id);
                        return next;
                      });
                    }}
                    aria-label={t('adminSelectRowAria', { name: getFullName(person) || person.id })}
                  />
                </td>
                <td
                  style={{ width: 56, minWidth: 56, maxWidth: 56 }}
                  className="border-l border-(--border-subtle) p-1 text-center"
                >
                  {isRoot ? (
                    <span className="text-(--accent)" title={t('adminRootColumn')}>★</span>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetRootClick(person.id)}
                      className="mx-auto block w-8 rounded py-1"
                      title={t('adminRootColumn')}
                      aria-label={t('adminRootChangeConfirm')}
                    >
                      —
                    </Button>
                  )}
                </td>
                {COLUMNS.map((col) => (
                  <td
                    key={col}
                    style={{ width: columnWidths[col], minWidth: columnWidths[col] }}
                    className="border-l border-(--border-subtle) p-1"
                  >
                    {col === 'gender' ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          updatePerson(actualIdx, 'gender', (person.gender === 'f' ? 'm' : 'f') as 'm' | 'f')
                        }
                        className="min-w-[2rem] font-medium"
                        title={t('adminGender')}
                      >
                        {(person.gender ?? 'm') === 'f' ? t('adminGenderF') : t('adminGenderM')}
                      </Button>
                    ) : (
                      <Input
                        value={String((person as unknown as Record<string, unknown>)[col] ?? '')}
                        onChange={(e) =>
                          updatePerson(actualIdx, col, e.target.value)
                        }
                        onBlur={(e) => {
                          if (col === 'birthPlace' || col === 'residenceCity') {
                            void handleCityBlur(actualIdx, col, e.target.value);
                          }
                        }}
                        className="min-w-[80px]"
                      />
                    )}
                  </td>
                ))}
                <td
                  style={{ width: columnWidths.avatar, minWidth: columnWidths.avatar }}
                  className="border-l border-(--border-subtle) p-0.5 align-middle text-center"
                >
                  {(() => {
                    const avatar = getAvatarForPerson(person.id, person.avatarPhotoSrc);
                    return (
                      <button
                        type="button"
                        onClick={() => setAvatarPickerRowIdx(actualIdx)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-(--border-subtle) bg-(--paper-light) hover:border-(--accent) focus:outline-none"
                        title={t('adminSelectAvatar')}
                        aria-label={t('adminSelectAvatar')}
                      >
                        {avatar ? (
                          <FaceThumbnail source={avatar} size={28} />
                        ) : (
                          <ImageIcon className="size-3.5 text-(--ink-muted)" aria-hidden />
                        )}
                      </button>
                    );
                  })()}
                </td>
                {(['father', 'mother'] as const).map((type) => {
                  const parentId = getParentId(person, type);
                  const parent = parentId ? persons.find((p) => p.id === parentId) : null;
                  const isOpen = parentPicker?.rowIdx === actualIdx && parentPicker?.type === type;
                  return (
                    <td
                      key={type}
                      style={{ width: columnWidths[type], minWidth: columnWidths[type] }}
                      className="relative border-l border-(--border-subtle) p-1"
                    >
                      <div className="relative min-w-0" ref={isOpen ? parentPickerRef : undefined}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setParentPicker({ rowIdx: actualIdx, type });
                            setParentPickerQuery('');
                          }}
                          className="w-full justify-start truncate font-normal"
                          title={type === 'father' ? t('adminFatherColumn') : t('adminMotherColumn')}
                        >
                          {parent ? getFullName(parent) || parent.id : '—'}
                        </Button>
                        {isOpen && (
                          <div className="absolute left-0 top-full z-20 mt-1 min-w-[200px] rounded-lg border border-(--border) bg-(--paper) p-2 shadow-lg">
                            <Input
                              type="text"
                              value={parentPickerQuery}
                              onChange={(e) => setParentPickerQuery(e.target.value)}
                              placeholder={t('adminSearchPersons')}
                              className="mb-2"
                              autoFocus
                            />
                            <ul className="max-h-40 overflow-y-auto">
                              <li>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setParent(actualIdx, type, '');
                                    setParentPicker(null);
                                  }}
                                  className="w-full justify-start"
                                >
                                  —
                                </Button>
                              </li>
                              {filteredPickerPersons
                                .filter((p) => p.id !== person.id)
                                .map((p) => (
                                  <li key={p.id}>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setParent(actualIdx, type, p.id);
                                        setParentPicker(null);
                                      }}
                                      className="w-full justify-start truncate font-normal"
                                    >
                                      {getFullName(p) || p.id}
                                    </Button>
                                  </li>
                                ))}
                              {filteredPickerPersons.filter((p) => p.id !== person.id).length === 0 && parentPickerQuery.trim() && (
                                <li className="px-2 py-1 text-sm text-(--ink-muted)">
                                  {t('adminNoPersonsMatch')}
                                </li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
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
        onConfirm={removeSelectedRows}
      >
        {t('adminDeleteRowsConfirm', { count: selectedIds.size })}
      </Dialog>

      {avatarPickerRowIdx !== null && (() => {
        const person = persons[avatarPickerRowIdx]!;
        const optionsRaw = getAvatarOptionsForPersonFromList(photos, person.id);
        const categoryBySrc = new Map(photos.map((p) => [p.src, p.category] as const));
        const options = [
          ...optionsRaw.filter((opt) => categoryBySrc.get(opt.src) === 'personal'),
          ...optionsRaw.filter((opt) => categoryBySrc.get(opt.src) === 'group'),
        ];
        return (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
            role="dialog"
            aria-modal
            aria-label={t('adminChoosePortrait')}
          >
            <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl border-2 border-(--border) bg-(--surface) p-4 shadow-xl">
              <h2 className="mb-3 text-center text-lg font-semibold text-(--ink)">
                {t('adminChoosePortrait')}
              </h2>
              <div className="min-h-0 flex-1 overflow-y-auto">
                {options.length === 0 ? (
                  <p className="text-center text-(--ink-muted)">{t('noPhotosYet')}</p>
                ) : (
                  <div className="flex justify-center">
                    <div className="flex w-full max-w-3xl flex-wrap justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          updatePerson(avatarPickerRowIdx, 'avatarPhotoSrc', undefined);
                          setAvatarPickerRowIdx(null);
                        }}
                        className="flex h-[88px] w-[88px] flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-(--border-subtle) p-2 text-(--ink-muted) hover:border-(--accent) hover:bg-(--paper-light)"
                      >
                        <span className="text-2xl">—</span>
                        <span className="text-xs">{t('adminAvatarDefault')}</span>
                      </button>
                      {options.map((opt, i) => (
                        <button
                          key={`${opt.src}-${i}`}
                          type="button"
                          onClick={() => {
                            updatePerson(avatarPickerRowIdx, 'avatarPhotoSrc', opt.src);
                            setAvatarPickerRowIdx(null);
                          }}
                          className={`flex h-[88px] w-[88px] flex-col items-center justify-center gap-1 rounded-lg border-2 p-2 focus:outline-none ${
                            person.avatarPhotoSrc === opt.src
                              ? 'border-(--accent) bg-(--paper-light)'
                              : 'border-(--border-subtle) hover:border-(--accent)'
                          }`}
                        >
                          <FaceThumbnail source={opt} size={56} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-3 flex justify-center">
                <Button variant="secondary" onClick={() => setAvatarPickerRowIdx(null)}>
                  {t('adminCancel')}
                </Button>
              </div>
            </div>
          </div>
        );
      })()}

      {cityReview && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal
          aria-label="City review"
        >
          <div className="w-full max-w-lg rounded-xl border-2 border-(--border) bg-(--surface) p-4 shadow-xl">
            <h3 className="mb-2 text-center text-lg font-semibold text-(--ink)">
              Новый город: {cityReview.city}
            </h3>
            <p className="mb-2 text-sm text-(--ink-muted)">
              {cityReview.geocodedPoint
                ? 'Координаты найдены через геокодер. Можно оставить как есть, скорректировать вручную или кликнуть точку на карте.'
                : 'Координаты не найдены автоматически. Введите их вручную или кликните на карте.'}
            </p>
            <div className="mb-3 grid grid-cols-2 gap-2">
              <Input
                value={cityReview.manualLat}
                onChange={(e) =>
                  setCityReview((prev) =>
                    prev ? { ...prev, manualLat: e.target.value } : prev
                  )
                }
                placeholder="lat"
              />
              <Input
                value={cityReview.manualLon}
                onChange={(e) =>
                  setCityReview((prev) =>
                    prev ? { ...prev, manualLon: e.target.value } : prev
                  )
                }
                placeholder="lon"
              />
            </div>
            <div
              ref={cityMapHostRef}
              className="mb-3 h-56 w-full overflow-hidden rounded border border-(--border-subtle)"
            />
            <div className="flex justify-center gap-2">
              <Button variant="secondary" onClick={() => setCityReview(null)}>
                Отмена
              </Button>
              <Button
                variant="primary"
                disabled={!Number.isFinite(Number(cityReview.manualLat.replace(',', '.'))) || !Number.isFinite(Number(cityReview.manualLon.replace(',', '.')))}
                onClick={() => {
                  const lat = Number(cityReview.manualLat.replace(',', '.'));
                  const lon = Number(cityReview.manualLon.replace(',', '.'));
                  if (Number.isFinite(lat) && Number.isFinite(lon)) {
                    upsertPlaceFallback(cityReview.city, { lat, lon });
                  }
                  setCityReview(null);
                }}
              >
                Применить
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
