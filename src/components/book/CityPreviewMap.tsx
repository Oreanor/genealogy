'use client';

import { useEffect, useRef, useState } from 'react';
import {
  FALLBACK_COUNTRY_SUFFIX,
  MAP_DEFAULT_CENTER,
  MAP_LINE_STYLE,
  PLACE_FALLBACKS,
  type GeocodedPoint,
} from '@/lib/constants/map';
import { normalizePlace, toPlaceFallbackKey } from '@/lib/utils/mapPlace';
import { initLeafletMap, destroyLeafletMap } from '@/lib/utils/leafletMap';
import { LoadingOverlay } from '@/components/ui/molecules/LoadingOverlay';
import { useLocaleRoutes } from '@/lib/i18n/context';
import type { Person } from '@/lib/types/person';

interface CityPreviewMapProps {
  person: Person;
  selectedCity: string | null;
}

export function CityPreviewMap({ person, selectedCity }: CityPreviewMapProps) {
  const { t } = useLocaleRoutes();
  const mapRef = useRef<HTMLDivElement | null>(null);
  const leafletRef = useRef<typeof import('leaflet') | null>(null);
  const mapInstanceRef = useRef<import('leaflet').Map | null>(null);
  const routeLayerRef = useRef<import('leaflet').LayerGroup | null>(null);
  const selectedMarkerRef = useRef<import('leaflet').Marker | null>(null);
  const geocodedByCityRef = useRef<Map<string, GeocodedPoint>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [mapDataRevision, setMapDataRevision] = useState(0);

  const splitCities = (raw?: string): string[] =>
    (raw ?? '')
      .split(',')
      .map((s) => normalizePlace(s))
      .filter(Boolean);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setNotFound(false);
    setMapDataRevision(0);
    geocodedByCityRef.current = new Map();

    const geocodePlace = async (place: string): Promise<GeocodedPoint | null> => {
      try {
        const res = await fetch(`/api/map/geocode?q=${encodeURIComponent(place)}`, {
          headers: { Accept: 'application/json' },
        });
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

    const run = async () => {
      try {
        if (!isMounted || !mapRef.current) return;

        const leaflet = await initLeafletMap(mapRef.current, MAP_DEFAULT_CENTER, 4);
        const { L, map } = leaflet;
        leafletRef.current = L;
        mapInstanceRef.current = map;

        const birth = normalizePlace(person.birthPlace ?? '');
        const residences = splitCities(person.residenceCity).filter((r) => r !== birth);
        const rawChain = birth ? [birth, ...residences] : [...residences];
        const chain: string[] = [];
        for (const city of rawChain) {
          if (chain.length === 0 || chain[chain.length - 1] !== city) chain.push(city);
        }

        if (chain.length === 0) {
          setNotFound(true);
          return;
        }

        const uniqCities = [...new Set(chain)];
        const cache = new Map<string, GeocodedPoint>();

        for (const city of uniqCities) {
          const normalized = normalizePlace(city);
          const hasCyrillic = /[а-яёА-ЯЁ]/.test(normalized);

          let point = await geocodePlace(city);
          if (!point && normalized !== city) point = await geocodePlace(normalized);
          if (!point && hasCyrillic) point = await geocodePlace(`${normalized}${FALLBACK_COUNTRY_SUFFIX}`);
          if (!point) point = PLACE_FALLBACKS[toPlaceFallbackKey(normalized)] ?? null;
          if (point) cache.set(city, point);
        }

        const points = chain
          .map((city) => ({ city, point: cache.get(city) ?? null }))
          .filter((x): x is { city: string; point: GeocodedPoint } => x.point != null);

        if (points.length === 0) {
          setNotFound(true);
          return;
        }

        geocodedByCityRef.current = cache;

        const group = L.layerGroup();
        routeLayerRef.current = group;

        if (points.length > 1) {
          L.polyline(
            points.map((p) => [p.point.lat, p.point.lon] as [number, number]),
            { ...MAP_LINE_STYLE, color: '#4b5563' }
          ).addTo(group);
        }

        for (const p of points) {
          L.circleMarker([p.point.lat, p.point.lon], {
            radius: 5,
            color: '#1f2937',
            weight: 2,
            fillColor: '#9ca3af',
            fillOpacity: 0.95,
          })
            .addTo(group)
            .bindTooltip(p.city, { sticky: true });
        }

        group.addTo(map);

        const bounds = L.latLngBounds(points.map((p) => [p.point.lat, p.point.lon] as [number, number]));
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [30, 30], maxZoom: 7, animate: false });
        }

        // Let selected-city effect re-run after full map data is ready.
        setMapDataRevision((v) => v + 1);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void run();

    return () => {
      isMounted = false;
      routeLayerRef.current = null;
      selectedMarkerRef.current = null;
      mapInstanceRef.current = null;
      leafletRef.current = null;
      destroyLeafletMap(mapRef.current);
    };
  }, [person.id, person.birthPlace, person.residenceCity]);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapInstanceRef.current;
    if (!L || !map) return;

    if (selectedMarkerRef.current) {
      map.removeLayer(selectedMarkerRef.current);
      selectedMarkerRef.current = null;
    }

    if (!selectedCity) return;

    const normalizedSelected = normalizePlace(selectedCity);
    let point = geocodedByCityRef.current.get(normalizedSelected) ?? null;
    if (!point) {
      for (const [city, p] of geocodedByCityRef.current.entries()) {
        if (normalizePlace(city) === normalizedSelected) {
          point = p;
          break;
        }
      }
    }
    if (!point) return;

    selectedMarkerRef.current = L.marker([point.lat, point.lon])
      .addTo(map)
      .bindTooltip(selectedCity, { permanent: true, direction: 'top' });
  }, [selectedCity, mapDataRevision]);

  return (
    <div className="relative h-full min-h-0 w-full overflow-hidden rounded bg-(--paper-light)">
      <div
        ref={mapRef}
        className="h-full w-full transition-opacity duration-300"
        style={{
          opacity: isLoading ? 0.45 : 1,
          pointerEvents: isLoading ? 'none' : 'auto',
        }}
      />
      {isLoading && <LoadingOverlay text={(t('mapLoading') || t('loading')).trim()} mode="absolute" />}
      {!isLoading && notFound && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-(--ink-muted)">
          {t('nothingFound')}
        </div>
      )}
    </div>
  );
}
