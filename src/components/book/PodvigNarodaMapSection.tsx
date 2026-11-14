'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
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
import { ARCHIVE_SEARCH_MIN_QUERY, ArchiveNameSearch } from './ArchiveNameSearch';
import { useArchiveYearRange } from './useArchiveYearRange';
import { useIndexedEventsMap, type IndexedMapFocusTarget } from './useIndexedEventsMap';
import { YearArchiveRangeSlider } from './YearArchiveRangeSlider';

const MAX_SUGGESTIONS = 40;

type Props = {
  locale: Locale;
  t: TranslationFn;
  placeFallbacks: Record<string, GeocodedPoint>;
  mapAriaLabelKey?: string;
};

/** "Podvig Naroda" map: clusters by draft / registration place, timeline by birth year. */
export function PodvigNarodaMapSection({
  locale,
  t,
  placeFallbacks,
  mapAriaLabelKey = 'mapLayerPodvigNaroda',
}: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null);

  const placeFallbacksForGeo = useMemo(
    () =>
      mergeMapPlaceGeoOverlay(mergeMapPlaceGeoOverlay(placeFallbacks, 'extended'), 'podvigDraft'),
    [placeFallbacks],
  );

  const indexedGeoOptions = useMemo((): IndexedEventGeoResolveOptions | undefined => {
    return placeFallbacks.sumy ? { defaultWhenUnresolved: placeFallbacks.sumy } : undefined;
  }, [placeFallbacks.sumy]);

  const allRows = useMemo(
    () => buildPodvigTimelineRows(getPodvigNarodaRecords(), placeFallbacksForGeo, indexedGeoOptions),
    [placeFallbacksForGeo, indexedGeoOptions],
  );

  const bounds = useMemo(() => getPodvigMapYearBounds(allRows), [allRows]);
  const { sliderRange, mapRange, setSliderRange, jumpToYear } = useArchiveYearRange(bounds);
  const [nameQuery, setNameQuery] = useState('');
  const [focusTarget, setFocusTarget] = useState<IndexedMapFocusTarget | null>(null);

  const normalizedQuery = nameQuery.trim().toLocaleLowerCase();
  const nameFilteredRows = useMemo(() => {
    if (!normalizedQuery) return allRows;
    return allRows.filter((r) => podvigPersonMatchesSearch(r.displayName, normalizedQuery));
  }, [normalizedQuery, allRows]);

  const nameSearchSuggestions = useMemo(() => {
    if (normalizedQuery.length < ARCHIVE_SEARCH_MIN_QUERY) return [];
    const sorted = [...nameFilteredRows].sort((a, b) => {
      const na = formatNameByLocale(a.displayName, locale);
      const nb = formatNameByLocale(b.displayName, locale);
      const byName = na.localeCompare(nb, undefined, { sensitivity: 'base' });
      if (byName !== 0) return byName;
      return b.birthYear - a.birthYear;
    });
    return sorted.slice(0, MAX_SUGGESTIONS);
  }, [normalizedQuery, nameFilteredRows, locale]);

  /** Distinct persons per birth year (one person may have several records). */
  const countsByYear = useMemo(() => {
    const span = bounds.max - bounds.min + 1;
    const sets = Array.from({ length: span }, () => new Set<string>());
    for (const r of nameFilteredRows) {
      if (r.birthYear >= bounds.min && r.birthYear <= bounds.max) {
        sets[r.birthYear - bounds.min]!.add(r.personKey);
      }
    }
    return sets.map((s) => s.size);
  }, [bounds.min, bounds.max, nameFilteredRows]);

  const sliderEventCount = useMemo(
    () =>
      nameFilteredRows.reduce(
        (n, r) => n + (r.birthYear >= sliderRange.lo && r.birthYear <= sliderRange.hi ? 1 : 0),
        0,
      ),
    [nameFilteredRows, sliderRange.lo, sliderRange.hi],
  );

  const filteredRows = useMemo(
    () => nameFilteredRows.filter((r) => r.birthYear >= mapRange.lo && r.birthYear <= mapRange.hi),
    [nameFilteredRows, mapRange.lo, mapRange.hi],
  );

  const markers = useMemo(
    () => buildPodvigMapMarkers(filteredRows, t, locale, placeFallbacksForGeo, indexedGeoOptions),
    [filteredRows, t, locale, placeFallbacksForGeo, indexedGeoOptions],
  );

  const onFocusDone = useCallback(() => setFocusTarget(null), []);

  useIndexedEventsMap({
    containerRef: mapRef,
    locale,
    t,
    markers,
    focusTarget,
    onFocusDone,
  });

  const pickSuggestion = useCallback(
    (row: PodvigMapTimelineRow) => {
      jumpToYear(row.birthYear);
      setFocusTarget({
        hitId: row.mapEntryId,
        factType: PODVIG_NARODA_MAP_FACT_TYPE,
        year: row.birthYear,
      });
    },
    [jumpToYear],
  );

  const onYearRangeChange = useCallback(
    ({ low, high }: { low: number; high: number }) => setSliderRange({ lo: low, hi: high }),
    [setSliderRange],
  );

  const toOption = useCallback(
    (row: PodvigMapTimelineRow, idx: number) => {
      const name = formatNameByLocale(row.displayName, locale);
      const place = row.placeLabel ? formatPlaceLabelForLocale(row.placeLabel, locale) : '';
      const extra = row.records.length > 1 ? ` (+${row.records.length - 1})` : '';
      const factAndYear = `${row.birthYear} · ${podvigRecordSubtitle(row.records[0]!)}${extra}`;
      const placePart = place ? ` · ${place}` : '';
      return {
        key: `${row.mapEntryId}-${idx}`,
        primary: name,
        secondary: `${factAndYear}${placePart}`,
        ariaLabel: t('mapArchiveSearchOptionAria', { name, factAndYear, placePart }),
      };
    },
    [locale, t],
  );

  return (
    <>
      <div className="mb-1.5 shrink-0">
        <YearArchiveRangeSlider
          minBound={bounds.min}
          maxBound={bounds.max}
          low={sliderRange.lo}
          high={sliderRange.hi}
          eventCount={sliderEventCount}
          countsByYear={countsByYear}
          t={t}
          onChange={onYearRangeChange}
        />
      </div>
      <div className="relative z-0 min-h-0 flex-1 overflow-hidden rounded-md border border-(--ink-muted)/25">
        <div className="pointer-events-none absolute left-2 right-2 top-2 z-[450] flex justify-end">
          <ArchiveNameSearch
            id="podvig-map-name"
            t={t}
            query={nameQuery}
            onQueryChange={setNameQuery}
            suggestions={nameSearchSuggestions}
            toOption={toOption}
            onPick={pickSuggestion}
          />
        </div>
        <div ref={mapRef} className="h-full w-full" aria-label={t(mapAriaLabelKey)} />
      </div>
    </>
  );
}
