'use client';

import { useEffect, useRef, useState } from 'react';
import type { Layer, Map as LeafletMap, Marker, MarkerOptions } from 'leaflet';
import { MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM } from '@/lib/constants/map';
import type { IndexedMapMarker } from '@/lib/data/indexedEventsMap';
import type { TranslationFn } from '@/lib/i18n/types';
import { escapeHtml } from '@/lib/utils/mapPlace';

function positionFixedFlyoutNearAnchor(anchor: DOMRect, el: HTMLElement): void {
  const pad = 8;
  document.body.appendChild(el);
  void el.offsetWidth;
  const fw = el.getBoundingClientRect().width;
  const fh = el.getBoundingClientRect().height;
  let left = anchor.right + pad;
  if (left + fw > window.innerWidth - pad) {
    left = Math.max(pad, anchor.left - fw - pad);
  }
  if (left + fw > window.innerWidth - pad) {
    left = Math.max(pad, window.innerWidth - fw - pad);
  }
  let top = anchor.top;
  if (top + fh > window.innerHeight - pad) {
    top = Math.max(pad, window.innerHeight - fh - pad);
  }
  el.style.left = `${left}px`;
  el.style.top = `${top}px`;
}

export type IndexedMapFocusTarget = {
  hitId: string;
  factType: string;
  year: number;
};

const CLUSTER_NAME_LIST_CAP = 55;
const POPUP_HIDE_DELAY_MS = 320;

/** Как у ссылок в списке кластера архива: синий подчёркнутый текст. */
const CLUSTER_LIST_NAME_LINK_STYLE = 'font-size:13px;text-decoration:underline;color:#1a73e8';

const MARKER_POPUP_OPTIONS = {
  className: 'indexed-archive-marker-popup',
  maxWidth: 360,
  autoPan: true,
  closeButton: true,
} as const;

const CLUSTER_POPUP_OPTIONS = {
  className: 'indexed-archive-cluster-popup',
  maxWidth: 340,
  autoPan: true,
  closeButton: true,
} as const;

type IndexedMarkerOpts = {
  indexedHitId?: string;
  indexedFactType?: string;
  indexedYear?: number;
  indexedListName?: string;
  indexedRecordUrl?: string | null;
  /** HTML одиночного маркера — для превью в списке кластера и перехода по клику. */
  indexedPopupHtml?: string;
};

function clusterListLineHtml(o: IndexedMarkerOpts, t: TranslationFn): { labelHtml: string } {
  const name = escapeHtml(o.indexedListName ?? '—');
  const y = o.indexedYear;
  if (typeof y !== 'number' || !Number.isFinite(y)) {
    return { labelHtml: name };
  }
  const yearAppend = escapeHtml(t('mapClusterLineBirthYearAppend', { year: y }));
  const labelHtml = `${name}<span style="font-size:12px;opacity:.72">${yearAppend}</span>`;
  return { labelHtml };
}

function getClusterChildMarkers(layer: Marker): Marker[] {
  const raw = layer as unknown as { getAllChildMarkers?: () => Marker[] };
  return typeof raw.getAllChildMarkers === 'function' ? raw.getAllChildMarkers() : [];
}

function buildClusterHoverPopupHtml(
  leafletMarkers: Marker[],
  t: TranslationFn,
): { html: string; slice: Marker[] } {
  const sorted = [...leafletMarkers].sort((a, b) => {
    const na = (a.options as IndexedMarkerOpts).indexedListName ?? '';
    const nb = (b.options as IndexedMarkerOpts).indexedListName ?? '';
    return na.localeCompare(nb, undefined, { sensitivity: 'base' });
  });
  const slice = sorted.slice(0, CLUSTER_NAME_LIST_CAP);
  const items = slice.map((mk, idx) => {
    const o = mk.options as IndexedMarkerOpts;
    const { labelHtml } = clusterListLineHtml(o, t);
    const url = o.indexedRecordUrl?.trim();
    const previewHtml = o.indexedPopupHtml?.trim();
    if (url) {
      return `<li style="margin:5px 0;line-height:1.3"><a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" style="${CLUSTER_LIST_NAME_LINK_STYLE}">${labelHtml}</a></li>`;
    }
    if (previewHtml) {
      return `<li style="margin:5px 0;line-height:1.3"><button type="button" data-indexed-cluster-line="${idx}" style="${CLUSTER_LIST_NAME_LINK_STYLE};background:transparent;border:0;padding:0;text-align:left;font:inherit;cursor:pointer;width:100%">${labelHtml}</button></li>`;
    }
    return `<li style="margin:5px 0;line-height:1.3"><span style="font-size:13px">${labelHtml}</span></li>`;
  });
  const overflow =
    sorted.length > CLUSTER_NAME_LIST_CAP
      ? `<div style="font-size:11px;opacity:.75;margin-top:8px">${escapeHtml(
          t('mapArchiveClusterMore', { count: sorted.length - CLUSTER_NAME_LIST_CAP }),
        )}</div>`
      : '';
  const html = `<div class="indexed-cluster-scroll" style="max-height:min(50vh,280px);overflow:auto;padding:2px 2px 4px"><ul style="list-style:none;margin:0;padding:0">${items.join('')}</ul>${overflow}</div>`;
  return { html, slice };
}

function bindDismissibleHoverPopup(mk: Marker, cancelHide: () => void, scheduleHide: (target: Marker) => void): void {
  mk.on('mouseover', () => {
    cancelHide();
    mk.openPopup();
  });
  mk.on('mouseout', () => {
    scheduleHide(mk);
  });
  mk.on('popupopen', () => {
    const el = mk.getPopup()?.getElement();
    if (!el) return;
    const onEnter = () => cancelHide();
    const onLeave = () => scheduleHide(mk);
    el.addEventListener('mouseenter', onEnter);
    el.addEventListener('mouseleave', onLeave);
    mk.once('popupclose', () => {
      el.removeEventListener('mouseenter', onEnter);
      el.removeEventListener('mouseleave', onLeave);
    });
  });
}

type Params = {
  containerRef: React.RefObject<HTMLDivElement | null>;
  locale: string;
  t: TranslationFn;
  markers: IndexedMapMarker[];
  /** После появления маркеров — приблизить и открыть попап этого события. */
  focusTarget?: IndexedMapFocusTarget | null;
  onFocusDone?: () => void;
};

/**
 * Leaflet + MarkerClusterGroup для индексированных событий (много точек в одних координатах).
 */
export function useIndexedEventsMap({
  containerRef,
  locale,
  t,
  markers,
  focusTarget,
  onFocusDone,
}: Params) {
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
    let hidePopupTimer: ReturnType<typeof setTimeout> | null = null;
    const cancelPopupHideTimer = () => {
      if (hidePopupTimer !== null) {
        clearTimeout(hidePopupTimer);
        hidePopupTimer = null;
      }
    };
    const schedulePopupHide = (target: Marker) => {
      cancelPopupHideTimer();
      hidePopupTimer = setTimeout(() => {
        target.closePopup();
        hidePopupTimer = null;
      }, POPUP_HIDE_DELAY_MS);
    };

    void import('leaflet.markercluster').then(() => {
      if (cancelled || !mapRef.current || !libRef.current) return;
      const mapInner = mapRef.current;
      const LInner = libRef.current;

      if (clusterRef.current) {
        mapInner.removeLayer(clusterRef.current);
        clusterRef.current = null;
      }

      if (markers.length === 0) {
        if (focusTarget) onFocusDone?.();
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
        const m = LInner.marker([item.latLng.lat, item.latLng.lon], {
          icon,
          indexedHitId: item.hitId,
          indexedFactType: item.factType,
          indexedYear: item.year,
          indexedListName: item.listName,
          indexedRecordUrl: item.recordUrl,
          indexedPopupHtml: item.popupHtml,
        } as MarkerOptions).bindPopup(item.popupHtml, MARKER_POPUP_OPTIONS);
        bindDismissibleHoverPopup(m, cancelPopupHideTimer, schedulePopupHide);
        leafletMarkers.push(m);
      }

      const clusterLayer = cluster as L.Layer & {
        on(evt: 'clustermouseover', fn: (a: { layer: Marker }) => void): void;
        on(evt: 'clustermouseout', fn: (a: { layer: Marker }) => void): void;
      };

      clusterLayer.on('clustermouseover', (a) => {
        const clusterMarker = a.layer;
        cancelPopupHideTimer();
        const children = getClusterChildMarkers(clusterMarker);
        if (children.length === 0) return;
        const { html, slice } = buildClusterHoverPopupHtml(children, t);
        clusterMarker.bindPopup(html, CLUSTER_POPUP_OPTIONS).openPopup();
        const el = clusterMarker.getPopup()?.getElement();
        if (!el) return;

        let flyout: HTMLDivElement | null = null;
        const removeFlyout = () => {
          if (flyout) {
            flyout.remove();
            flyout = null;
          }
        };

        const ac = new AbortController();
        const { signal } = ac;

        const onEnter = () => cancelPopupHideTimer();
        const onLeave = () => schedulePopupHide(clusterMarker);
        el.addEventListener('mouseenter', onEnter, { signal });
        el.addEventListener('mouseleave', onLeave, { signal });

        const cg = cluster as L.Layer & {
          zoomToShowLayer?: (layer: L.Layer, cb: () => void) => void;
        };

        slice.forEach((mk, idx) => {
          const o = mk.options as IndexedMarkerOpts;
          if (o.indexedRecordUrl?.trim() || !o.indexedPopupHtml?.trim()) return;
          const btn = el.querySelector(`button[data-indexed-cluster-line="${idx}"]`);
          if (!(btn instanceof HTMLButtonElement)) return;

          let hideFlyTimer: ReturnType<typeof setTimeout> | null = null;
          const cancelHideFly = () => {
            if (hideFlyTimer !== null) {
              clearTimeout(hideFlyTimer);
              hideFlyTimer = null;
            }
          };
          const scheduleHideFly = () => {
            cancelHideFly();
            hideFlyTimer = setTimeout(removeFlyout, 220);
          };

          const showFlyout = () => {
            cancelHideFly();
            removeFlyout();
            const div = document.createElement('div');
            div.className = 'indexed-cluster-person-flyout';
            div.style.cssText = [
              'position:fixed',
              'z-index:10050',
              'min-width:200px',
              'max-width:min(92vw,360px)',
              'max-height:min(50vh,340px)',
              'overflow:auto',
              'padding:10px 12px',
              'background:var(--paper,#fffef7)',
              'color:var(--ink,#111)',
              'border:1px solid rgba(0,0,0,.18)',
              'border-radius:8px',
              'box-shadow:0 8px 28px rgba(0,0,0,.35)',
            ].join(';');
            div.innerHTML = o.indexedPopupHtml!;
            positionFixedFlyoutNearAnchor(btn.getBoundingClientRect(), div);
            flyout = div;
            div.addEventListener('mouseenter', cancelHideFly, { signal });
            div.addEventListener('mouseleave', scheduleHideFly, { signal });
          };

          btn.addEventListener('mouseenter', showFlyout, { signal });
          btn.addEventListener('mouseleave', scheduleHideFly, { signal });
          btn.addEventListener(
            'click',
            (e) => {
              e.preventDefault();
              e.stopPropagation();
              removeFlyout();
              cancelPopupHideTimer();
              clusterMarker.closePopup();
              if (typeof cg.zoomToShowLayer === 'function') {
                cg.zoomToShowLayer(mk, () => {
                  mk.openPopup();
                });
              } else {
                mapInner.setView(mk.getLatLng(), Math.max(mapInner.getZoom(), 12), { animate: true });
                mk.openPopup();
              }
            },
            { signal },
          );
        });

        clusterMarker.once('popupclose', () => {
          ac.abort();
          removeFlyout();
        });
      });

      clusterLayer.on('clustermouseout', (a) => {
        schedulePopupHide(a.layer);
      });

      cluster.addLayers(leafletMarkers);
      cluster.addTo(mapInner);
      clusterRef.current = cluster;

      const bounds = LInner.latLngBounds(leafletMarkers.map((mk) => mk.getLatLng()));
      if (
        bounds.isValid() &&
        leafletMarkers.length > 0 &&
        !initialFitDoneRef.current &&
        !focusTarget
      ) {
        mapInner.fitBounds(bounds, { padding: [28, 28], maxZoom: 8, animate: false });
        initialFitDoneRef.current = true;
      }

      if (focusTarget) {
        const target = leafletMarkers.find((mk) => {
          const o = mk.options as IndexedMarkerOpts;
          return (
            o.indexedHitId === focusTarget.hitId &&
            o.indexedFactType === focusTarget.factType &&
            o.indexedYear === focusTarget.year
          );
        });
        if (target) {
          cancelPopupHideTimer();
          const cg = cluster as L.Layer & {
            zoomToShowLayer?: (layer: L.Layer, cb: () => void) => void;
          };
          if (typeof cg.zoomToShowLayer === 'function') {
            cg.zoomToShowLayer(target, () => {
              target.openPopup();
              onFocusDone?.();
            });
          } else {
            mapInner.setView(target.getLatLng(), Math.max(mapInner.getZoom(), 12), { animate: true });
            target.openPopup();
            onFocusDone?.();
          }
        } else {
          onFocusDone?.();
        }
      }

      mapInner.invalidateSize({ animate: false });
      requestAnimationFrame(() => mapInner.invalidateSize({ animate: false }));
    });

    return () => {
      cancelled = true;
      cancelPopupHideTimer();
      if (clusterRef.current && mapRef.current) {
        mapRef.current.removeLayer(clusterRef.current);
      }
      clusterRef.current = null;
    };
  }, [tilesReady, markers, focusTarget, onFocusDone, t]);

  return { tilesReady };
}
