'use client';

import { useEffect, useRef, useState } from 'react';
import { MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM, MAP_LINE_STYLE } from '@/lib/constants/map';
import { escapeHtml } from '@/lib/utils/mapPlace';
import type { LineEntry, MarkerEntry } from '@/lib/utils/mapSectionEntries';

type Params = {
  containerRef: React.RefObject<HTMLDivElement | null>;
  locale: string;
  markerEntries: MarkerEntry[];
  lineEntries: LineEntry[];
  selectedPersonId: string | null;
};

/**
 * Phase 1: only L.map + OSM tiles (reliable tile paint in nested flex / book layout).
 * Phase 2: markers + polylines in a layer group; filter changes only refresh vectors.
 */
export function useLeafletBookMap({
  containerRef,
  locale,
  markerEntries,
  lineEntries,
  selectedPersonId,
}: Params) {
  const [tilesReady, setTilesReady] = useState(false);
  const [showPersonFilter, setShowPersonFilter] = useState(false);

  const mapRef = useRef<import('leaflet').Map | null>(null);
  const libRef = useRef<typeof import('leaflet') | null>(null);
  const vectorGroupRef = useRef<import('leaflet').LayerGroup | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;
    let map: import('leaflet').Map | null = null;

    setTilesReady(false);
    setShowPersonFilter(false);
    mapRef.current = null;
    libRef.current = null;
    vectorGroupRef.current = null;

    void import('leaflet').then((L) => {
      if (cancelled || !el.isConnected) return;
      const m = L.map(el, { zoomControl: true, attributionControl: true }).setView(
        [MAP_DEFAULT_CENTER[0], MAP_DEFAULT_CENTER[1]],
        MAP_DEFAULT_ZOOM
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
      vectorGroupRef.current = null;
    };
  }, [containerRef, locale]);

  useEffect(() => {
    if (!tilesReady) return;

    const map = mapRef.current;
    const L = libRef.current;
    if (!map || !L) return;

    if (vectorGroupRef.current) {
      map.removeLayer(vectorGroupRef.current);
      vectorGroupRef.current = null;
    }

    const visibleMarkers = selectedPersonId
      ? markerEntries.filter((m) => m.personId === selectedPersonId)
      : markerEntries;
    const visibleLines = selectedPersonId
      ? lineEntries.filter((l) => l.personId === selectedPersonId)
      : lineEntries;

    const boundsPoints: Array<[number, number]> = [];
    const group = L.layerGroup();
    vectorGroupRef.current = group;

    const CIRCLE = 18;
    for (const item of visibleMarkers) {
      const icon = L.divIcon({
        className: 'person-place-color',
        html: `<div style="width:${CIRCLE}px;height:${CIRCLE}px;border-radius:50%;background:${item.color};border:2px solid rgba(255,255,255,.95);box-shadow:0 2px 6px rgba(0,0,0,.25);"></div>`,
        iconSize: [CIRCLE, CIRCLE],
        iconAnchor: [CIRCLE / 2, CIRCLE / 2],
        popupAnchor: [0, -CIRCLE / 2],
      });
      L.marker([item.offsetPoint.lat, item.offsetPoint.lon], { icon })
        .addTo(group)
        .bindPopup(
          `<div style="min-width:180px"><div style="font-weight:600;margin-bottom:4px">${escapeHtml(item.personName)}</div><div style="font-size:12px;opacity:.9">${escapeHtml(item.kindLabel)}: ${escapeHtml(item.place)}</div></div>`
        )
        .bindTooltip(
          `${escapeHtml(item.personName)}<br><span style="opacity:.75;font-size:11px">${escapeHtml(item.place)} (${escapeHtml(item.kindLabel)})</span>`,
          { sticky: true, direction: 'top' }
        );
      boundsPoints.push([item.offsetPoint.lat, item.offsetPoint.lon]);
    }

    for (const line of visibleLines) {
      L.polyline(
        [
          [line.from.lat, line.from.lon],
          [line.to.lat, line.to.lon],
        ],
        { ...MAP_LINE_STYLE, color: line.color }
      )
        .addTo(group)
        .bindTooltip(escapeHtml(line.personName), { sticky: true });
      boundsPoints.push([line.from.lat, line.from.lon], [line.to.lat, line.to.lon]);
    }

    group.addTo(map);

    if (boundsPoints.length > 0) {
      const bounds = L.latLngBounds(boundsPoints);
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 7, animate: false });
      }
    }

    map.invalidateSize({ animate: false });
    requestAnimationFrame(() => map.invalidateSize({ animate: false }));

    setShowPersonFilter(true);

    return () => {
      if (vectorGroupRef.current && mapRef.current) {
        mapRef.current.removeLayer(vectorGroupRef.current);
      }
      vectorGroupRef.current = null;
    };
  }, [tilesReady, markerEntries, lineEntries, selectedPersonId]);

  return { showPersonFilter };
}
