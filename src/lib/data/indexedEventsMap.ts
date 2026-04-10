import type { Locale } from '@/lib/i18n/config';
import type { GeocodedPoint } from '@/lib/constants/map';
import type { TranslationFn } from '@/lib/i18n/types';
import { escapeHtml, formatPlaceLabelForLocale, normalizePlace, splitPlaceList, toPlaceFallbackKey } from '@/lib/utils/mapPlace';
import { formatNameByLocale } from '@/lib/utils/person';
import { transliterateCyrillicToLatin } from '@/lib/utils/transliteration';
import indexedEventsBundle from '@/lib/data/indexedEvents.json';
import eventAttachmentsBundle from '@/lib/data/indexedEventAttachments.json';
import type { IndexedEventAttachmentsFile } from '@/lib/types/indexedEventAttachment';
import { getPhotoById } from '@/lib/data/photos';

const ATTACHMENTS = eventAttachmentsBundle as IndexedEventAttachmentsFile;

/** Только пути под `public/photos/…`, без внешних URL. */
function isSafePublicPhotoPath(src: string): boolean {
  return /^\/photos\/[\w\-./]+\.(jpe?g|png|gif|webp)$/i.test(src.trim());
}

function resolveAttachmentImages(hitId: string): string[] {
  const att = ATTACHMENTS.byHitId[hitId];
  if (!att) return [];
  const imageUrls: string[] = [];
  for (const id of att.photoIds ?? []) {
    const p = getPhotoById(id);
    if (p?.src && isSafePublicPhotoPath(p.src)) imageUrls.push(p.src);
  }
  for (const s of att.imageSrcs ?? []) {
    const u = s.trim();
    if (isSafePublicPhotoPath(u)) imageUrls.push(u);
  }
  return imageUrls;
}

function renderAttachmentBlock(hitId: string, t: TranslationFn, locale: Locale): string {
  const imageUrls = resolveAttachmentImages(hitId);
  if (imageUrls.length === 0) return '';

  const section = escapeHtml(t('mapArchiveSourceSection'));
  let inner = '';
  inner += `<div style="font-size:11px;font-weight:600;margin-bottom:4px">${escapeHtml(t('mapArchiveRegisterImages'))}</div>`;
  inner += imageUrls
    .map(
      (src) =>
        `<a href="${escapeHtml(src)}" target="_blank" rel="noopener noreferrer" style="display:block;margin-top:4px;line-height:0"><img src="${escapeHtml(src)}" alt="" width="240" style="max-width:100%;height:auto;border-radius:4px" loading="lazy"/></a>`,
    )
    .join('');

  return `<div style="margin-top:10px;padding-top:8px;border-top:1px solid rgba(120,120,120,.25)"><div style="font-size:10px;opacity:.75;margin-bottom:6px;text-transform:uppercase;letter-spacing:.03em">${section}</div>${inner}</div>`;
}

function popupPlacesForEvent(e: IndexedEvent): { main: string; secondary?: string } {
  const p = e.precisePlace?.trim();
  const fallback = e.placeLabel;
  if (!p) return { main: fallback };
  if (p === fallback) return { main: fallback };
  return { main: p, secondary: fallback };
}

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
  /** Уточнённое место (вшито в JSON вместе с координатами). */
  precisePlace?: string;
  lat?: number;
  lon?: number;
};

export const INDEXED_EVENTS = indexedEventsBundle.events as IndexedEvent[];

export type IndexedEventGeoResolveOptions = {
  /** Если сегменты места не сопоставились — показать маркер здесь (напр. «домашняя» точка линии). */
  defaultWhenUnresolved?: GeocodedPoint;
};

/** «Donetsk Guberniya» → нет ключа целиком, но есть `donetsk`. */
function pointForNormalizedPlaceSegment(
  normalizedSegment: string,
  map: Record<string, GeocodedPoint>,
): GeocodedPoint | undefined {
  const k = toPlaceFallbackKey(normalizedSegment);
  if (!k) return undefined;
  if (map[k]) return map[k];
  const parts = k.split('-').filter(Boolean);
  for (let len = parts.length - 1; len >= 1; len -= 1) {
    const prefix = parts.slice(0, len).join('-');
    if (map[prefix]) return map[prefix];
  }
  return undefined;
}

/**
 * Координаты события: из JSON или из placeFallbacks (совпадение по сегментам placeLabel / placeKey).
 */
export function resolveIndexedEventGeo(
  e: IndexedEvent,
  placeFallbacks: Record<string, GeocodedPoint>,
  options?: IndexedEventGeoResolveOptions,
): GeocodedPoint | null {
  if (Number.isFinite(e.lat) && Number.isFinite(e.lon)) {
    return { lat: e.lat as number, lon: e.lon as number };
  }
  const candidates: string[] = [];
  for (const x of splitPlaceList(e.placeLabel)) candidates.push(x);
  for (const x of splitPlaceList(e.placeKey)) candidates.push(x);
  if (e.placeKey?.trim()) candidates.push(e.placeKey.trim());
  const seen = new Set<string>();
  for (const raw of candidates) {
    const n = normalizePlace(raw);
    if (!n || seen.has(n)) continue;
    seen.add(n);
    const pt = pointForNormalizedPlaceSegment(n, placeFallbacks);
    if (pt) return pt;
  }
  if (options?.defaultWhenUnresolved) return options.defaultWhenUnresolved;
  return null;
}

/** Поиск по полю principalName: подстрока в исходном имени или в латинской транслитерации. */
export function indexedEventPrincipalMatchesSearch(principalName: string, normalizedQuery: string): boolean {
  const needle = normalizedQuery.trim().toLowerCase();
  if (needle.length === 0) return true;
  if (principalName.toLowerCase().includes(needle)) return true;
  return transliterateCyrillicToLatin(principalName).toLowerCase().includes(needle);
}

function eventHasGeo(
  e: IndexedEvent,
  placeFallbacks?: Record<string, GeocodedPoint>,
  geoOptions?: IndexedEventGeoResolveOptions,
): boolean {
  if (Number.isFinite(e.lat) && Number.isFinite(e.lon)) return true;
  if (placeFallbacks && resolveIndexedEventGeo(e, placeFallbacks, geoOptions)) return true;
  return false;
}

export function getIndexedEventYearBounds(events: IndexedEvent[] = INDEXED_EVENTS): { min: number; max: number } {
  let min = Infinity;
  let max = -Infinity;
  for (const e of events) {
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
  hitId: string;
  factType: string;
  year: number;
  /** Реальные координаты места; плотность показывает MarkerCluster на карте. */
  latLng: { lat: number; lon: number };
  /** Диаметр круга в px: больше, если в этой точке (placeKey) больше событий в текущей выборке. */
  circlePx: number;
  color: string;
  popupHtml: string;
  /** Имя для списка в попапе кластера (plain text, экранируется на карте). */
  listName: string;
  /** Полный URL записи FamilySearch или null. */
  recordUrl: string | null;
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

export function indexedEventFactTypeLabel(t: TranslationFn, type: string): string {
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

function effectivePlaceKey(e: IndexedEvent): string {
  const p = e.precisePlace?.trim();
  return p ? `${p}@@${e.placeKey}` : e.placeKey;
}

export function buildIndexedMapMarkers(
  events: IndexedEvent[],
  t: TranslationFn,
  locale: Locale,
  placeFallbacks?: Record<string, GeocodedPoint>,
  geoOptions?: IndexedEventGeoResolveOptions,
): IndexedMapMarker[] {
  const countsByPlace = new Map<string, number>();
  for (const e of events) {
    if (!eventHasGeo(e, placeFallbacks, geoOptions)) continue;
    const key = effectivePlaceKey(e);
    countsByPlace.set(key, (countsByPlace.get(key) ?? 0) + 1);
  }
  let maxCount = 1;
  for (const n of countsByPlace.values()) {
    maxCount = Math.max(maxCount, n);
  }

  const out: IndexedMapMarker[] = [];

  events.forEach((e, idx) => {
    if (!eventHasGeo(e, placeFallbacks, geoOptions)) return;
    const resolved =
      Number.isFinite(e.lat) && Number.isFinite(e.lon)
        ? { lat: e.lat as number, lon: e.lon as number }
        : placeFallbacks
          ? resolveIndexedEventGeo(e, placeFallbacks, geoOptions)
          : null;
    if (!resolved) return;
    const base = resolved;

    const atPlace = countsByPlace.get(effectivePlaceKey(e)) ?? 1;
    const circlePx = circlePxForPlaceCounts(atPlace, maxCount);

    const color = hueFromString(`${e.hitId}:${e.factType}:${idx}`);
    const url =
      e.recordUrl && e.recordUrl.startsWith('/')
        ? `${FAMILYSEARCH_PUBLIC_ORIGIN}${e.recordUrl}`
        : '';
    const fact = indexedEventFactTypeLabel(t, e.factType);
    const open = t('mapArchiveOpenRecord');
    const lineDate = e.dateOriginal
      ? `<div style="font-size:11px;opacity:.75;margin-top:2px">${escapeHtml(e.dateOriginal)}</div>`
      : '';

    const place = popupPlacesForEvent(e);
    const mainPlace = formatPlaceLabelForLocale(place.main, locale);
    const secondaryPlace = place.secondary ? formatPlaceLabelForLocale(place.secondary, locale) : '';
    const placeHtml = `<div style="font-size:12px;margin-top:4px;opacity:.85">${escapeHtml(mainPlace)}</div>${
      place.secondary
        ? `<div style="font-size:11px;margin-top:2px;opacity:.65">${escapeHtml(secondaryPlace)}</div>`
        : ''
    }`;

    const listName = formatNameByLocale(e.principalName, locale);
    const displayName = escapeHtml(listName);
    const extra = renderAttachmentBlock(e.hitId, t, locale);
    const popupHtml = `<div style="min-width:200px"><div style="font-weight:600;margin-bottom:4px">${displayName}</div><div style="font-size:12px;opacity:.9">${escapeHtml(fact)} · ${e.year}</div>${lineDate}${placeHtml}${url ? `<div style="margin-top:8px"><a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" style="font-size:12px;text-decoration:underline">${escapeHtml(open)}</a></div>` : ''}${extra}</div>`;

    out.push({
      id: `${e.hitId}-${e.factType}-${e.year}-${idx}`,
      hitId: e.hitId,
      factType: e.factType,
      year: e.year,
      latLng: { lat: base.lat, lon: base.lon },
      circlePx,
      color,
      popupHtml,
      listName,
      recordUrl: url || null,
    });
  });

  return out;
}
