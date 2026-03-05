import { describe, it, expect, vi } from 'vitest';
import { getChildren, getCousins, getFullName, getRoots, getSpouse, getSiblings } from './person';
import { PERSONS_FIXTURE } from '../data/__fixtures__/persons';

vi.mock('@/lib/data/persons', () => ({
  getPersons: () => PERSONS_FIXTURE,
  getPersonById: (id: string) =>
    PERSONS_FIXTURE.find((p) => p.id === id) ?? null,
}));

describe('person utils', () => {
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
      expect(children).toHaveLength(2);
      const ids = children.map((c) => c.id).sort();
      expect(ids).toEqual(['p001', 'p014']);
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
      expect(siblings).toHaveLength(1);
      expect(siblings[0]!.id).toBe('p014');
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
      expect(roots.every((p) => p.parentIds.length === 0)).toBe(true);
    });
  });
});
