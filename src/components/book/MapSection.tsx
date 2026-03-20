'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  FALLBACK_COUNTRY_SUFFIX,
  GEOCODE_REQUEST_DELAY_MS,
  MAP_DEFAULT_CENTER,
  MAP_DEFAULT_ZOOM,
  MAP_LINE_STYLE,
  MARKER_GROUPING,
  PLACE_FALLBACKS,
  type GeocodedPoint,
} from '@/lib/constants/map';
import { BOOK_SPREAD_SHADOW_MD } from '@/lib/constants/theme';
import { BookPage } from './BookPage';
import { useLocaleRoutes } from '@/lib/i18n/context';
import { getPersons } from '@/lib/data/persons';
import { formatPersonNameForLocale } from '@/lib/utils/person';
import { escapeHtml, normalizePlace, toPlaceFallbackKey } from '@/lib/utils/mapPlace';
import { destroyLeafletMap, initLeafletMap } from '@/lib/utils/leafletMap';
import { LoadingOverlay } from '@/components/ui/molecules/LoadingOverlay';

export function MapSection() {
  const { t, locale } = useLocaleRoutes();
  const mapRef = useRef<HTMLDivElement | null>(null);
  const leafletRef = useRef<typeof import('leaflet') | null>(null);
  const mapInstanceRef = useRef<import('leaflet').Map | null>(null);
  const layersByPersonRef = useRef<Map<string, import('leaflet').LayerGroup>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [personsOnMap, setPersonsOnMap] = useState<
    Array<{ id: string; name: string; color: string }>
  >([]);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleFilterChange = useCallback((id: string | null) => {
    setSelectedPersonId(id);
    setIsFilterOpen(false);
  }, []);

  const selectedPerson = personsOnMap.find((p) => p.id === selectedPersonId) ?? null;
 
  function buildPersonColorMap(personIds: string[]): Map<string, string> {
    // Golden-ratio hue distribution: consecutive persons get maximally-distant hues.
    const GOLDEN_ANGLE = 137.508;
    const map = new Map<string, string>();
    personIds.forEach((id, i) => {
      const hue = Math.round((i * GOLDEN_ANGLE) % 360);
      map.set(id, `hsl(${hue} 72% 40%)`);
    });
    return map;
  }

  function splitCommaPlaces(raw: string): string[] {
    return raw
      .split(',')
      .map((s) => normalizePlace(s))
      .filter(Boolean);
  }

  // Dots animation is handled by LoadingOverlay (shared component).

  useEffect(() => {
    let isMounted = true;
    let map: import('leaflet').Map | null = null;
    setIsLoading(true);
    setSelectedPersonId(null);
    setPersonsOnMap([]);
    setIsFilterOpen(false);
    layersByPersonRef.current = new Map();

    const geocodePlace = async (place: string): Promise<GeocodedPoint | null> => {
      const url = `/api/map/geocode?q=${encodeURIComponent(place)}`;
      try {
        const res = await fetch(url, { headers: { Accept: 'application/json' } });
        if (!res.ok) return null;
        const data = (await res.json()) as { point: GeocodedPoint | null };
        if (!data.point) return null;
        const lat = Number(data.point.lat);
        const lon = Number(data.point.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
        return { lat, lon };
      } catch {
        return null;
      }
    };

    const init = async () => {
      try {
        if (!isMounted || !mapRef.current) return;

        const leaflet = await initLeafletMap(
          mapRef.current,
          MAP_DEFAULT_CENTER,
          MAP_DEFAULT_ZOOM
        );
        const L = leaflet.L;
        leafletRef.current = L;
        map = leaflet.map;

      const persons = getPersons();
      const personColorMap = buildPersonColorMap(persons.map((p) => p.id));
      const placeCache = new Map<string, GeocodedPoint | null>();
      const placeQueue = new Set<string>();

      for (const p of persons) {
        const birth = normalizePlace(p.birthPlace ?? '');
        if (birth) placeQueue.add(birth);
        for (const r of splitCommaPlaces(p.residenceCity ?? '')) placeQueue.add(r);
      }

      const places = [...placeQueue];
      const concurrency = 4;
      let idx = 0;

      const worker = async () => {
        while (idx < places.length) {
          const place = places[idx++]!;
          const normalized = normalizePlace(place);
          let point = await geocodePlace(place);
          if (!point && normalized !== place) {
            point = await geocodePlace(normalized);
          }
          // Only append country suffix for Cyrillic names — Latin city names
          // (e.g. Budapest, Prague) are international and the suffix breaks lookup.
          const hasCyrillic = /[а-яёА-ЯЁ]/.test(normalized);
          if (!point && hasCyrillic) {
            point = await geocodePlace(`${normalized}${FALLBACK_COUNTRY_SUFFIX}`);
          }
          if (!point) {
            point = PLACE_FALLBACKS[toPlaceFallbackKey(normalized)] ?? null;
          }
          placeCache.set(place, point);
          await new Promise((r) => setTimeout(r, GEOCODE_REQUEST_DELAY_MS));
        }
      };

      await Promise.all(Array.from({ length: concurrency }, () => worker()));

      console.log('[MAP] Geocoding results:');
      for (const [place, point] of placeCache.entries()) {
        if (point) {
          console.log(`  ✓ ${place} → ${point.lat.toFixed(4)}, ${point.lon.toFixed(4)}`);
        } else {
          console.warn(`  ✗ ${place} — не найден`);
        }
      }

      type MarkerEntry = {
        personId: string;
        personName: string;
        kindLabel: string;
        place: string;
        offsetPoint: { lat: number; lon: number };
        color: string;
      };
      type LineEntry = {
        personId: string;
        personName: string;
        from: { lat: number; lon: number };
        to: { lat: number; lon: number };
        color: string;
      };

      const markerEntries: MarkerEntry[] = [];
      const lineEntries: LineEntry[] = [];

      // coordKey → how many markers placed at that spot (for staggering)
      const byCoord = new Map<string, number>();
      // personId|place → offset position (so lines snap to the same shifted point)
      const personPlaceOffset = new Map<string, { lat: number; lon: number }>();

      for (const p of persons) {
        const personName = formatPersonNameForLocale(p, locale) || p.id;
        const color = personColorMap.get(p.id) ?? 'hsl(0 70% 40%)';

        const birth = normalizePlace(p.birthPlace ?? '');
        const residences = splitCommaPlaces(p.residenceCity ?? '').filter(
          (r) => r !== birth
        );

        // Chain: birth city first (if any), then unique residence cities in order.
        // Adjacent duplicates are removed to avoid zero-length lines.
        const rawChain = birth ? [birth, ...residences] : [...residences];
        const chain: string[] = [];
        for (const city of rawChain) {
          if (chain.length === 0 || chain[chain.length - 1] !== city) chain.push(city);
        }

        if (chain.length > 0) {
          console.log(
            `[MAP] ${personName} (${p.id})  color=${color}\n` +
            `      birth="${birth || '—'}"  residences=[${residences.join(', ') || '—'}]\n` +
            `      chain: ${chain.join(' → ')}`
          );
        }

        // One marker per city in the chain for this person.
        const seenForPerson = new Set<string>();
        for (const place of chain) {
          if (seenForPerson.has(place)) continue;
          seenForPerson.add(place);

          const point = placeCache.get(place);
          if (!point) continue;

          const coordKey = `${point.lat.toFixed(MARKER_GROUPING.coordPrecision)},${point.lon.toFixed(MARKER_GROUPING.coordPrecision)}`;
          const offsetIdx = byCoord.get(coordKey) ?? 0;
          byCoord.set(coordKey, offsetIdx + 1);
          const dx = (offsetIdx % MARKER_GROUPING.columnsPerRow) * MARKER_GROUPING.lonStep;
          const dy = Math.floor(offsetIdx / MARKER_GROUPING.columnsPerRow) * MARKER_GROUPING.latStep;
          const offsetPoint = { lat: point.lat + dy, lon: point.lon + dx };

          personPlaceOffset.set(`${p.id}|${place}`, offsetPoint);

          const kindLabel = place === birth ? t('birthPlace') : t('residenceCity');
          markerEntries.push({ personId: p.id, personName, kindLabel, place, offsetPoint, color });
        }

        // Lines: connect chain cities in order, using offset positions.
        for (let i = 0; i < chain.length - 1; i++) {
          const fromPlace = chain[i]!;
          const toPlace = chain[i + 1]!;
          if (fromPlace === toPlace) continue;
          const fromPoint = personPlaceOffset.get(`${p.id}|${fromPlace}`);
          const toPoint = personPlaceOffset.get(`${p.id}|${toPlace}`);
          if (!fromPoint || !toPoint) continue;
          lineEntries.push({ personId: p.id, personName, from: fromPoint, to: toPoint, color });
        }
      }

      const personGroupMap = new Map<string, import('leaflet').LayerGroup>();
      const getPersonGroup = (personId: string) => {
        const existing = personGroupMap.get(personId);
        if (existing) return existing;
        const group = L.layerGroup();
        personGroupMap.set(personId, group);
        return group;
      };

      for (const line of lineEntries) {
        const polyline = L.polyline(
          [
            [line.from.lat, line.from.lon],
            [line.to.lat, line.to.lon],
          ],
          { ...MAP_LINE_STYLE, color: line.color }
        )
          .addTo(getPersonGroup(line.personId))
          .bindTooltip(escapeHtml(line.personName), { sticky: true });
      }

      const CIRCLE_SIZE = 18;
      const CIRCLE_BORDER = 2;
      for (const item of markerEntries) {
        const html = `<div style="width:${CIRCLE_SIZE}px;height:${CIRCLE_SIZE}px;border-radius:50%;background:${item.color};border:${CIRCLE_BORDER}px solid rgba(255,255,255,.95);box-shadow:0 2px 6px rgba(0,0,0,.25);"></div>`;

        const icon = L.divIcon({
          className: 'person-place-color',
          html,
          iconSize: [CIRCLE_SIZE, CIRCLE_SIZE],
          iconAnchor: [CIRCLE_SIZE / 2, CIRCLE_SIZE / 2],
          popupAnchor: [0, -CIRCLE_SIZE / 2],
        });

        L.marker([item.offsetPoint.lat, item.offsetPoint.lon], { icon })
          .addTo(getPersonGroup(item.personId))
          .bindPopup(
            `<div style="min-width:180px">
               <div style="font-weight:600;margin-bottom:4px">${escapeHtml(item.personName)}</div>
               <div style="font-size:12px;opacity:.9">${escapeHtml(item.kindLabel)}: ${escapeHtml(item.place)}</div>
             </div>`
          )
          .bindTooltip(
            `${escapeHtml(item.personName)}<br><span style="opacity:.75;font-size:11px">г. ${escapeHtml(item.place)} (${escapeHtml(item.kindLabel)})</span>`,
            { sticky: true, direction: 'top' }
          );
      }

      for (const group of personGroupMap.values()) {
        group.addTo(map);
      }

      layersByPersonRef.current = personGroupMap;
      mapInstanceRef.current = map;

      if (isMounted) {
        setPersonsOnMap(
          persons
            .filter((p) => personGroupMap.has(p.id))
            .map((p) => ({
              id: p.id,
              name: formatPersonNameForLocale(p, locale) || p.id,
              color: personColorMap.get(p.id) ?? 'hsl(0 70% 40%)',
            }))
        );
      }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void init();

    return () => {
      isMounted = false;
      destroyLeafletMap(mapRef.current);
    };
  }, [locale]);

  // Show/hide layers whenever the person filter changes.
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = leafletRef.current;
    if (!map || !L) return;
    const groups = layersByPersonRef.current;

    // Hard reset: remove all overlays (markers/lines/groups), keep only base tile layer.
    map.eachLayer((layer) => {
      if (!(layer instanceof L.TileLayer)) {
        map.removeLayer(layer);
      }
    });

    if (!selectedPersonId) {
      for (const group of groups.values()) {
        group.addTo(map);
      }
      return;
    }

    const selectedGroup = groups.get(selectedPersonId);
    if (selectedGroup) {
      selectedGroup.addTo(map);
    }
  }, [selectedPersonId]);

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden min-h-[calc(100vh-10rem)] md:min-h-0 md:flex-none">
      <div
        className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:max-h-[calc(100vh-4rem)] md:max-w-[calc((100vh-6rem)*296/210)] md:aspect-[296/210] md:min-h-[320px] md:flex-initial md:rounded-lg ${BOOK_SPREAD_SHADOW_MD}`}
      >
        <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
          <BookPage className="relative flex h-full min-h-0 min-w-0 flex-col p-2 sm:p-5 md:p-6">
            <h1 className="book-serif mb-2 hidden border-b border-(--ink-muted)/35 pb-0 text-center text-lg font-semibold text-(--ink) md:block md:text-2xl lg:text-3xl">
              {t('chapters_map')}
            </h1>
            <div className="relative z-0 min-h-0 flex-1 overflow-hidden rounded-md border border-(--ink-muted)/25">
              <div
                ref={mapRef}
                className="h-full w-full transition-opacity duration-300"
                aria-busy={isLoading}
                aria-label={t('chapters_map')}
                style={{
                  opacity: isLoading ? 0.5 : 1,
                  pointerEvents: isLoading ? 'none' : 'auto',
                }}
              />
              {!isLoading && personsOnMap.length > 0 && (
                <div className="absolute top-2 right-2 z-20 flex items-start gap-1">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsFilterOpen((v) => !v)}
                      className="flex min-w-[220px] items-center justify-between gap-2 rounded border border-(--ink-muted)/40 bg-white/90 px-2 py-1 text-xs text-(--ink) shadow-sm backdrop-blur-sm"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        {selectedPerson ? (
                          <span
                            className="h-2.5 w-2.5 rounded-full border border-white/90 shadow-sm"
                            style={{ background: selectedPerson.color }}
                          />
                        ) : (
                          <span className="h-2.5 w-2.5 rounded-full border border-(--ink-muted)/40 bg-white" />
                        )}
                        <span className="truncate">
                          {selectedPerson?.name ?? t('mapFilterAll') ?? 'Все на карте'}
                        </span>
                      </span>
                      <span className="text-[10px] opacity-70">{isFilterOpen ? '▲' : '▼'}</span>
                    </button>
                    {isFilterOpen && (
                      <div className="absolute right-0 mt-1 max-h-64 w-[280px] overflow-auto rounded border border-(--ink-muted)/40 bg-white/95 p-1 text-xs text-(--ink) shadow-lg backdrop-blur-sm">
                        <button
                          type="button"
                          onClick={() => handleFilterChange(null)}
                          className="flex w-full items-center gap-2 rounded px-2 py-1 text-left hover:bg-(--paper)/70"
                        >
                          <span className="h-2.5 w-2.5 rounded-full border border-(--ink-muted)/40 bg-white" />
                          <span className="truncate">{t('mapFilterAll') || 'Все на карте'}</span>
                        </button>
                        {personsOnMap.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleFilterChange(p.id)}
                            className="flex w-full items-center gap-2 rounded px-2 py-1 text-left hover:bg-(--paper)/70"
                          >
                            <span
                              className="h-2.5 w-2.5 rounded-full border border-white/90 shadow-sm"
                              style={{ background: p.color }}
                            />
                            <span className="truncate">{p.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedPersonId && (
                    <button
                      onClick={() => handleFilterChange(null)}
                      title={t('mapFilterReset') || 'Показать всех'}
                      className="flex h-6 w-6 items-center justify-center rounded border border-(--ink-muted)/40 bg-white/90 text-xs text-(--ink) shadow-sm backdrop-blur-sm hover:bg-white"
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}
              {isLoading && (
                <LoadingOverlay
                  text={(t('mapLoading') || t('loading')).trim()}
                  mode="fixed"
                />
              )}
            </div>
          </BookPage>
        </div>
      </div>
    </div>
  );
}
