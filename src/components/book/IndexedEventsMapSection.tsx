'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import type { Locale } from '@/lib/i18n/config';
import type { TranslationFn } from '@/lib/i18n/types';
import type { GeocodedPoint } from '@/lib/constants/map';
import {
  INDEXED_EVENTS,
  buildIndexedMapMarkers,
  getIndexedEventYearBounds,
  indexedEventFactTypeLabel,
  indexedEventPrincipalMatchesSearch,
  type IndexedEvent,
  type IndexedEventGeoResolveOptions,
} from '@/lib/data/indexedEventsMap';
import { formatPlaceLabelForLocale } from '@/lib/utils/mapPlace';
import { formatNameByLocale } from '@/lib/utils/person';
import { ARCHIVE_SEARCH_MIN_QUERY, ArchiveNameSearch } from './ArchiveNameSearch';
import { useArchiveYearRange } from './useArchiveYearRange';
import { useIndexedEventsMap, type IndexedMapFocusTarget } from './useIndexedEventsMap';
import { YearArchiveRangeSlider } from './YearArchiveRangeSlider';

const MAX_SUGGESTIONS = 40;

type ArchiveMapBodyProps = {
  locale: Locale;
  t: TranslationFn;
  /** Defaults to the main bundle from `indexedEventsMap` (`indexedEvents.json`). */
  events?: IndexedEvent[];
  /** Used to place events without lat/lon (same lookup as the family map). */
  placeFallbacksForGeo?: Record<string, GeocodedPoint>;
  /** Fallback point for unresolved places (see indexed-layer presets in `bookMapLayers.json`). */
  indexedGeoOptions?: IndexedEventGeoResolveOptions;
  /** Full aria-label for the map (see `familyLineLabels.json`). */
  mapAriaLabel: string;
};

/** FamilySearch archive map: year timeline, name search, clustered markers. */
export function ArchiveIndexedMapBody({
  locale,
  t,
  events: eventsProp,
  placeFallbacksForGeo,
  indexedGeoOptions,
  mapAriaLabel,
}: ArchiveMapBodyProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const events = eventsProp ?? INDEXED_EVENTS;
  const bounds = useMemo(() => getIndexedEventYearBounds(events), [events]);
  const { sliderRange, mapRange, setSliderRange, jumpToYear } = useArchiveYearRange(bounds);
  const [nameQuery, setNameQuery] = useState('');
  const [focusTarget, setFocusTarget] = useState<IndexedMapFocusTarget | null>(null);

  const normalizedQuery = nameQuery.trim().toLocaleLowerCase();
  const nameFilteredEvents = useMemo(() => {
    if (!normalizedQuery) return events;
    return events.filter((e) => indexedEventPrincipalMatchesSearch(e.principalName, normalizedQuery));
  }, [normalizedQuery, events]);

  const nameSearchSuggestions = useMemo(() => {
    if (normalizedQuery.length < ARCHIVE_SEARCH_MIN_QUERY) return [];
    const sorted = [...nameFilteredEvents].sort((a, b) => {
      const na = formatNameByLocale(a.principalName, locale);
      const nb = formatNameByLocale(b.principalName, locale);
      const byName = na.localeCompare(nb, undefined, { sensitivity: 'base' });
      if (byName !== 0) return byName;
      return b.year - a.year;
    });
    return sorted.slice(0, MAX_SUGGESTIONS);
  }, [normalizedQuery, nameFilteredEvents, locale]);

  const countsByYear = useMemo(() => {
    const arr = new Array<number>(bounds.max - bounds.min + 1).fill(0);
    for (const e of nameFilteredEvents) {
      if (e.year >= bounds.min && e.year <= bounds.max) {
        arr[e.year - bounds.min] += 1;
      }
    }
    return arr;
  }, [bounds.min, bounds.max, nameFilteredEvents]);

  const sliderEventCount = useMemo(
    () =>
      nameFilteredEvents.reduce(
        (n, e) => n + (e.year >= sliderRange.lo && e.year <= sliderRange.hi ? 1 : 0),
        0,
      ),
    [nameFilteredEvents, sliderRange.lo, sliderRange.hi],
  );

  const filteredEvents = useMemo(
    () => nameFilteredEvents.filter((e) => e.year >= mapRange.lo && e.year <= mapRange.hi),
    [nameFilteredEvents, mapRange.lo, mapRange.hi],
  );

  const markers = useMemo(
    () => buildIndexedMapMarkers(filteredEvents, t, locale, placeFallbacksForGeo, indexedGeoOptions),
    [filteredEvents, t, locale, placeFallbacksForGeo, indexedGeoOptions],
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
    (e: IndexedEvent) => {
      jumpToYear(e.year);
      setFocusTarget({ hitId: e.hitId, factType: e.factType, year: e.year });
    },
    [jumpToYear],
  );

  const onYearRangeChange = useCallback(
    ({ low, high }: { low: number; high: number }) => setSliderRange({ lo: low, hi: high }),
    [setSliderRange],
  );

  const toOption = useCallback(
    (e: IndexedEvent, idx: number) => {
      const name = formatNameByLocale(e.principalName, locale);
      const place = e.placeLabel ? formatPlaceLabelForLocale(e.placeLabel, locale) : '';
      const factAndYear = `${indexedEventFactTypeLabel(t, e.factType)} · ${e.year}`;
      const placePart = place ? ` · ${place}` : '';
      return {
        key: `${e.hitId}-${e.factType}-${e.year}-${idx}`,
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
            id="indexed-map-name"
            t={t}
            query={nameQuery}
            onQueryChange={setNameQuery}
            suggestions={nameSearchSuggestions}
            toOption={toOption}
            onPick={pickSuggestion}
          />
        </div>
        <div ref={mapRef} className="h-full w-full" aria-label={mapAriaLabel} />
      </div>
    </>
  );
}
