import { describe, it, expect } from 'vitest';
import type { Person } from '@/lib/types/person';
import { buildPersonSummary } from './personSummary';

const t = (key: string, params?: Record<string, string | number>) => {
  const payload = params ? JSON.stringify(params) : '';
  return `${key}${payload}`;
};

describe('buildPersonSummary', () => {
  it('builds known dates and optional clauses', () => {
    const person: Person = {
      id: 'p1',
      firstName: 'Иван',
      birthDate: '1920',
      deathDate: '1990',
      birthPlace: 'Брянск',
      occupation: 'учитель',
      residenceCity: 'Елец',
    };

    const lines = buildPersonSummary(person, t);
    expect(lines.length).toBe(3);
    expect(lines[0]).toContain('personSummary_datesKnown_');
    expect(lines[1]).toContain('personSummary_birthPlace_');
    expect(lines[2]).toContain('personSummary_workAndCity_');
  });

  it('returns unknown dates when both absent', () => {
    const person: Person = { id: 'p2', firstName: 'Петр' };
    const lines = buildPersonSummary(person, t);
    expect(lines[0]).toContain('personSummary_datesUnknown_');
  });

  it('builds mixed precision dates when one side is year-only', () => {
    const person: Person = {
      id: 'p3',
      firstName: 'Анна',
      gender: 'f',
      birthDate: '1949',
      deathDate: '26.12.2020',
    };
    const lines = buildPersonSummary(person, t);
    expect(lines[0]).toContain('personSummary_datesMixed_');
    expect(lines[0]).toContain('personSummary_birthYearFragment');
    expect(lines[0]).toContain('personSummary_deathExactFragment');
  });

  it('uses multi-city template and normalizes city list', () => {
    const person: Person = {
      id: 'p4',
      firstName: 'Анна',
      gender: 'f',
      residenceCity: 'г. Сумы, Краснодар, с. Сумы, Budapest, budapest',
    };
    const lines = buildPersonSummary(person, t);
    expect(lines.some((line) => line.includes('personSummary_cityOnlyMany_'))).toBe(true);
    const cityLine = lines.find((line) => line.includes('personSummary_cityOnlyMany_')) ?? '';
    expect(cityLine).toContain('г. Сумы, Краснодар, Budapest');
    expect(cityLine).toContain('"subjectPronoun":"она"');
  });
});
