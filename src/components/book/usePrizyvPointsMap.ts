'use client';

import { useEffect, useRef, useState } from 'react';
import type { Locale } from '@/lib/i18n/config';
import type { TranslationFn } from '@/lib/i18n/types';
import { MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM } from '@/lib/constants/map';
import type { PrizyvMapPoint } from '@/lib/data/prizyvMap';
import { escapeHtml, formatPlaceLabelForLocale } from '@/lib/utils/mapPlace';

type Params = {
  containerRef: React.RefObject<HTMLDivElement | null>;
  locale: Locale;
  t: TranslationFn;
  points: readonly PrizyvMapPoint[];
};

function coordKey(p: PrizyvMapPoint): string {
  return `${p.lat},${p.lon}`;
}

/** Небольшой разнос точек с одинаковыми координатами (без кластера). */
function spreadLatLon(
  p: PrizyvMapPoint,
  indexAtCoord: number,
  totalAtCoord: number,
): [number, number] {
  if (totalAtCoord <= 1) return [p.lat, p.lon];
  const r = 0.00028;
  const angle = (indexAtCoord / totalAtCoord) * 2 * Math.PI;
  return [p.lat + r * Math.cos(angle), p.lon + r * Math.sin(angle)];
}

/**
 * Точки распределения по военкоматам (агрегат по данным «Память народа» / призыв.csv).
 * Каждая запись — отдельный маркер с подписью числа на карте.
 */
export function usePrizyvPointsMap({ containerRef, locale, t, points }: Params) {
  const [tilesReady, setTilesReady] = useState(false);
  const mapRef = useRef<import('leaflet').Map | null>(null);
  const libRef = useRef<typeof import('leaflet') | null>(null);
  const groupRef = useRef<import('leaflet').LayerGroup | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;
    let map: import('leaflet').Map | null = null;

    setTilesReady(false);
    mapRef.current = null;
    libRef.current = null;
    groupRef.current = null;

    void import('leaflet').then((leafletMod) => {
      if (cancelled || !el.isConnected) return;
      const L = leafletMod.default;
      const m = L.map(el, { zoomControl: true, attributionControl: true }).setView(
        [MAP_DEFAULT_CENTER[0], MAP_DEFAULT_CENTER[1]],
        MAP_DEFAULT_ZOOM,
      );
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(m);

      map = m;
      mapRef.current = m;
      libRef.current = L;

      if (cancelled) {
        m.remove();
        map = null;
        mapRef.current = null;
        libRef.current = null;
        return;
      }

      m.whenReady(() => {
        if (cancelled) return;
        m.invalidateSize({ animate: false });
        requestAnimationFrame(() => {
          if (!cancelled) m.invalidateSize({ animate: false });
        });
      });

      resizeObserver = new ResizeObserver(() => {
        if (cancelled) return;
        m.invalidateSize({ animate: false });
      });
      resizeObserver.observe(el);

      if (!cancelled) setTilesReady(true);
    });

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      if (map) {
        map.remove();
        map = null;
      }
      mapRef.current = null;
      libRef.current = null;
      groupRef.current = null;
    };
  }, [containerRef, locale]);

  useEffect(() => {
    if (!tilesReady) return;

    const map = mapRef.current;
    const L = libRef.current;
    if (!map || !L) return;

    if (groupRef.current) {
      map.removeLayer(groupRef.current);
      groupRef.current = null;
    }

    if (points.length === 0) {
      map.invalidateSize({ animate: false });
      return;
    }

    const countsByKey = new Map<string, number>();
    for (const p of points) {
      const k = coordKey(p);
      countsByKey.set(k, (countsByKey.get(k) ?? 0) + 1);
    }

    const indexAtKey = new Map<string, number>();
    const group = L.layerGroup();
    const leafletMarkers: import('leaflet').Marker[] = [];

    for (const p of points) {
      const k = coordKey(p);
      const totalHere = countsByKey.get(k) ?? 1;
      const idx = indexAtKey.get(k) ?? 0;
      indexAtKey.set(k, idx + 1);

      const [lat, lon] = spreadLatLon(p, idx, totalHere);
      const label = formatPlaceLabelForLocale(p.name, locale);
      const popupLine = escapeHtml(t('mapPrizyvPopupStats', { count: p.count, percent: p.percent }));
      const note = escapeHtml(t('mapPrizyvAttribution'));
      const popupHtml = `<div style="min-width:180px"><div style="font-weight:600;margin-bottom:4px">${escapeHtml(label)}</div><div style="font-size:12px;opacity:.9">${popupLine}</div><div style="margin-top:8px;font-size:10px;opacity:.75">${note}</div></div>`;

      const subline = escapeHtml(t('mapPrizyvMarkerSubline', { count: p.count, percent: p.percent }));
      const html = `<div class="prizyv-rvk-marker-wrap" style="display:flex;align-items:flex-start;gap:7px">
        <div style="width:11px;height:11px;margin-top:3px;border-radius:50%;background:#6b4423;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.35);flex-shrink:0" aria-hidden="true"></div>
        <div style="min-width:0;max-width:min(220px,55vw)">
          <div style="font-weight:700;font-size:13px;line-height:1.25;color:#141414;text-shadow:0 0 1px #fff,0 0 6px #fff,0 0 8px rgba(255,255,255,.9)">${escapeHtml(label)}</div>
          <div style="margin-top:2px;font-size:11px;line-height:1.2;color:#4a4a4a;text-shadow:0 0 1px #fff,0 0 4px rgba(255,255,255,.95)">${subline}</div>
        </div>
      </div>`;

      const icon = L.divIcon({
        className: 'prizyv-rvk-marker',
        html,
        iconSize: [236, 64],
        iconAnchor: [8, 11],
        popupAnchor: [0, -10],
      });

      const mk = L.marker([lat, lon], { icon }).bindPopup(popupHtml);
      mk.addTo(group);
      leafletMarkers.push(mk);
    }

    group.addTo(map);
    groupRef.current = group;

    const bounds = L.latLngBounds(leafletMarkers.map((mk) => mk.getLatLng()));
    if (bounds.isValid() && leafletMarkers.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 7, animate: false });
    }

    map.invalidateSize({ animate: false });
    requestAnimationFrame(() => map.invalidateSize({ animate: false }));

    return () => {
      if (groupRef.current && mapRef.current) {
        mapRef.current.removeLayer(groupRef.current);
      }
      groupRef.current = null;
    };
  }, [tilesReady, points, locale, t]);

  return { tilesReady };
}
