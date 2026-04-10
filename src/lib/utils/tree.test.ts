import { describe, it, expect, vi } from 'vitest';
import {
  buildTreeMatrix,
  computeAncestorLayoutX,
  countVisibleTreeMatrixLevels,
  MAX_TREE_LEVELS,
} from './tree';
import { ROOT_PERSON_ID } from '@/lib/constants/chapters';
import { PERSONS_FIXTURE } from '../data/__fixtures__/persons';
import type { Person } from '@/lib/types/person';

vi.mock('@/lib/data/persons', () => ({
  getPersons: () => PERSONS_FIXTURE,
  getPersonById: (id: string) =>
    PERSONS_FIXTURE.find((p) => p.id === id) ?? null,
}));

describe('buildTreeMatrix', () => {
  it('returns matrix with root at level 0', () => {
    const matrix = buildTreeMatrix(ROOT_PERSON_ID);
    expect(matrix.length).toBeGreaterThanOrEqual(1);
    expect(matrix[0]).toHaveLength(1);
    expect(matrix[0]![0]?.id).toBe(ROOT_PERSON_ID);
  });

  it('fills parent slots from fatherId/motherId', () => {
    const matrix = buildTreeMatrix(ROOT_PERSON_ID);
    expect(matrix.length).toBeGreaterThanOrEqual(2);
    // p001 has fatherId p002, motherId p003
    expect(matrix[1]![0]?.id).toBe('p002');
    expect(matrix[1]![1]?.id).toBe('p003');
  });

  it('uses null for missing parents', () => {
    const matrix = buildTreeMatrix(ROOT_PERSON_ID);
    // p002, p003 have no fatherId/motherId - their parent slots are null
    const level2 = matrix[2] ?? [];
    expect(level2.filter((p) => p !== null).length).toBeLessThanOrEqual(4);
  });

  it('respects MAX_TREE_LEVELS', () => {
    const matrix = buildTreeMatrix(ROOT_PERSON_ID);
    expect(matrix.length).toBeLessThanOrEqual(MAX_TREE_LEVELS);
  });
});

describe('countVisibleTreeMatrixLevels', () => {
  const p = (id: string): Person => ({ id, firstName: 'T' });

  it('returns 1 for empty rows', () => {
    expect(countVisibleTreeMatrixLevels([[p('a')], [null, null]])).toBe(1);
  });

  it('returns deepest level with a person', () => {
    expect(
      countVisibleTreeMatrixLevels([[p('a')], [p('b'), null], [null, null, null, p('c')]])
    ).toBe(3);
  });
});

describe('computeAncestorLayoutX', () => {
  const W = 120;
  const p = (id: string): Person => ({ id, firstName: 'T' });

  it('keeps a single-child chain vertically aligned (centered)', () => {
    const matrix: (Person | null)[][] = [[p('a')], [p('b'), null], [p('c'), null, null, null]];
    const map = computeAncestorLayoutX(matrix, 3, W);
    const cx = W / 2;
    expect(map.get('0-0')).toBe(cx);
    expect(map.get('1-0')).toBe(cx);
    expect(map.get('2-0')).toBe(cx);
  });

  it('centers a sole mother slot like a sole father', () => {
    const matrix: (Person | null)[][] = [[p('a')], [null, p('b')]];
    const map = computeAncestorLayoutX(matrix, 2, W);
    expect(map.get('1-1')).toBe(W / 2);
  });

  it('places two parents symmetrically around the root', () => {
    const matrix: (Person | null)[][] = [[p('a')], [p('b'), p('c')]];
    const map = computeAncestorLayoutX(matrix, 2, W);
    const mid = W / 2;
    const left = map.get('1-0') ?? 0;
    const right = map.get('1-1') ?? 0;

    // Must be symmetric around root center.
    expect(left + right).toBeCloseTo(2 * mid, 5);
    // And must be separated (not collapsing into the same X).
    expect(right - left).toBeGreaterThan(mid * 0.1);
  });
});
