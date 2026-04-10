import { escapeHtml } from '@/lib/utils/mapPlace';
import type { TranslationFn } from '@/lib/i18n/types';
import indexedEventsBundle from '@/lib/data/indexedEvents.json';

/** Публичный URL FamilySearch для ссылок из относительных путей ARK. */
export const FAMILYSEARCH_PUBLIC_ORIGIN = 'https://www.familysearch.org';

export type IndexedEvent = {
  hitId: string;
  recordUrl: string | null;
  principalName: string;
  factType: string;
  placeLabel: string;
  placeKey: string;
  year: number;
  dateOriginal: string | null;
};

export const INDEXED_EVENTS = indexedEventsBundle.events as IndexedEvent[];

/**
 * Заранее заданные координаты для каждого уникального placeKey в выгрузке
 * (нормализованные названия из FamilySearch + locality индекса).
 */
const PLACE_COORDS: Record<string, { lat: number; lon: number }> = {
  'Cheremoshnoye, Berdichev, Kiev, Russian Empire': { lat: 49.8993, lon: 28.6022 },
  'Cherkasy, Ukraine': { lat: 49.4444, lon: 32.0597 },
  'Cherkasy, Ukraine, Soviet Union': { lat: 49.4444, lon: 32.0597 },
  'Donetsk Guberniya, Ukraine, Soviet Union': { lat: 48.0159, lon: 37.8028 },
  'Donetsk, Ukraine': { lat: 48.0159, lon: 37.8028 },
  'Kharkiv, Ukraine, Soviet Union': { lat: 49.9935, lon: 36.2304 },
  'Kharkov, Russian Empire': { lat: 49.9935, lon: 36.2304 },
  'Kiev, Kiev, Kiev, Russian Empire': { lat: 50.4501, lon: 30.5234 },
  'Kyiv, Ukraine': { lat: 50.4501, lon: 30.5234 },
  'Kyïv, Ukraine': { lat: 50.4501, lon: 30.5234 },
  'Lyubcha, Bila Tserkva, Kyiv, Ukraine': { lat: 49.52, lon: 30.25 },
  'Tarashcha, Bila Tserkva, Kyiv, Ukraine': { lat: 49.5555, lon: 30.5023 },
  'Tomašovka, Uman, Cherkasy, Ukraine': { lat: 48.6456, lon: 30.1091 },
  Ukraine: { lat: 48.3794, lon: 31.1656 },
};

export function resolveIndexedEventCoord(placeKey: string): { lat: number; lon: number } | null {
  const c = PLACE_COORDS[placeKey];
  return c ?? null;
}

export function getIndexedEventYearBounds(): { min: number; max: number } {
  let min = Infinity;
  let max = -Infinity;
  for (const e of INDEXED_EVENTS) {
    min = Math.min(min, e.year);
    max = Math.max(max, e.year);
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return { min: 1800, max: 2000 };
  }
  return { min, max };
}

export type IndexedMapMarker = {
  id: string;
  /** Реальные координаты места; плотность показывает MarkerCluster на карте. */
  latLng: { lat: number; lon: number };
  /** Диаметр круга в px: больше, если в этой точке (placeKey) больше событий в текущей выборке. */
  circlePx: number;
  color: string;
  popupHtml: string;
};

function hueFromString(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return `hsl(${h % 360} 68% 42%)`;
}

const FACT_I18N: Partial<Record<string, string>> = {
  Birth: 'mapArchiveFactBirth',
  Death: 'mapArchiveFactDeath',
  Marriage: 'mapArchiveFactMarriage',
  Burial: 'mapArchiveFactBurial',
  Christening: 'mapArchiveFactChristening',
};

function factTypeLabel(t: TranslationFn, type: string): string {
  const key = FACT_I18N[type];
  if (key) {
    const label = t(key);
    if (label && label !== key) return label;
  }
  return type;
}

function circlePxForPlaceCounts(countAtPlace: number, maxCount: number): number {
  const minPx = 14;
  const maxPx = 30;
  if (maxCount <= 1) return Math.round((minPx + maxPx) / 2);
  const t = (countAtPlace - 1) / (maxCount - 1);
  return Math.round(minPx + t * (maxPx - minPx));
}

export function buildIndexedMapMarkers(
  events: IndexedEvent[],
  t: TranslationFn,
): IndexedMapMarker[] {
  const countsByPlace = new Map<string, number>();
  for (const e of events) {
    if (!resolveIndexedEventCoord(e.placeKey)) continue;
    countsByPlace.set(e.placeKey, (countsByPlace.get(e.placeKey) ?? 0) + 1);
  }
  let maxCount = 1;
  for (const n of countsByPlace.values()) {
    maxCount = Math.max(maxCount, n);
  }

  const out: IndexedMapMarker[] = [];

  events.forEach((e, idx) => {
    const base = resolveIndexedEventCoord(e.placeKey);
    if (!base) return;

    const atPlace = countsByPlace.get(e.placeKey) ?? 1;
    const circlePx = circlePxForPlaceCounts(atPlace, maxCount);

    const color = hueFromString(`${e.hitId}:${e.factType}:${idx}`);
    const url =
      e.recordUrl && e.recordUrl.startsWith('/')
        ? `${FAMILYSEARCH_PUBLIC_ORIGIN}${e.recordUrl}`
        : '';
    const fact = factTypeLabel(t, e.factType);
    const open = t('mapArchiveOpenRecord');
    const lineDate = e.dateOriginal
      ? `<div style="font-size:11px;opacity:.75;margin-top:2px">${escapeHtml(e.dateOriginal)}</div>`
      : '';

    const popupHtml = `<div style="min-width:200px"><div style="font-weight:600;margin-bottom:4px">${escapeHtml(e.principalName)}</div><div style="font-size:12px;opacity:.9">${escapeHtml(fact)} · ${e.year}</div>${lineDate}<div style="font-size:12px;margin-top:4px;opacity:.85">${escapeHtml(e.placeLabel)}</div>${url ? `<div style="margin-top:8px"><a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" style="font-size:12px;text-decoration:underline">${escapeHtml(open)}</a></div>` : ''}</div>`;

    out.push({
      id: `${e.hitId}-${e.factType}-${e.year}-${idx}`,
      latLng: { lat: base.lat, lon: base.lon },
      circlePx,
      color,
      popupHtml,
    });
  });

  return out;
}
