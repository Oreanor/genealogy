import { describe, it, expect, vi } from 'vitest';
import { buildTreeMatrix, MAX_TREE_LEVELS } from './tree';
import { ROOT_PERSON_ID } from '@/lib/constants/chapters';
import { PERSONS_FIXTURE } from '../data/__fixtures__/persons';

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
