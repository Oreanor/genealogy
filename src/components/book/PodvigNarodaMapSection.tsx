'use client';

import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Locale } from '@/lib/i18n/config';
import type { TranslationFn } from '@/lib/i18n/types';
import type { GeocodedPoint } from '@/lib/constants/map';
import { getPodvigNarodaRecords } from '@/lib/data/podvigNaroda';
import {
  buildPodvigMapMarkers,
  buildPodvigTimelineRows,
  getPodvigMapYearBounds,
  PODVIG_NARODA_MAP_FACT_TYPE,
  podvigPersonMatchesSearch,
  podvigRecordSubtitle,
  type PodvigMapTimelineRow,
} from '@/lib/data/podvigNarodaMap';
import { mergeMapPlaceGeoOverlay } from '@/lib/data/mapPlaceGeoOverlay';
import type { IndexedEventGeoResolveOptions } from '@/lib/data/indexedEventsMap';
import { formatNameByLocale } from '@/lib/utils/person';
import { formatPlaceLabelForLocale } from '@/lib/utils/mapPlace';
import { useIndexedEventsMap, type IndexedMapFocusTarget } from './useIndexedEventsMap';
import { YearArchiveRangeSlider } from './YearArchiveRangeSlider';

type Props = {
  locale: Locale;
  t: TranslationFn;
  placeFallbacks: Record<string, GeocodedPoint>;
  mapAriaLabelKey?: string;
};

/** Карта «Подвиг народа»: кластеры по месту призыва / учётной локации, таймлайн по году рождения. */
export function PodvigNarodaMapSection({
  locale,
  t,
  placeFallbacks,
  mapAriaLabelKey = 'mapLayerPodvigNaroda',
}: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const searchWrapRef = useRef<HTMLDivElement | null>(null);

  const placeFallbacksForGeo = useMemo(() => {
    let m = mergeMapPlaceGeoOverlay(placeFallbacks, 'extended');
    m = mergeMapPlaceGeoOverlay(m, 'podvigDraft');
    return m;
  }, [placeFallbacks]);

  const indexedGeoOptions = useMemo((): IndexedEventGeoResolveOptions | undefined => {
    return placeFallbacks.sumy ? { defaultWhenUnresolved: placeFallbacks.sumy } : undefined;
  }, [placeFallbacks.sumy]);

  const allRows = useMemo(
    () => buildPodvigTimelineRows(getPodvigNarodaRecords(), placeFallbacksForGeo, indexedGeoOptions),
    [placeFallbacksForGeo, indexedGeoOptions],
  );

  const bounds = useMemo(() => getPodvigMapYearBounds(allRows), [allRows]);
  const [yearFrom, setYearFrom] = useState(bounds.min);
  const [yearTo, setYearTo] = useState(bounds.max);
  const [mapYearFrom, setMapYearFrom] = useState(bounds.min);
  const [mapYearTo, setMapYearTo] = useState(bounds.max);
  const mapRangeRafRef = useRef<number | null>(null);
  const pendingMapRangeRef = useRef({ lo: bounds.min, hi: bounds.max });
  const [nameQuery, setNameQuery] = useState('');
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [focusTarget, setFocusTarget] = useState<IndexedMapFocusTarget | null>(null);

  const normalizedQuery = nameQuery.trim().toLocaleLowerCase();
  const nameFilteredRows = useMemo(() => {
    if (!normalizedQuery) return allRows;
    return allRows.filter((r) => podvigPersonMatchesSearch(r.displayName, normalizedQuery));
  }, [normalizedQuery, allRows]);

  const nameSearchSuggestions = useMemo(() => {
    if (normalizedQuery.length < 3) return [];
    const cap = 40;
    const sorted = [...nameFilteredRows].sort((a, b) => {
      const na = formatNameByLocale(a.displayName, locale);
      const nb = formatNameByLocale(b.displayName, locale);
      const byName = na.localeCompare(nb, undefined, { sensitivity: 'base' });
      if (byName !== 0) return byName;
      return b.birthYear - a.birthYear;
    });
    return sorted.slice(0, cap);
  }, [normalizedQuery, nameFilteredRows, locale]);

  const countsByYear = useMemo(() => {
    const span = bounds.max - bounds.min + 1;
    const arr = new Array<number>(span).fill(0);
    const sets = Array.from({ length: span }, () => new Set<string>());
    for (const r of nameFilteredRows) {
      if (r.birthYear >= bounds.min && r.birthYear <= bounds.max) {
        sets[r.birthYear - bounds.min]!.add(r.personKey);
      }
    }
    for (let i = 0; i < span; i += 1) {
      arr[i] = sets[i]!.size;
    }
    return arr;
  }, [bounds.min, bounds.max, nameFilteredRows]);

  const clampedFrom = Math.min(Math.max(yearFrom, bounds.min), bounds.max);
  const clampedTo = Math.min(Math.max(yearTo, bounds.min), bounds.max);
  const lo = Math.min(clampedFrom, clampedTo);
  const hi = Math.max(clampedFrom, clampedTo);

  const mapClampedFrom = Math.min(Math.max(mapYearFrom, bounds.min), bounds.max);
  const mapClampedTo = Math.min(Math.max(mapYearTo, bounds.min), bounds.max);
  const mapLo = Math.min(mapClampedFrom, mapClampedTo);
  const mapHi = Math.max(mapClampedFrom, mapClampedTo);

  const sliderEventCount = useMemo(
    () => nameFilteredRows.reduce((n, r) => n + (r.birthYear >= lo && r.birthYear <= hi ? 1 : 0), 0),
    [nameFilteredRows, lo, hi],
  );

  const filteredRows = useMemo(
    () => nameFilteredRows.filter((r) => r.birthYear >= mapLo && r.birthYear <= mapHi),
    [nameFilteredRows, mapLo, mapHi],
  );

  const markers = useMemo(
    () => buildPodvigMapMarkers(filteredRows, t, locale, placeFallbacksForGeo, indexedGeoOptions),
    [filteredRows, t, locale, placeFallbacksForGeo, indexedGeoOptions],
  );

  const onFocusDone = useCallback(() => {
    setFocusTarget(null);
  }, []);

  useIndexedEventsMap({
    containerRef: mapRef,
    locale,
    t,
    markers,
    focusTarget,
    onFocusDone,
  });

  const cancelMapRangeRaf = useCallback(() => {
    if (mapRangeRafRef.current != null) {
      cancelAnimationFrame(mapRangeRafRef.current);
      mapRangeRafRef.current = null;
    }
  }, []);

  const flushMapRangeToState = useCallback(() => {
    mapRangeRafRef.current = null;
    const { lo: nextLo, hi: nextHi } = pendingMapRangeRef.current;
    startTransition(() => {
      setMapYearFrom(nextLo);
      setMapYearTo(nextHi);
    });
  }, []);

  const scheduleMapRangeSync = useCallback(() => {
    if (mapRangeRafRef.current != null) return;
    mapRangeRafRef.current = requestAnimationFrame(flushMapRangeToState);
  }, [flushMapRangeToState]);

  useEffect(() => {
    return () => cancelMapRangeRaf();
  }, [cancelMapRangeRaf]);

  useEffect(() => {
    setYearFrom(bounds.min);
    setYearTo(bounds.max);
    pendingMapRangeRef.current = { lo: bounds.min, hi: bounds.max };
    cancelMapRangeRaf();
    setMapYearFrom(bounds.min);
    setMapYearTo(bounds.max);
  }, [bounds.min, bounds.max, cancelMapRangeRaf]);

  useEffect(() => {
    if (normalizedQuery.length < 3) setSuggestOpen(false);
  }, [normalizedQuery]);

  useEffect(() => {
    const onDocPointerDown = (ev: PointerEvent) => {
      const root = searchWrapRef.current;
      if (!root || !suggestOpen) return;
      if (ev.target instanceof Node && root.contains(ev.target)) return;
      setSuggestOpen(false);
    };
    document.addEventListener('pointerdown', onDocPointerDown, true);
    return () => document.removeEventListener('pointerdown', onDocPointerDown, true);
  }, [suggestOpen]);

  const pickSuggestion = useCallback(
    (row: PodvigMapTimelineRow) => {
      cancelMapRangeRaf();
      setYearFrom(row.birthYear);
      setYearTo(row.birthYear);
      pendingMapRangeRef.current = { lo: row.birthYear, hi: row.birthYear };
      setMapYearFrom(row.birthYear);
      setMapYearTo(row.birthYear);
      setFocusTarget({ hitId: row.mapEntryId, factType: PODVIG_NARODA_MAP_FACT_TYPE, year: row.birthYear });
      setSuggestOpen(false);
    },
    [cancelMapRangeRaf],
  );

  const onYearRangeChange = useCallback(
    (next: { low: number; high: number }) => {
      setYearFrom(next.low);
      setYearTo(next.high);
      pendingMapRangeRef.current = { lo: next.low, hi: next.high };
      scheduleMapRangeSync();
    },
    [scheduleMapRangeSync],
  );

  return (
    <>
      <div className="mb-1.5 shrink-0">
        <YearArchiveRangeSlider
          minBound={bounds.min}
          maxBound={bounds.max}
          low={lo}
          high={hi}
          eventCount={sliderEventCount}
          countsByYear={countsByYear}
          t={t}
          onChange={onYearRangeChange}
        />
      </div>
      <div className="relative z-0 min-h-0 flex-1 overflow-hidden rounded-md border border-(--ink-muted)/25">
        <div className="pointer-events-none absolute left-2 right-2 top-2 z-[450] flex justify-end">
          <div ref={searchWrapRef} className="pointer-events-auto relative w-[min(20rem,70vw)]">
            <input
              type="search"
              value={nameQuery}
              onChange={(ev) => {
                setNameQuery(ev.target.value);
                if (ev.target.value.trim().length >= 3) setSuggestOpen(true);
              }}
              onFocus={() => {
                if (normalizedQuery.length >= 3) setSuggestOpen(true);
              }}
              onKeyDown={(ev) => {
                if (ev.key === 'Escape') {
                  ev.preventDefault();
                  setSuggestOpen(false);
                }
              }}
              placeholder={t('mapArchiveSearchPlaceholder')}
              className="h-8 w-full rounded-md border border-(--ink-muted)/45 bg-(--paper)/95 px-2 text-sm text-(--ink) shadow-sm backdrop-blur-[1px] outline-none placeholder:text-(--ink-muted)/80 focus:border-(--accent)"
              aria-label={t('mapArchiveSearchAria')}
              aria-expanded={suggestOpen && normalizedQuery.length >= 3}
              aria-controls="podvig-map-name-suggestions"
              autoComplete="off"
            />
            {suggestOpen && normalizedQuery.length >= 3 ? (
              <ul
                id="podvig-map-name-suggestions"
                role="listbox"
                aria-label={t('mapArchiveSearchListAria')}
                className="absolute left-0 right-0 top-full z-[460] mt-1 max-h-[min(16rem,40vh)] overflow-y-auto rounded-md border border-(--ink-muted)/40 bg-(--paper) py-1 text-sm text-(--ink) shadow-lg"
              >
                {nameSearchSuggestions.length === 0 ? (
                  <li className="px-2 py-2 text-xs text-(--ink-muted)" role="presentation">
                    {t('mapArchiveSearchNoResults')}
                  </li>
                ) : (
                  nameSearchSuggestions.map((row, idx) => {
                    const displayName = formatNameByLocale(row.displayName, locale);
                    const placeDisplay = row.placeLabel
                      ? formatPlaceLabelForLocale(row.placeLabel, locale)
                      : '';
                    const primary = podvigRecordSubtitle(row.records[0]!);
                    const extra =
                      row.records.length > 1 ? ` (+${row.records.length - 1})` : '';
                    const factAndYear = `${row.birthYear} · ${primary}${extra}`;
                    const placePart = placeDisplay ? ` · ${placeDisplay}` : '';
                    return (
                      <li key={`${row.mapEntryId}-${idx}`} role="presentation">
                        <button
                          type="button"
                          role="option"
                          aria-label={t('mapArchiveSearchOptionAria', {
                            name: displayName,
                            factAndYear,
                            placePart,
                          })}
                          className="flex w-full cursor-pointer flex-col gap-0.5 px-2 py-1.5 text-left hover:bg-(--ink-muted)/12"
                          onPointerDown={(ev) => {
                            ev.preventDefault();
                            pickSuggestion(row);
                          }}
                        >
                          <span className="font-medium leading-tight">{displayName}</span>
                          <span className="text-xs text-(--ink-muted)">
                            {factAndYear}
                            {placePart}
                          </span>
                        </button>
                      </li>
                    );
                  })
                )}
              </ul>
            ) : null}
          </div>
        </div>
        <div ref={mapRef} className="h-full w-full" aria-label={t(mapAriaLabelKey)} />
      </div>
    </>
  );
}
