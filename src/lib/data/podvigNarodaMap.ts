import type { Locale } from '@/lib/i18n/config';
import type { GeocodedPoint } from '@/lib/constants/map';
import type { TranslationFn } from '@/lib/i18n/types';
import {
  resolveIndexedEventGeo,
  type IndexedEvent,
  type IndexedEventGeoResolveOptions,
  type IndexedMapMarker,
} from '@/lib/data/indexedEventsMap';
import type { PodvigNarodaRecord } from '@/lib/types/podvigNaroda';
import { escapeHtml, formatPlaceLabelForLocale } from '@/lib/utils/mapPlace';
import { formatNameByLocale } from '@/lib/utils/person';
import { transliterateCyrillicToLatin } from '@/lib/utils/transliteration';

/** Совпадает с маркером Leaflet для фокуса после выбора в поиске. */
export const PODVIG_NARODA_MAP_FACT_TYPE = 'podvig_person' as const;

const PERSON_PLACE_SEP = '\u0002';

const RECORD_TYPE_POPUP_ORDER: Partial<Record<PodvigNarodaRecord['recordType'], number>> = {
  award: 0,
  recommendation: 1,
  jubilee_card: 2,
  card_index: 3,
  unknown: 4,
};

/** Год рождения из строки вида `__.__.1914` или полной даты. */
export function parsePodvigBirthYear(birthDateRaw?: string): number | null {
  if (!birthDateRaw?.trim()) return null;
  const m = birthDateRaw.match(/\b(1[0-9]{3}|20[0-9]{2})\b/);
  if (m) return Number.parseInt(m[0], 10);
  return null;
}

function normalizeNamePart(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replaceAll('ё', 'е')
    .replace(/\s+/g, ' ');
}

/**
 * Ключ личности для карты: ФИО + год рождения (без сырой строки даты),
 * чтобы «__.__.1914» и «01.01.1914» считались одним человеком.
 */
export function podvigPersonMergeKey(person: PodvigNarodaRecord['person'], birthYear: number): string {
  return [
    normalizeNamePart(person.lastName),
    normalizeNamePart(person.firstName),
    normalizeNamePart(person.patronymic),
    String(birthYear),
  ].join('\u0001');
}

/**
 * Нормализация подписи места призыва для схлопывания вариантов с лишними запятыми,
 * «г.», разным порядком частей и т.п.
 */
export function normalizePodvigPlaceForMerge(raw: string): string {
  let s = raw.trim().toLowerCase().replaceAll('ё', 'е');
  s = s.replace(/[\s,.;|/()[\]«»"'''·…]+/g, ' ');
  s = s
    .replace(/^г\.?\s+/i, '')
    .replace(/^гор\.\s+/i, '')
    .replace(/^город\s+/i, '')
    .replace(/^пос\.?\s+/i, '')
    .replace(/^пгт\.?\s+/i, '')
    .replace(/^с\.?\s+/i, '')
    .replace(/^д\.?\s+/i, '')
    .replace(/^ст\.?\s+/i, '');
  s = s.replace(/\s+/g, ' ').trim();
  const tokens = s.split(/\s+/).filter(Boolean);
  const noise = new Set([
    'край',
    'область',
    'обл',
    'рн',
    'район',
    'ао',
    'респ',
    'республика',
    'украина',
    'россия',
    'ссср',
    'рф',
  ]);
  let meaningful = tokens.filter((w) => !noise.has(w) && w.length > 1);
  if (meaningful.length === 0) {
    meaningful = tokens.filter((w) => w.length > 1);
  }
  meaningful.sort((a, b) => a.localeCompare(b, 'ru'));
  return meaningful.join(' ');
}

function placeWordSet(norm: string): Set<string> {
  return new Set(norm.split(/\s+/).filter((w) => w.length > 2));
}

function jaccardWordOverlap(a: string, b: string): number {
  const A = placeWordSet(a);
  const B = placeWordSet(b);
  if (A.size === 0 && B.size === 0) return 1;
  let inter = 0;
  for (const w of A) {
    if (B.has(w)) inter += 1;
  }
  const uni = A.size + B.size - inter;
  return uni > 0 ? inter / uni : 0;
}

/** Один человек, один год: разные строки одного и того же РВК/пункта. */
function draftPlacesLikelySame(
  placeA: string,
  placeB: string,
  placeFallbacks: Record<string, GeocodedPoint>,
  geoOptions?: IndexedEventGeoResolveOptions,
): boolean {
  const na = normalizePodvigPlaceForMerge(placeA);
  const nb = normalizePodvigPlaceForMerge(placeB);
  if (na === nb) return true;
  const shorter = na.length <= nb.length ? na : nb;
  const longer = na.length <= nb.length ? nb : na;
  if (shorter.length >= 5 && longer.includes(shorter)) return true;

  const jac = jaccardWordOverlap(na, nb);
  if (jac >= 0.52) return true;

  const ga = resolvePodvigGeoForLabel(placeA, placeFallbacks, geoOptions);
  const gb = resolvePodvigGeoForLabel(placeB, placeFallbacks, geoOptions);
  if (!ga || !gb) return jac >= 0.38;

  const dist = Math.hypot(ga.lat - gb.lat, ga.lon - gb.lon);
  const interCount = (() => {
    const A = placeWordSet(na);
    const B = placeWordSet(nb);
    let n = 0;
    for (const w of A) {
      if (B.has(w)) n += 1;
    }
    return n;
  })();

  if (dist < 0.028 && (jac >= 0.28 || interCount >= 2)) return true;
  if (dist < 0.014 && interCount >= 1 && jac >= 0.15) return true;
  return false;
}

class UnionFind {
  private readonly p: number[];

  constructor(n: number) {
    this.p = Array.from({ length: n }, (_, i) => i);
  }

  find(i: number): number {
    if (this.p[i] !== i) this.p[i] = this.find(this.p[i]!);
    return this.p[i]!;
  }

  union(a: number, b: number): void {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra !== rb) this.p[ra] = rb;
  }
}

function pickShortestPlaceLabel(labels: readonly string[]): string {
  const uniq = [...new Set(labels.map((x) => x.trim()).filter(Boolean))];
  if (uniq.length === 0) return '';
  uniq.sort((a, b) => a.length - b.length || a.localeCompare(b, 'ru'));
  return uniq[0]!;
}

function mergePodvigRowsByLikelySamePlace(
  rows: PodvigMapTimelineRow[],
  placeFallbacks: Record<string, GeocodedPoint>,
  geoOptions?: IndexedEventGeoResolveOptions,
): PodvigMapTimelineRow[] {
  const n = rows.length;
  if (n <= 1) return rows;

  const uf = new UnionFind(n);
  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      if (rows[i]!.personKey !== rows[j]!.personKey || rows[i]!.birthYear !== rows[j]!.birthYear) {
        continue;
      }
      if (draftPlacesLikelySame(rows[i]!.placeLabel, rows[j]!.placeLabel, placeFallbacks, geoOptions)) {
        uf.union(i, j);
      }
    }
  }

  const buckets = new Map<number, PodvigMapTimelineRow[]>();
  for (let i = 0; i < n; i += 1) {
    const r = uf.find(i);
    let arr = buckets.get(r);
    if (!arr) {
      arr = [];
      buckets.set(r, arr);
    }
    arr.push(rows[i]!);
  }

  const merged: PodvigMapTimelineRow[] = [];
  for (const group of buckets.values()) {
    if (group.length === 1) {
      merged.push(group[0]!);
      continue;
    }
    const recordsById = new Map<string, PodvigNarodaRecord>();
    for (const row of group) {
      for (const rec of row.records) {
        recordsById.set(rec.id, rec);
      }
    }
    const placeLabel = pickShortestPlaceLabel(group.map((g) => g.placeLabel));
    const personKey = group[0]!.personKey;
    const birthYear = Math.min(...group.map((g) => g.birthYear));
    const displayName = group[0]!.displayName;
    const placeNorm = normalizePodvigPlaceForMerge(placeLabel);
    const mapEntryId = `${personKey}${PERSON_PLACE_SEP}${birthYear}${PERSON_PLACE_SEP}${placeNorm}`;
    merged.push({
      mapEntryId,
      personKey,
      birthYear,
      displayName,
      placeLabel,
      records: sortPodvigRecordsForPopup([...recordsById.values()]),
    });
  }

  merged.sort((a, b) => {
    const na = a.displayName.localeCompare(b.displayName, 'ru', { sensitivity: 'base' });
    if (na !== 0) return na;
    const pa = a.placeLabel.localeCompare(b.placeLabel, 'ru', { sensitivity: 'base' });
    if (pa !== 0) return pa;
    return b.birthYear - a.birthYear;
  });

  return merged;
}

/** Публичная карточка на сайте ОБД (id — «номер в базе данных»). */
export function buildPodvigNarodaRecordUrl(recordId: string): string | null {
  const id = recordId.trim();
  if (!id) return null;
  return `https://www.podvignaroda.ru/?#id=${encodeURIComponent(id)}`;
}

/** Место для геокодинга: призывной пункт (награда), затем картотека / юбилейная. */
export function podvigGeoPlaceLabel(record: PodvigNarodaRecord): string | null {
  if (record.recordType === 'award' && record.award?.draftOffice?.trim()) {
    return record.award.draftOffice.trim().split('|')[0]!.trim();
  }
  if (record.recordType === 'card_index' && record.cardIndex?.residenceOrLocality?.trim()) {
    return record.cardIndex.residenceOrLocality.trim().split('|')[0]!.trim();
  }
  if (record.recordType === 'jubilee_card' && record.jubileeCard?.locality?.trim()) {
    return record.jubileeCard.locality.trim().split('|')[0]!.trim();
  }
  if (record.recordType === 'recommendation' && record.recommendation?.militaryUnitOrBody?.trim()) {
    return record.recommendation.militaryUnitOrBody.trim();
  }
  return null;
}

export function podvigRecordSubtitle(record: PodvigNarodaRecord): string {
  if (record.recordType === 'award' && record.award?.title) return record.award.title;
  if (record.recordType === 'jubilee_card' && record.jubileeCard?.orderOrMedal) {
    return record.jubileeCard.orderOrMedal;
  }
  if (record.recordType === 'card_index' && record.cardIndex?.seriesTitle) {
    return record.cardIndex.seriesTitle;
  }
  if (record.recordType === 'recommendation' && record.recommendation?.title) {
    return record.recommendation.title;
  }
  return record.recordType;
}

function personDisplayName(record: PodvigNarodaRecord): string {
  const { lastName, firstName, patronymic } = record.person;
  return [lastName, firstName, patronymic].filter(Boolean).join(' ').trim() || lastName || firstName || record.id;
}

export function podvigPersonMatchesSearch(displayName: string, normalizedQuery: string): boolean {
  const needle = normalizedQuery.trim().toLowerCase();
  if (needle.length === 0) return true;
  if (displayName.toLowerCase().includes(needle)) return true;
  return transliterateCyrillicToLatin(displayName).toLowerCase().includes(needle);
}

function resolvePodvigGeoForLabel(
  placeLabel: string,
  placeFallbacks: Record<string, GeocodedPoint>,
  options?: IndexedEventGeoResolveOptions,
): GeocodedPoint | null {
  const synthetic: IndexedEvent = {
    hitId: '',
    recordUrl: null,
    principalName: '',
    factType: '',
    placeLabel,
    placeKey: placeLabel,
    year: 1900,
    dateOriginal: null,
  };
  return resolveIndexedEventGeo(synthetic, placeFallbacks, options);
}

function sortPodvigRecordsForPopup(records: PodvigNarodaRecord[]): PodvigNarodaRecord[] {
  return [...records].sort((a, b) => {
    const oa = RECORD_TYPE_POPUP_ORDER[a.recordType] ?? 9;
    const ob = RECORD_TYPE_POPUP_ORDER[b.recordType] ?? 9;
    if (oa !== ob) return oa - ob;
    return podvigRecordSubtitle(a).localeCompare(podvigRecordSubtitle(b), 'ru', { sensitivity: 'base' });
  });
}

export type PodvigMapTimelineRow = {
  /** Стабильный id маркера: один человек в одном месте призыва. */
  mapEntryId: string;
  personKey: string;
  birthYear: number;
  displayName: string;
  placeLabel: string;
  /** Все карточки этого человека для данной точки (награды, картотеки и т.д.). */
  records: PodvigNarodaRecord[];
};

/**
 * Строки карты: уникальные люди по паре (личность, место призыва / учётная локация),
 * с годом рождения и геокодируемым местом.
 */
export function buildPodvigTimelineRows(
  records: readonly PodvigNarodaRecord[],
  placeFallbacks: Record<string, GeocodedPoint>,
  geoOptions?: IndexedEventGeoResolveOptions,
): PodvigMapTimelineRow[] {
  type Agg = {
    personKey: string;
    birthYear: number;
    displayName: string;
    placeLabel: string;
    recordsById: Map<string, PodvigNarodaRecord>;
  };

  const aggs = new Map<string, Agg>();

  for (const record of records) {
    const birthYear = parsePodvigBirthYear(record.person.birthDateRaw);
    if (birthYear == null) continue;
    const placeLabel = podvigGeoPlaceLabel(record);
    if (!placeLabel) continue;
    if (!resolvePodvigGeoForLabel(placeLabel, placeFallbacks, geoOptions)) continue;

    const personKey = podvigPersonMergeKey(record.person, birthYear);
    const placeNorm = normalizePodvigPlaceForMerge(placeLabel);
    const aggKey = `${personKey}${PERSON_PLACE_SEP}${placeNorm}`;
    let agg = aggs.get(aggKey);
    if (!agg) {
      agg = {
        personKey,
        birthYear,
        displayName: personDisplayName(record),
        placeLabel,
        recordsById: new Map(),
      };
      aggs.set(aggKey, agg);
    } else {
      agg.birthYear = Math.min(agg.birthYear, birthYear);
      if (placeLabel.length < agg.placeLabel.length) {
        agg.placeLabel = placeLabel;
      }
    }
    agg.recordsById.set(record.id, record);
  }

  const out: PodvigMapTimelineRow[] = [];
  for (const [mapEntryId, agg] of aggs) {
    out.push({
      mapEntryId,
      personKey: agg.personKey,
      birthYear: agg.birthYear,
      displayName: agg.displayName,
      placeLabel: agg.placeLabel,
      records: sortPodvigRecordsForPopup([...agg.recordsById.values()]),
    });
  }

  out.sort((a, b) => {
    const na = a.displayName.localeCompare(b.displayName, 'ru', { sensitivity: 'base' });
    if (na !== 0) return na;
    const pa = a.placeLabel.localeCompare(b.placeLabel, 'ru', { sensitivity: 'base' });
    if (pa !== 0) return pa;
    return b.birthYear - a.birthYear;
  });

  return mergePodvigRowsByLikelySamePlace(out, placeFallbacks, geoOptions);
}

export function getPodvigMapYearBounds(rows: PodvigMapTimelineRow[]): { min: number; max: number } {
  let min = Infinity;
  let max = -Infinity;
  for (const r of rows) {
    min = Math.min(min, r.birthYear);
    max = Math.max(max, r.birthYear);
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return { min: 1900, max: 2000 };
  }
  return { min, max };
}

function hueFromString(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return `hsl(${h % 360} 68% 42%)`;
}

function circlePxForPlaceCounts(countAtPlace: number, maxCount: number): number {
  const minPx = 14;
  const maxPx = 30;
  if (maxCount <= 1) return Math.round((minPx + maxPx) / 2);
  const t = (countAtPlace - 1) / (maxCount - 1);
  return Math.round(minPx + t * (maxPx - minPx));
}

function rowHasGeo(
  row: PodvigMapTimelineRow,
  placeFallbacks: Record<string, GeocodedPoint>,
  geoOptions?: IndexedEventGeoResolveOptions,
): boolean {
  return resolvePodvigGeoForLabel(row.placeLabel, placeFallbacks, geoOptions) != null;
}

const POPUP_LINKS_CAP = 28;

function buildPodvigPersonPopupHtml(
  row: PodvigMapTimelineRow,
  listName: string,
  placeDisplay: string,
  t: TranslationFn,
): string {
  const birthLine = escapeHtml(t('mapPodvigPopupBirthYear', { year: row.birthYear }));
  const placeHtml = `<div style="font-size:12px;margin-top:5px;opacity:.88;line-height:1.35">${escapeHtml(
    t('mapPodvigPopupDraftedAt', { place: placeDisplay }),
  )}</div>`;
  const slice = row.records.slice(0, POPUP_LINKS_CAP);
  const more = row.records.length - slice.length;
  const items = slice
    .map((rec) => {
      const url = buildPodvigNarodaRecordUrl(rec.id);
      const title = escapeHtml(podvigRecordSubtitle(rec));
      if (url) {
        return `<li style="margin:5px 0;line-height:1.35"><a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" style="font-size:13px;font-weight:500;text-decoration:underline">${title}</a></li>`;
      }
      return `<li style="margin:5px 0;line-height:1.35"><span style="font-size:13px;font-weight:500">${title}</span></li>`;
    })
    .join('');
  const moreHtml =
    more > 0
      ? `<div style="font-size:11px;opacity:.75;margin-top:6px">${escapeHtml(`+${more}`)}</div>`
      : '';
  const listBlock = `<ul style="list-style:none;margin:8px 0 0;padding:0;max-height:min(40vh,220px);overflow:auto">${items}</ul>`;
  return `<div style="min-width:220px;max-width:min(92vw,340px)"><div style="font-weight:600;margin-bottom:6px">${escapeHtml(listName)}</div><div style="font-size:12px;opacity:.9;line-height:1.35">${birthLine}</div>${placeHtml}${listBlock}${moreHtml}</div>`;
}

export function buildPodvigMapMarkers(
  rows: PodvigMapTimelineRow[],
  t: TranslationFn,
  locale: Locale,
  placeFallbacks: Record<string, GeocodedPoint>,
  geoOptions?: IndexedEventGeoResolveOptions,
): IndexedMapMarker[] {
  const countsByPlace = new Map<string, number>();
  for (const row of rows) {
    if (!rowHasGeo(row, placeFallbacks, geoOptions)) continue;
    countsByPlace.set(row.placeLabel, (countsByPlace.get(row.placeLabel) ?? 0) + 1);
  }
  let maxCount = 1;
  for (const n of countsByPlace.values()) {
    maxCount = Math.max(maxCount, n);
  }

  const out: IndexedMapMarker[] = [];
  rows.forEach((row, idx) => {
    const resolved = resolvePodvigGeoForLabel(row.placeLabel, placeFallbacks, geoOptions);
    if (!resolved) return;
    const atPlace = countsByPlace.get(row.placeLabel) ?? 1;
    const circlePx = circlePxForPlaceCounts(atPlace, maxCount);
    const color = hueFromString(`${row.mapEntryId}:${idx}`);
    const listName = formatNameByLocale(row.displayName, locale);
    const placeDisplay = formatPlaceLabelForLocale(row.placeLabel, locale);
    const popupHtml = buildPodvigPersonPopupHtml(row, listName, placeDisplay, t);

    out.push({
      id: `podvig-${row.mapEntryId}-${idx}`,
      hitId: row.mapEntryId,
      factType: PODVIG_NARODA_MAP_FACT_TYPE,
      year: row.birthYear,
      latLng: { lat: resolved.lat, lon: resolved.lon },
      circlePx,
      color,
      popupHtml,
      listName,
      recordUrl: null,
    });
  });

  return out;
}
