import { describe, it, expect } from 'vitest';
import {
  FAMILYSEARCH_PUBLIC_ORIGIN,
  INDEXED_EVENTS,
  buildIndexedMapMarkers,
  getIndexedEventYearBounds,
  indexedEventFactTypeLabel,
  indexedEventPrincipalMatchesSearch,
  resolveIndexedEventGeo,
  type IndexedEvent,
} from './indexedEventsMap';

const passthroughT = (key: string) => key;

const mockT = (key: string) => {
  if (key === 'mapArchiveFactBirth') return 'Birth fact';
  return key;
};

describe('indexedEventsMap', () => {
  it('exports FamilySearch origin', () => {
    expect(FAMILYSEARCH_PUBLIC_ORIGIN).toBe('https://www.familysearch.org');
  });

  it('indexedEventPrincipalMatchesSearch matches cyrillic, latin needle, and transliteration', () => {
    expect(indexedEventPrincipalMatchesSearch('Иван Петров', '')).toBe(true);
    expect(indexedEventPrincipalMatchesSearch('Иван Петров', 'иван')).toBe(true);
    expect(indexedEventPrincipalMatchesSearch('Иван', 'nomatch-xyz')).toBe(false);
    expect(indexedEventPrincipalMatchesSearch('Никон', 'nikon')).toBe(true);
  });

  it('getIndexedEventYearBounds returns ordered finite years', () => {
    const { min, max } = getIndexedEventYearBounds();
    expect(Number.isFinite(min)).toBe(true);
    expect(Number.isFinite(max)).toBe(true);
    expect(min).toBeLessThanOrEqual(max);
  });

  it('indexedEventFactTypeLabel maps known facts and falls back to raw type', () => {
    expect(indexedEventFactTypeLabel(mockT, 'Birth')).toBe('Birth fact');
    expect(indexedEventFactTypeLabel(passthroughT, 'CustomType')).toBe('CustomType');
  });

  it('buildIndexedMapMarkers builds markers for geo events', () => {
    const geo = INDEXED_EVENTS.filter((e) => Number.isFinite(e.lat) && Number.isFinite(e.lon)).slice(0, 2);
    expect(geo.length).toBeGreaterThan(0);
    const markers = buildIndexedMapMarkers(geo, passthroughT, 'en');
    expect(markers).toHaveLength(geo.length);
    expect(markers[0]!.popupHtml).toContain(FAMILYSEARCH_PUBLIC_ORIGIN);
    expect(markers[0]!.latLng.lat).toBeCloseTo(geo[0]!.lat as number, 5);
  });

  it('resolveIndexedEventGeo uses placeFallbacks when lat/lon missing', () => {
    const e: IndexedEvent = {
      hitId: 'X',
      recordUrl: '/ark:/61903/1:1:X',
      principalName: 'Test',
      factType: 'Birth',
      placeLabel: 'Сумы',
      placeKey: 'Sumy',
      year: 1900,
      dateOriginal: null,
    };
    const pt = resolveIndexedEventGeo(e, { sumy: { lat: 50.9, lon: 34.8 } });
    expect(pt?.lat).toBeCloseTo(50.9, 4);
    expect(pt?.lon).toBeCloseTo(34.8, 4);
  });

  it('buildIndexedMapMarkers uses placeFallbacks when provided', () => {
    const e: IndexedEvent = {
      hitId: 'X',
      recordUrl: '/ark:/61903/1:1:X',
      principalName: 'Test',
      factType: 'Birth',
      placeLabel: 'Сумы',
      placeKey: 'Sumy',
      year: 1900,
      dateOriginal: null,
    };
    const markers = buildIndexedMapMarkers([e], passthroughT, 'en', { sumy: { lat: 50.9, lon: 34.8 } });
    expect(markers).toHaveLength(1);
    expect(markers[0]!.latLng.lat).toBeCloseTo(50.9, 4);
  });

  it('resolveIndexedEventGeo matches compound segment via first token key (Donetsk Guberniya)', () => {
    const e: IndexedEvent = {
      hitId: 'X',
      recordUrl: '/ark:/61903/1:1:X',
      principalName: 'Test',
      factType: 'Birth',
      placeLabel: '',
      placeKey: 'Donetsk Guberniya, Ukraine, Soviet Union',
      year: 1920,
      dateOriginal: null,
    };
    const pt = resolveIndexedEventGeo(e, { donetsk: { lat: 48.02, lon: 37.8 } });
    expect(pt?.lat).toBeCloseTo(48.02, 4);
  });

  it('resolveIndexedEventGeo uses defaultWhenUnresolved when nothing matches', () => {
    const e: IndexedEvent = {
      hitId: 'X',
      recordUrl: '/ark:/61903/1:1:X',
      principalName: 'Test',
      factType: 'Birth',
      placeLabel: '',
      placeKey: '',
      year: 1900,
      dateOriginal: null,
    };
    const pt = resolveIndexedEventGeo(e, {}, { defaultWhenUnresolved: { lat: 1, lon: 2 } });
    expect(pt).toEqual({ lat: 1, lon: 2 });
  });
});
