import { describe, expect, it } from 'vitest';
import type { PodvigNarodaRecord } from '@/lib/types/podvigNaroda';
import {
  buildPodvigMapMarkers,
  buildPodvigNarodaRecordUrl,
  buildPodvigTimelineRows,
  getPodvigMapYearBounds,
  parsePodvigBirthYear,
  PODVIG_NARODA_MAP_FACT_TYPE,
  podvigGeoPlaceLabel,
  normalizePodvigPlaceForMerge,
  type PodvigMapTimelineRow,
} from '@/lib/data/podvigNarodaMap';

const defaultPt = { lat: 50.9, lon: 34.8 };

function awardRecord(overrides: {
  id: string;
  person?: Partial<PodvigNarodaRecord['person']>;
  award?: Partial<NonNullable<Extract<PodvigNarodaRecord, { recordType: 'award' }>['award']>>;
}): PodvigNarodaRecord {
  return {
    id: overrides.id,
    recordType: 'award',
    person: {
      lastName: 'Иванов',
      firstName: 'Иван',
      patronymic: '',
      birthDateRaw: '01.01.1921',
      ...overrides.person,
    },
    award: {
      draftOffice: 'г. Сумы',
      registry: {},
      ...overrides.award,
    },
    source: { entityLabelRu: 'Награда', api: {} },
  };
}

describe('podvigNarodaMap', () => {
  it('parsePodvigBirthYear extracts 4-digit year', () => {
    expect(parsePodvigBirthYear('01.01.1914')).toBe(1914);
    expect(parsePodvigBirthYear('__.__.1920')).toBe(1920);
    expect(parsePodvigBirthYear('born 2001 here')).toBe(2001);
    expect(parsePodvigBirthYear('')).toBeNull();
    expect(parsePodvigBirthYear(undefined)).toBeNull();
  });

  it('getPodvigMapYearBounds returns defaults for empty rows', () => {
    expect(getPodvigMapYearBounds([])).toEqual({ min: 1900, max: 2000 });
  });

  it('getPodvigMapYearBounds uses row birth years', () => {
    const rows: PodvigMapTimelineRow[] = [
      { birthYear: 1910 } as PodvigMapTimelineRow,
      { birthYear: 1955 } as PodvigMapTimelineRow,
    ];
    expect(getPodvigMapYearBounds(rows)).toEqual({ min: 1910, max: 1955 });
  });

  it('podvigGeoPlaceLabel prefers draft office on awards', () => {
    const r = awardRecord({ id: 'a1', award: { draftOffice: 'г. Харьков|обл.', registry: {} } });
    expect(podvigGeoPlaceLabel(r)).toBe('г. Харьков');
  });

  it('normalizePodvigPlaceForMerge ignores punctuation order and «г.»', () => {
    const a = normalizePodvigPlaceForMerge('г. Харьков, Харьковская обл.');
    const b = normalizePodvigPlaceForMerge('Харьковская область, г Харьков');
    expect(a).toBe(b);
  });

  it('buildPodvigTimelineRows merges same person at same draft place', () => {
    const records: PodvigNarodaRecord[] = [
      awardRecord({
        id: 'r1',
        person: { lastName: 'A', firstName: '', patronymic: '', birthDateRaw: '1922' },
        award: { title: 'Медаль А', draftOffice: 'г. Сумы', registry: {} },
      }),
      awardRecord({
        id: 'r2',
        person: { lastName: 'A', firstName: '', patronymic: '', birthDateRaw: '1922' },
        award: { title: 'Медаль Б', draftOffice: 'г. Сумы', registry: {} },
      }),
      awardRecord({
        id: 'no-year',
        person: { lastName: 'B', firstName: '', patronymic: '', birthDateRaw: '' },
      }),
    ];
    const rows = buildPodvigTimelineRows(records, {}, { defaultWhenUnresolved: defaultPt });
    expect(rows).toHaveLength(1);
    expect(rows[0]!.birthYear).toBe(1922);
    expect(rows[0]!.records.map((r) => r.id).sort()).toEqual(['r1', 'r2']);
  });

  it('buildPodvigTimelineRows merges two spellings of one RVK after normalization', () => {
    const records: PodvigNarodaRecord[] = [
      awardRecord({
        id: 'a',
        person: { lastName: 'Б', firstName: '', patronymic: '', birthDateRaw: '1910' },
        award: { title: 'М1', draftOffice: 'г. Харьков, Харьковская обл.', registry: {} },
      }),
      awardRecord({
        id: 'b',
        person: { lastName: 'Б', firstName: '', patronymic: '', birthDateRaw: '1910' },
        award: { title: 'М2', draftOffice: 'Харьковская область, г Харьков', registry: {} },
      }),
    ];
    const rows = buildPodvigTimelineRows(records, {}, { defaultWhenUnresolved: defaultPt });
    expect(rows).toHaveLength(1);
    expect(rows[0]!.records.map((r) => r.id).sort()).toEqual(['a', 'b']);
  });

  it('buildPodvigNarodaRecordUrl points to official site', () => {
    expect(buildPodvigNarodaRecordUrl('10324212')).toBe('https://www.podvignaroda.ru/?#id=10324212');
    expect(buildPodvigNarodaRecordUrl('')).toBeNull();
  });

  it('buildPodvigMapMarkers uses mapEntryId and podvig_person; popup links records', () => {
    const rows = buildPodvigTimelineRows(
      [
        awardRecord({
          id: 'x1',
          person: { lastName: 'Петров', firstName: '', patronymic: '', birthDateRaw: '1930' },
          award: { title: 'Орден X', draftOffice: 'г. Сумы', registry: {} },
        }),
      ],
      {},
      { defaultWhenUnresolved: defaultPt },
    );
    const t = (key: string, params?: Record<string, string | number>) => {
      if (key === 'mapPodvigPopupBirthYear' && params?.year != null) return `Год рождения: ${params.year}`;
      if (key === 'mapPodvigPopupDraftedAt' && params?.place != null) return `Призван в: ${params.place}`;
      return key;
    };
    const markers = buildPodvigMapMarkers(rows, t, 'ru', {}, { defaultWhenUnresolved: defaultPt });
    expect(markers).toHaveLength(1);
    expect(markers[0]!.hitId).toBe(rows[0]!.mapEntryId);
    expect(markers[0]!.factType).toBe(PODVIG_NARODA_MAP_FACT_TYPE);
    expect(markers[0]!.year).toBe(1930);
    expect(markers[0]!.latLng).toEqual(defaultPt);
    expect(markers[0]!.popupHtml).toContain('https://www.podvignaroda.ru/?#id=x1');
    expect(markers[0]!.popupHtml).toContain('Орден X');
  });
});
