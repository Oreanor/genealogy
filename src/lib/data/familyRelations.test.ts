import { describe, it, expect, vi } from 'vitest';
import {
  getChildren,
  getSpouse,
  getSiblings,
  getCousins,
  getSecondCousins,
  getRoots,
} from './familyRelations';
import { PERSONS_FIXTURE } from './__fixtures__/persons';

vi.mock('./persons', () => ({
  getPersons: () => PERSONS_FIXTURE,
  getPersonById: (id: string) => PERSONS_FIXTURE.find((p) => p.id === id) ?? null,
}));

describe('familyRelations', () => {
  describe('getChildren', () => {
    it('returns children of p002', () => {
      const children = getChildren('p002');
      const ids = children.map((c) => c.id).sort();
      expect(ids).toContain('p001');
      expect(ids).toContain('p014');
      expect(ids).toContain('p016');
    });

    it('returns empty for person with no children', () => {
      expect(getChildren('p001')).toEqual([]);
    });

    it('returns empty for unknown id', () => {
      expect(getChildren('unknown')).toEqual([]);
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

  describe('getSiblings', () => {
    it('returns siblings when both share same parents', () => {
      const siblings = getSiblings('p001');
      const ids = siblings.map((s) => s.id);
      expect(ids).toContain('p014');
      expect(ids).toContain('p016');
    });

    it('returns empty for root person', () => {
      expect(getSiblings('p008')).toEqual([]);
    });

    it('returns empty for unknown id', () => {
      expect(getSiblings('unknown')).toEqual([]);
    });
  });

  describe('getCousins', () => {
    it('returns cousins (children of parent siblings)', () => {
      const cousins = getCousins('p001');
      expect(cousins.some((c) => c.id === 'p018')).toBe(true);
    });

    it('returns empty for person with no parents', () => {
      expect(getCousins('p008')).toEqual([]);
    });

    it('returns empty for unknown id', () => {
      expect(getCousins('unknown')).toEqual([]);
    });
  });

  describe('getSecondCousins', () => {
    it('returns empty for person with no parents', () => {
      expect(getSecondCousins('p008')).toEqual([]);
    });

    it('returns empty for unknown id', () => {
      expect(getSecondCousins('unknown')).toEqual([]);
    });

    it('returns array (may be empty) for person with parents', () => {
      const result = getSecondCousins('p001');
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getRoots', () => {
    it('returns persons with no father and no mother', () => {
      const roots = getRoots();
      expect(roots.length).toBeGreaterThan(0);
      roots.forEach((p) => {
        expect(p.fatherId).toBeFalsy();
        expect(p.motherId).toBeFalsy();
      });
    });

    it('includes p008 and p009 as roots in fixture', () => {
      const roots = getRoots();
      const ids = roots.map((r) => r.id);
      expect(ids).toContain('p008');
      expect(ids).toContain('p009');
    });
  });
});
