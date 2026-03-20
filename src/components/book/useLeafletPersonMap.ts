'use client';

import { useEffect, useRef, useState } from 'react';
import { MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM, MAP_LINE_STYLE } from '@/lib/constants/map';
import { escapeHtml } from '@/lib/utils/mapPlace';
import { destroyLeafletMap, initLeafletMap } from '@/lib/utils/leafletMap';
import type { LineEntry, MarkerEntry } from './mapSectionUtils';

type Params = {
  mapRef: React.RefObject<HTMLDivElement | null>;
  markerEntries: MarkerEntry[];
  lineEntries: LineEntry[];
  selectedPersonId: string | null;
};

export function useLeafletPersonMap({
  mapRef,
  markerEntries,
  lineEntries,
  selectedPersonId,
}: Params) {
  const leafletRef = useRef<typeof import('leaflet') | null>(null);
  const mapInstanceRef = useRef<import('leaflet').Map | null>(null);
  const layersByPersonRef = useRef<Map<string, import('leaflet').LayerGroup>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const mapHost = mapRef.current;
    let resizeObserver: ResizeObserver | null = null;
    setIsLoading(true);
    layersByPersonRef.current = new Map();

    const init = async () => {
      try {
        if (!isMounted || !mapHost) return;

        const leaflet = await initLeafletMap(mapHost, MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM);
        const L = leaflet.L;
        const map = leaflet.map;

        leafletRef.current = L;
        mapInstanceRef.current = map;

        const personGroupMap = new Map<string, import('leaflet').LayerGroup>();
        const getPersonGroup = (personId: string) => {
          const existing = personGroupMap.get(personId);
          if (existing) return existing;
          const group = L.layerGroup();
          personGroupMap.set(personId, group);
          return group;
        };

        for (const line of lineEntries) {
          L.polyline(
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
              `${escapeHtml(item.personName)}<br><span style="opacity:.75;font-size:11px">${escapeHtml(item.place)} (${escapeHtml(item.kindLabel)})</span>`,
              { sticky: true, direction: 'top' }
            );
        }

        for (const group of personGroupMap.values()) {
          group.addTo(map);
        }

        // The map chapter lives in a flex layout; on production builds the
        // container can finish sizing after Leaflet init, leaving base tiles blank
        // until the first manual interaction. Keep tiles in sync with host size.
        resizeObserver = new ResizeObserver(() => {
          map.invalidateSize(false);
        });
        resizeObserver.observe(mapHost);
        requestAnimationFrame(() => {
          if (isMounted) {
            map.invalidateSize(false);
          }
        });

        layersByPersonRef.current = personGroupMap;
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void init();

    return () => {
      isMounted = false;
      resizeObserver?.disconnect();
      destroyLeafletMap(mapHost);
    };
  }, [lineEntries, mapRef, markerEntries]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = leafletRef.current;
    if (!map || !L) return;
    const groups = layersByPersonRef.current;

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

  return { isLoading };
}
