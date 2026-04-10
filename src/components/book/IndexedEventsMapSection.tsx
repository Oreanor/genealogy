'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { useIndexedEventsMap, type IndexedMapFocusTarget } from './useIndexedEventsMap';
import { YearArchiveRangeSlider } from './YearArchiveRangeSlider';

type ArchiveMapBodyProps = {
  locale: Locale;
  t: TranslationFn;
  /** По умолчанию — индекс Никонцев (`indexedEvents.json`). */
  events?: IndexedEvent[];
  /** Если в событии нет lat/lon, подобрать точку из `placeFallbacks` (как на карте семьи). */
  placeFallbacksForGeo?: Record<string, GeocodedPoint>;
  /** Запасная точка и т.п. (например слой «Канивец»). */
  indexedGeoOptions?: IndexedEventGeoResolveOptions;
  /** Ключ i18n для aria-label карты. */
  mapAriaLabelKey?: string;
};

/** Архив FamilySearch: таймлайн по годам, поиск по имени, кластер маркеров. */
export function ArchiveIndexedMapBody({
  locale,
  t,
  events: eventsProp,
  placeFallbacksForGeo,
  indexedGeoOptions,
  mapAriaLabelKey = 'mapLayerArchives',
}: ArchiveMapBodyProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const searchWrapRef = useRef<HTMLDivElement | null>(null);
  const events = eventsProp ?? INDEXED_EVENTS;
  const bounds = useMemo(() => getIndexedEventYearBounds(events), [events]);
  const [yearFrom, setYearFrom] = useState(bounds.min);
  const [yearTo, setYearTo] = useState(bounds.max);
  const [nameQuery, setNameQuery] = useState('');
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [focusTarget, setFocusTarget] = useState<IndexedMapFocusTarget | null>(null);

  const normalizedQuery = nameQuery.trim().toLocaleLowerCase();
  const nameFilteredEvents = useMemo(() => {
    if (!normalizedQuery) return events;
    return events.filter((e) => indexedEventPrincipalMatchesSearch(e.principalName, normalizedQuery));
  }, [normalizedQuery, events]);

  const nameSearchSuggestions = useMemo(() => {
    if (normalizedQuery.length < 3) return [];
    const cap = 40;
    const sorted = [...nameFilteredEvents].sort((a, b) => {
      const na = formatNameByLocale(a.principalName, locale);
      const nb = formatNameByLocale(b.principalName, locale);
      const byName = na.localeCompare(nb, undefined, { sensitivity: 'base' });
      if (byName !== 0) return byName;
      return b.year - a.year;
    });
    return sorted.slice(0, cap);
  }, [normalizedQuery, nameFilteredEvents, locale]);

  const countsByYear = useMemo(() => {
    const span = bounds.max - bounds.min + 1;
    const arr = new Array<number>(span).fill(0);
    for (const e of nameFilteredEvents) {
      if (e.year >= bounds.min && e.year <= bounds.max) {
        arr[e.year - bounds.min] += 1;
      }
    }
    return arr;
  }, [bounds.min, bounds.max, nameFilteredEvents]);

  const clampedFrom = Math.min(Math.max(yearFrom, bounds.min), bounds.max);
  const clampedTo = Math.min(Math.max(yearTo, bounds.min), bounds.max);
  const lo = Math.min(clampedFrom, clampedTo);
  const hi = Math.max(clampedFrom, clampedTo);

  const filteredEvents = useMemo(
    () => nameFilteredEvents.filter((e) => e.year >= lo && e.year <= hi),
    [nameFilteredEvents, lo, hi],
  );

  const markers = useMemo(
    () => buildIndexedMapMarkers(filteredEvents, t, locale, placeFallbacksForGeo, indexedGeoOptions),
    [filteredEvents, t, locale, placeFallbacksForGeo, indexedGeoOptions],
  );

  const onFocusDone = useCallback(() => {
    setFocusTarget(null);
  }, []);

  useIndexedEventsMap({
    containerRef: mapRef,
    locale,
    markers,
    focusTarget,
    onFocusDone,
  });

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

  const pickSuggestion = useCallback((e: IndexedEvent) => {
    setYearFrom(e.year);
    setYearTo(e.year);
    setFocusTarget({ hitId: e.hitId, factType: e.factType, year: e.year });
    setSuggestOpen(false);
  }, []);

  return (
    <>
      <div className="mb-1.5 shrink-0">
        <YearArchiveRangeSlider
          minBound={bounds.min}
          maxBound={bounds.max}
          low={lo}
          high={hi}
          eventCount={filteredEvents.length}
          countsByYear={countsByYear}
          t={t}
          onChange={({ low: nextLo, high: nextHi }) => {
            setYearFrom(nextLo);
            setYearTo(nextHi);
          }}
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
              aria-controls="indexed-map-name-suggestions"
              autoComplete="off"
            />
            {suggestOpen && normalizedQuery.length >= 3 ? (
              <ul
                id="indexed-map-name-suggestions"
                role="listbox"
                aria-label={t('mapArchiveSearchListAria')}
                className="absolute left-0 right-0 top-full z-[460] mt-1 max-h-[min(16rem,40vh)] overflow-y-auto rounded-md border border-(--ink-muted)/40 bg-(--paper) py-1 text-sm text-(--ink) shadow-lg"
              >
                {nameSearchSuggestions.length === 0 ? (
                  <li className="px-2 py-2 text-xs text-(--ink-muted)" role="presentation">
                    {t('mapArchiveSearchNoResults')}
                  </li>
                ) : (
                  nameSearchSuggestions.map((e, idx) => {
                    const displayName = formatNameByLocale(e.principalName, locale);
                    const placeDisplay = e.placeLabel
                      ? formatPlaceLabelForLocale(e.placeLabel, locale)
                      : '';
                    const fact = indexedEventFactTypeLabel(t, e.factType);
                    const factAndYear = `${fact} · ${e.year}`;
                    const placePart = placeDisplay ? ` · ${placeDisplay}` : '';
                    return (
                      <li key={`${e.hitId}-${e.factType}-${e.year}-${idx}`} role="presentation">
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
                            pickSuggestion(e);
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
