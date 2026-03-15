import { describe, it, expect, vi } from 'vitest';
import {
  formatLifeDates,
  getFullName,
  sortPersonsBySurname,
  personMatchesSearch,
} from './person';
import {
  getChildren,
  getCousins,
  getRoots,
  getSpouse,
  getSiblings,
} from '../data/familyRelations';
import { PERSONS_FIXTURE } from '../data/__fixtures__/persons';

vi.mock('@/lib/data/persons', () => ({
  getPersons: () => PERSONS_FIXTURE,
  getPersonById: (id: string) =>
    PERSONS_FIXTURE.find((p) => p.id === id) ?? null,
}));

describe('person utils', () => {
  describe('formatLifeDates', () => {
    it('formats birth and death when both present', () => {
      expect(formatLifeDates('1925', '1998')).toBe('1925 – 1998');
    });
    it('returns only birth when no death', () => {
      expect(formatLifeDates('1925', undefined)).toBe('1925');
    });
    it('returns only death when no birth', () => {
      expect(formatLifeDates(undefined, '1998')).toBe('1998');
    });
    it('returns empty when both empty', () => {
      expect(formatLifeDates(undefined, undefined)).toBe('');
    });
  });

  describe('getFullName', () => {
    it('formats as LastName FirstName Patronymic', () => {
      const p = PERSONS_FIXTURE.find((x) => x.id === 'p001')!;
      expect(getFullName(p)).toBe('Никонец Иван Петрович');
    });
    it('returns empty for null', () => {
      expect(getFullName(null)).toBe('');
    });
  });

  describe('getChildren', () => {
    it('returns children of p002', () => {
      const children = getChildren('p002');
      expect(children.length).toBeGreaterThanOrEqual(2);
      const ids = children.map((c) => c.id).sort();
      expect(ids).toContain('p001');
      expect(ids).toContain('p014');
    });

    it('returns empty for person with no children', () => {
      expect(getChildren('p001')).toEqual([]);
    });

    it('returns empty for unknown id', () => {
      expect(getChildren('unknown')).toEqual([]);
    });
  });

  describe('getSiblings', () => {
    it('returns empty for root person (no shared parents)', () => {
      expect(getSiblings('p002')).toEqual([]);
    });

    it('returns siblings when both share same parents', () => {
      const siblings = getSiblings('p001');
      expect(siblings.length).toBeGreaterThanOrEqual(1);
      const ids = siblings.map((s) => s.id);
      expect(ids).toContain('p014');
    });

    it('returns empty for unknown id', () => {
      expect(getSiblings('unknown')).toEqual([]);
    });
  });

  describe('getCousins', () => {
    it('returns cousins (children of parent siblings)', () => {
      const cousins = getCousins('p001');
      expect(cousins).toHaveLength(1);
      expect(cousins[0]!.id).toBe('p018');
    });

    it('returns empty for person with no parents', () => {
      expect(getCousins('p008')).toEqual([]);
    });

    it('returns empty for unknown id', () => {
      expect(getCousins('unknown')).toEqual([]);
    });
  });

  describe('getSpouse', () => {
    it('returns spouse as co-parent of first child', () => {
      const spouse = getSpouse('p002');
      expect(spouse).not.toBeNull();
      expect(spouse!.id).toBe('p003');
    });

    it('returns null for person with no children', () => {
      expect(getSpouse('p001')).toBeNull();
    });

    it('returns null for unknown id', () => {
      expect(getSpouse('unknown')).toBeNull();
    });
  });

  describe('getRoots', () => {
    it('returns persons with no parents', () => {
      const roots = getRoots();
      expect(roots.length).toBeGreaterThanOrEqual(2);
      expect(roots.every((p) => !p.fatherId && !p.motherId)).toBe(true);
    });
  });

  describe('sortPersonsBySurname', () => {
    it('sorts by last name then first name', () => {
      const list = [
        { id: 'a', firstName: 'B', lastName: 'Y' },
        { id: 'b', firstName: 'A', lastName: 'Z' },
        { id: 'c', firstName: 'X', lastName: 'Y' },
      ];
      const sorted = sortPersonsBySurname(list);
      expect(sorted.map((p) => p.lastName)).toEqual(['Y', 'Y', 'Z']);
      expect(sorted[0]!.firstName).toBe('B');
      expect(sorted[1]!.firstName).toBe('X');
    });
  });

  describe('personMatchesSearch', () => {
    const p = PERSONS_FIXTURE.find((x) => x.id === 'p001')!;
    it('returns true for empty query', () => {
      expect(personMatchesSearch(p, '')).toBe(true);
      expect(personMatchesSearch(p, '   ')).toBe(true);
    });
    it('matches full name', () => {
      expect(personMatchesSearch(p, 'Никонец')).toBe(true);
      expect(personMatchesSearch(p, 'Иван')).toBe(true);
    });
    it('matches partial and patronymic', () => {
      expect(personMatchesSearch(p, 'Петр')).toBe(true);
    });
    it('returns false when no match', () => {
      expect(personMatchesSearch(p, 'xyz')).toBe(false);
    });
  });
});
