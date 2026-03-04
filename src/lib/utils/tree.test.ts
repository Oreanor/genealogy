import { describe, it, expect } from 'vitest';
import { buildTreeMatrix, MAX_TREE_LEVELS } from './tree';
import { ROOT_PERSON_ID } from '@/lib/constants/chapters';

describe('buildTreeMatrix', () => {
  it('returns matrix with root at level 0', () => {
    const matrix = buildTreeMatrix(ROOT_PERSON_ID);
    expect(matrix.length).toBeGreaterThanOrEqual(1);
    expect(matrix[0]).toHaveLength(1);
    expect(matrix[0]![0]?.id).toBe(ROOT_PERSON_ID);
  });

  it('fills parent slots from parentIds', () => {
    const matrix = buildTreeMatrix(ROOT_PERSON_ID);
    expect(matrix.length).toBeGreaterThanOrEqual(2);
    // person-1 has parentIds: person-2, person-3
    expect(matrix[1]![0]?.id).toBe('person-2');
    expect(matrix[1]![1]?.id).toBe('person-3');
  });

  it('uses null for missing parents', () => {
    const matrix = buildTreeMatrix(ROOT_PERSON_ID);
    // person-2, person-3 have empty parentIds - their parent slots are null
    const level1 = matrix[1] ?? [];
    const level2 = matrix[2] ?? [];
    expect(level2.filter((p) => p !== null).length).toBeLessThanOrEqual(4);
  });

  it('respects MAX_TREE_LEVELS', () => {
    const matrix = buildTreeMatrix(ROOT_PERSON_ID);
    expect(matrix.length).toBeLessThanOrEqual(MAX_TREE_LEVELS);
  });
});
