import { describe, expect, it, vi } from 'vitest';
import type { Person } from '@/lib/types/person';
import type { GeocodedPoint } from '@/lib/constants/map';
import { buildMapEntries, buildPersonColorMap } from '@/lib/utils/mapSectionEntries';

vi.mock('@/lib/utils/person', () => ({
  formatNameByLocale: (value: string) => `loc:${value}`,
  formatPersonNameForLocale: (person: { id: string }) => `person:${person.id}`,
}));

function makePerson(overrides: Partial<Person>): Person {
  return {
    id: 'p1',
    firstName: 'Ivan',
    ...overrides,
  };
}

describe('mapSectionEntries', () => {
  it('builds stable color map for person ids', () => {
    const colorMap = buildPersonColorMap(['p1', 'p2']);
    expect(colorMap.get('p1')).toMatch(/^hsl\(/);
    expect(colorMap.get('p2')).toMatch(/^hsl\(/);
    expect(colorMap.get('p1')).not.toBe(colorMap.get('p2'));
  });

  it('builds markers, lines and filter entries from persons and place fallbacks', () => {
    const persons: Person[] = [
      makePerson({
        id: 'p1',
        birthPlace: 'Moscow',
        residenceCity: 'Paris, Berlin, Berlin',
      }),
      makePerson({
        id: 'p2',
        birthPlace: 'Moscow',
        residenceCity: '',
      }),
    ];
    const placeFallbacks: Record<string, GeocodedPoint> = {
      moscow: { lat: 55.75, lon: 37.61 },
      paris: { lat: 48.85, lon: 2.35 },
      berlin: { lat: 52.52, lon: 13.4 },
    };

    const result = buildMapEntries({
      persons,
      locale: 'en',
      t: (key) => key,
      placeFallbacks,
    });

    expect(result.personsOnMap.map((person) => person.id)).toEqual(['p1', 'p2']);
    expect(result.markerEntries).toHaveLength(4);
    expect(result.lineEntries).toHaveLength(2);
    expect(result.markerEntries[0]).toMatchObject({
      personId: 'p1',
      personName: 'person:p1',
      kindLabel: 'birthPlace',
      place: 'loc:Moscow',
    });

    const moscowMarkers = result.markerEntries.filter((entry) => entry.place === 'loc:Moscow');
    expect(moscowMarkers).toHaveLength(2);
    expect(moscowMarkers[0]?.offsetPoint).not.toEqual(moscowMarkers[1]?.offsetPoint);

    expect(result.lineEntries.map((line) => [line.from, line.to])).toHaveLength(2);
  });
});
