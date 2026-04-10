import { escapeHtml } from '@/lib/utils/mapPlace';
import type { TranslationFn } from '@/lib/i18n/types';
import indexedEventsBundle from '@/lib/data/indexedEvents.json';
import eventAttachmentsBundle from '@/lib/data/indexedEventAttachments.json';
import precisePlaceCoordsBundle from '@/lib/data/precisePlaceCoords.json';
import type { IndexedEventAttachmentsFile } from '@/lib/types/indexedEventAttachment';
import { getPhotoById } from '@/lib/data/photos';

const ATTACHMENTS = eventAttachmentsBundle as IndexedEventAttachmentsFile;
const PRECISE_COORDS = precisePlaceCoordsBundle as {
  byKey: Record<
    string,
    { status?: string; lat?: number; lon?: number; label?: string; placeKey?: string }
  >;
  byLabel?: Record<string, { lat?: number; lon?: number; source?: string }>;
};

/** Только пути под `public/photos/…`, без внешних URL. */
function isSafePublicPhotoPath(src: string): boolean {
  return /^\/photos\/[\w\-./]+\.(jpe?g|png|gif|webp)$/i.test(src.trim());
}

function resolveAttachmentForPopup(hitId: string): { precisePlace?: string; imageUrls: string[] } {
  const att = ATTACHMENTS.byHitId[hitId];
  if (!att) return { imageUrls: [] };
  const imageUrls: string[] = [];
  for (const id of att.photoIds ?? []) {
    const p = getPhotoById(id);
    if (p?.src && isSafePublicPhotoPath(p.src)) imageUrls.push(p.src);
  }
  for (const s of att.imageSrcs ?? []) {
    const u = s.trim();
    if (isSafePublicPhotoPath(u)) imageUrls.push(u);
  }
  return {
    precisePlace: att.precisePlace?.trim() || undefined,
    imageUrls,
  };
}

function renderAttachmentBlock(hitId: string, t: TranslationFn): string {
  const { precisePlace, imageUrls } = resolveAttachmentForPopup(hitId);
  if (!precisePlace && imageUrls.length === 0) return '';

  const section = escapeHtml(t('mapArchiveSourceSection'));
  let inner = '';
  if (precisePlace) {
    inner += `<div style="font-size:11px;font-weight:600;margin-bottom:2px">${escapeHtml(t('mapArchivePrecisePlaceLabel'))}</div><div style="font-size:11px;opacity:.9">${escapeHtml(precisePlace)}</div>`;
  }
  if (imageUrls.length > 0) {
    if (precisePlace) inner += `<div style="height:6px"></div>`;
    inner += `<div style="font-size:11px;font-weight:600;margin-bottom:4px">${escapeHtml(t('mapArchiveRegisterImages'))}</div>`;
    inner += imageUrls
      .map(
        (src) =>
          `<a href="${escapeHtml(src)}" target="_blank" rel="noopener noreferrer" style="display:block;margin-top:4px;line-height:0"><img src="${escapeHtml(src)}" alt="" width="240" style="max-width:100%;height:auto;border-radius:4px" loading="lazy"/></a>`,
      )
      .join('');
  }

  return `<div style="margin-top:10px;padding-top:8px;border-top:1px solid rgba(120,120,120,.25)"><div style="font-size:10px;opacity:.75;margin-bottom:6px;text-transform:uppercase;letter-spacing:.03em">${section}</div>${inner}</div>`;
}

function resolvePopupPlace(hitId: string, fallback: string): { main: string; secondary?: string } {
  const { precisePlace } = resolveAttachmentForPopup(hitId);
  const p = precisePlace?.trim();
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

function resolveIndexedEventCoordWithPrecisePlace(
  hitId: string,
  placeKey: string,
): { lat: number; lon: number } | null {
  const att = ATTACHMENTS.byHitId[hitId];
  const p = att?.precisePlace?.trim();
  if (p) {
    const key = `${p}@@${placeKey}`;
    const c = PRECISE_COORDS.byKey?.[key];
    if (c && Number.isFinite(c.lat) && Number.isFinite(c.lon)) {
      return { lat: c.lat as number, lon: c.lon as number };
    }
    const byLabel = PRECISE_COORDS.byLabel?.[p];
    if (byLabel && Number.isFinite(byLabel.lat) && Number.isFinite(byLabel.lon)) {
      return { lat: byLabel.lat as number, lon: byLabel.lon as number };
    }
  }
  return resolveIndexedEventCoord(placeKey);
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
    const att = ATTACHMENTS.byHitId[e.hitId];
    const p = att?.precisePlace?.trim();
    const effectiveKey = p ? `${p}@@${e.placeKey}` : e.placeKey;
    const has =
      (p && PRECISE_COORDS.byKey?.[effectiveKey] && resolveIndexedEventCoordWithPrecisePlace(e.hitId, e.placeKey)) ||
      resolveIndexedEventCoord(e.placeKey);
    if (!has) continue;
    countsByPlace.set(effectiveKey, (countsByPlace.get(effectiveKey) ?? 0) + 1);
  }
  let maxCount = 1;
  for (const n of countsByPlace.values()) {
    maxCount = Math.max(maxCount, n);
  }

  const out: IndexedMapMarker[] = [];

  events.forEach((e, idx) => {
    const att = ATTACHMENTS.byHitId[e.hitId];
    const p = att?.precisePlace?.trim();
    const effectiveKey = p ? `${p}@@${e.placeKey}` : e.placeKey;
    const base = resolveIndexedEventCoordWithPrecisePlace(e.hitId, e.placeKey);
    if (!base) return;

    const atPlace = countsByPlace.get(effectiveKey) ?? 1;
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

    const place = resolvePopupPlace(e.hitId, e.placeLabel);
    const placeHtml = `<div style="font-size:12px;margin-top:4px;opacity:.85">${escapeHtml(place.main)}</div>${
      place.secondary
        ? `<div style="font-size:11px;margin-top:2px;opacity:.65">${escapeHtml(place.secondary)}</div>`
        : ''
    }`;

    const extra = renderAttachmentBlock(e.hitId, t);
    const popupHtml = `<div style="min-width:200px"><div style="font-weight:600;margin-bottom:4px">${escapeHtml(e.principalName)}</div><div style="font-size:12px;opacity:.9">${escapeHtml(fact)} · ${e.year}</div>${lineDate}${placeHtml}${url ? `<div style="margin-top:8px"><a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" style="font-size:12px;text-decoration:underline">${escapeHtml(open)}</a></div>` : ''}${extra}</div>`;

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
