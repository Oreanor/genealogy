import { describe, it, expect } from 'vitest';
import { getChildren, getCousins, getRoots, getSpouse, getSiblings } from './person';

describe('person utils', () => {
  describe('getChildren', () => {
    it('returns children of person-2', () => {
      const children = getChildren('person-2');
      expect(children).toHaveLength(2);
      const ids = children.map((c) => c.id).sort();
      expect(ids).toEqual(['person-1', 'person-14']);
    });

    it('returns empty for person with no children', () => {
      expect(getChildren('person-1')).toEqual([]);
    });

    it('returns empty for unknown id', () => {
      expect(getChildren('unknown')).toEqual([]);
    });
  });

  describe('getSiblings', () => {
    it('returns empty for root person (no shared parents)', () => {
      expect(getSiblings('person-2')).toEqual([]);
    });

    it('returns siblings when both share same parents', () => {
      const siblings = getSiblings('person-1');
      expect(siblings).toHaveLength(1);
      expect(siblings[0]!.id).toBe('person-14');
    });

    it('returns empty for unknown id', () => {
      expect(getSiblings('unknown')).toEqual([]);
    });
  });

  describe('getCousins', () => {
    it('returns cousins (children of parent siblings)', () => {
      const cousins = getCousins('person-1');
      expect(cousins).toHaveLength(1);
      expect(cousins[0]!.id).toBe('person-18');
    });

    it('returns empty for person with no parents', () => {
      expect(getCousins('person-8')).toEqual([]);
    });

    it('returns empty for unknown id', () => {
      expect(getCousins('unknown')).toEqual([]);
    });
  });

  describe('getSpouse', () => {
    it('returns spouse as co-parent of first child', () => {
      const spouse = getSpouse('person-2');
      expect(spouse).not.toBeNull();
      expect(spouse!.id).toBe('person-3');
    });

    it('returns null for person with no children', () => {
      expect(getSpouse('person-1')).toBeNull();
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
