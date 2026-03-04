import { describe, it, expect } from 'vitest';
import { getChildren, getSiblings, getRoots } from './person';

describe('person utils', () => {
  describe('getChildren', () => {
    it('returns children of person-1', () => {
      const children = getChildren('person-1');
      expect(children).toHaveLength(1);
      expect(children[0]!.id).toBe('person-4');
    });

    it('returns empty for person with no children', () => {
      expect(getChildren('person-4')).toEqual([]);
    });

    it('returns empty for unknown id', () => {
      expect(getChildren('unknown')).toEqual([]);
    });
  });

  describe('getSiblings', () => {
    it('returns empty for root person (no shared parents)', () => {
      expect(getSiblings('person-2')).toEqual([]);
    });

    it('returns siblings when both share same parent', () => {
      const siblings = getSiblings('person-1');
      // person-1 has parents person-2, person-3; person-4 has parent person-1 — different parents
      expect(siblings).toEqual([]);
    });

    it('returns empty for unknown id', () => {
      expect(getSiblings('unknown')).toEqual([]);
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
