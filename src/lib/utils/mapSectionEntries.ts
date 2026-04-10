import { MARKER_GROUPING, type GeocodedPoint } from '@/lib/constants/map';
import type { Locale } from '@/lib/i18n/config';
import type { TranslationFn } from '@/lib/i18n/types';
import type { Person } from '@/lib/types/person';
import {
  normalizePlace,
  splitPlaceList,
  toPlaceFallbackKey,
} from '@/lib/utils/mapPlace';
import { formatNameByLocale, formatPersonNameForLocale } from '@/lib/utils/person';

export type MarkerEntry = {
  personId: string;
  personName: string;
  kindLabel: string;
  place: string;
  offsetPoint: { lat: number; lon: number };
  color: string;
};

export type LineEntry = {
  personId: string;
  personName: string;
  from: { lat: number; lon: number };
  to: { lat: number; lon: number };
  color: string;
};

type PersonOnMap = {
  id: string;
  name: string;
  color: string;
};

export function buildPersonColorMap(personIds: string[]): Map<string, string> {
  const GOLDEN_ANGLE = 137.508;
  const map = new Map<string, string>();
  personIds.forEach((id, i) => {
    const hue = Math.round((i * GOLDEN_ANGLE) % 360);
    map.set(id, `hsl(${hue} 72% 40%)`);
  });
  return map;
}

export function buildMapEntries({
  persons,
  locale,
  t,
  placeFallbacks,
}: {
  persons: Person[];
  locale: Locale;
  t: TranslationFn;
  placeFallbacks: Record<string, GeocodedPoint>;
}) {
  const personColorMap = buildPersonColorMap(persons.map((p) => p.id));
  const placeCache = new Map<string, GeocodedPoint | null>();
  const placeQueue = new Set<string>();

  for (const person of persons) {
    const birth = normalizePlace(person.birthPlace ?? '');
    if (birth) placeQueue.add(birth);
    for (const residence of splitPlaceList(person.residenceCity)) placeQueue.add(residence);
  }

  for (const place of placeQueue) {
    const normalized = normalizePlace(place);
    const point = placeFallbacks[toPlaceFallbackKey(normalized)] ?? null;
    placeCache.set(place, point);
  }

  const markerEntries: MarkerEntry[] = [];
  const lineEntries: LineEntry[] = [];
  const byCoord = new Map<string, number>();
  const personPlaceOffset = new Map<string, { lat: number; lon: number }>();
  const personsWithMapData = new Set<string>();

  for (const person of persons) {
    const personName = formatPersonNameForLocale(person, locale) || person.id;
    const color = personColorMap.get(person.id) ?? 'hsl(0 70% 40%)';
    const birth = normalizePlace(person.birthPlace ?? '');
    const residences = splitPlaceList(person.residenceCity).filter((r) => r !== birth);
    const rawChain = birth ? [birth, ...residences] : [...residences];
    const chain: string[] = [];

    for (const city of rawChain) {
      if (chain.length === 0 || chain[chain.length - 1] !== city) chain.push(city);
    }

    const seenForPerson = new Set<string>();
    for (const place of chain) {
      if (seenForPerson.has(place)) continue;
      seenForPerson.add(place);

      const point = placeCache.get(place);
      if (!point) continue;

      const coordKey = `${point.lat.toFixed(MARKER_GROUPING.coordPrecision)},${point.lon.toFixed(MARKER_GROUPING.coordPrecision)}`;
      const offsetIdx = byCoord.get(coordKey) ?? 0;
      byCoord.set(coordKey, offsetIdx + 1);
      const dx = (offsetIdx % MARKER_GROUPING.columnsPerRow) * MARKER_GROUPING.lonStep;
      const dy =
        Math.floor(offsetIdx / MARKER_GROUPING.columnsPerRow) * MARKER_GROUPING.latStep;
      const offsetPoint = { lat: point.lat + dy, lon: point.lon + dx };

      personPlaceOffset.set(`${person.id}|${place}`, offsetPoint);
      personsWithMapData.add(person.id);
      markerEntries.push({
        personId: person.id,
        personName,
        kindLabel: place === birth ? t('birthPlace') : t('residenceCity'),
        place: formatNameByLocale(place, locale),
        offsetPoint,
        color,
      });
    }

    for (let i = 0; i < chain.length - 1; i += 1) {
      const fromPlace = chain[i]!;
      const toPlace = chain[i + 1]!;
      if (fromPlace === toPlace) continue;
      const fromPoint = personPlaceOffset.get(`${person.id}|${fromPlace}`);
      const toPoint = personPlaceOffset.get(`${person.id}|${toPlace}`);
      if (!fromPoint || !toPoint) continue;
      personsWithMapData.add(person.id);
      lineEntries.push({
        personId: person.id,
        personName,
        from: fromPoint,
        to: toPoint,
        color,
      });
    }
  }

  const personsOnMap: PersonOnMap[] = persons
    .filter((person) => personsWithMapData.has(person.id))
    .map((person) => ({
      id: person.id,
      name: formatPersonNameForLocale(person, locale) || person.id,
      color: personColorMap.get(person.id) ?? 'hsl(0 70% 40%)',
    }));

  return {
    markerEntries,
    lineEntries,
    personsOnMap,
  };
}
