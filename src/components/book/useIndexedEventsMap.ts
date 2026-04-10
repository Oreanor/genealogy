'use client';

import { useEffect, useRef, useState } from 'react';
import type { Layer, Map as LeafletMap, Marker } from 'leaflet';
import { MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM } from '@/lib/constants/map';
import type { IndexedMapMarker } from '@/lib/data/indexedEventsMap';

type Params = {
  containerRef: React.RefObject<HTMLDivElement | null>;
  locale: string;
  markers: IndexedMapMarker[];
};

/**
 * Leaflet + MarkerClusterGroup для индексированных событий (много точек в одних координатах).
 */
export function useIndexedEventsMap({ containerRef, locale, markers }: Params) {
  const [tilesReady, setTilesReady] = useState(false);
  const mapRef = useRef<LeafletMap | null>(null);
  const libRef = useRef<typeof import('leaflet') | null>(null);
  const clusterRef = useRef<Layer | null>(null);
  /** Один раз подогнать границы при первой загрузке меток; смена годов не двигает карту. */
  const initialFitDoneRef = useRef(false);

  useEffect(() => {
    if (!tilesReady) initialFitDoneRef.current = false;
  }, [tilesReady]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;
    let map: LeafletMap | null = null;

    setTilesReady(false);
    mapRef.current = null;
    libRef.current = null;
    clusterRef.current = null;

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
      clusterRef.current = null;
    };
  }, [containerRef, locale]);

  useEffect(() => {
    if (!tilesReady) return;

    const map = mapRef.current;
    const L = libRef.current;
    if (!map || !L) return;

    let cancelled = false;

    void import('leaflet.markercluster').then(() => {
      if (cancelled || !mapRef.current || !libRef.current) return;
      const mapInner = mapRef.current;
      const LInner = libRef.current;

      if (clusterRef.current) {
        mapInner.removeLayer(clusterRef.current);
        clusterRef.current = null;
      }

      if (markers.length === 0) {
        mapInner.invalidateSize({ animate: false });
        return;
      }

      const cluster = LInner.markerClusterGroup({
        chunkedLoading: true,
        chunkInterval: 150,
        chunkDelay: 30,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        maxClusterRadius: 52,
        zoomToBoundsOnClick: true,
        removeOutsideVisibleBounds: true,
        iconCreateFunction: (cl) => {
          const count = cl.getChildCount();
          const size = Math.min(26 + Math.sqrt(count) * 3.2, 54);
          const fs = size >= 40 ? 15 : size >= 32 ? 13 : 11;
          return LInner.divIcon({
            className: 'marker-cluster-indexed-events',
            html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:rgba(25,25,28,.92);color:#fafafa;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:${fs}px;border:2px solid rgba(255,255,255,.92);box-shadow:0 2px 10px rgba(0,0,0,.4)">${count}</div>`,
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
          });
        },
      });

      const leafletMarkers: Marker[] = [];
      for (const item of markers) {
        const d = item.circlePx;
        const icon = LInner.divIcon({
          className: 'person-place-color',
          html: `<div style="width:${d}px;height:${d}px;border-radius:50%;background:${item.color};border:2px solid rgba(255,255,255,.95);box-shadow:0 2px 6px rgba(0,0,0,.28);"></div>`,
          iconSize: [d, d],
          iconAnchor: [d / 2, d / 2],
          popupAnchor: [0, -d / 2],
        });
        const m = LInner.marker([item.latLng.lat, item.latLng.lon], { icon }).bindPopup(
          item.popupHtml,
        );
        leafletMarkers.push(m);
      }

      cluster.addLayers(leafletMarkers);
      cluster.addTo(mapInner);
      clusterRef.current = cluster;

      const bounds = LInner.latLngBounds(leafletMarkers.map((m) => m.getLatLng()));
      if (
        bounds.isValid() &&
        leafletMarkers.length > 0 &&
        !initialFitDoneRef.current
      ) {
        mapInner.fitBounds(bounds, { padding: [28, 28], maxZoom: 8, animate: false });
        initialFitDoneRef.current = true;
      }

      mapInner.invalidateSize({ animate: false });
      requestAnimationFrame(() => mapInner.invalidateSize({ animate: false }));
    });

    return () => {
      cancelled = true;
      if (clusterRef.current && mapRef.current) {
        mapRef.current.removeLayer(clusterRef.current);
      }
      clusterRef.current = null;
    };
  }, [tilesReady, markers]);

  return { tilesReady };
}
