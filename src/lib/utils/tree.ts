import { getPersonById } from '@/lib/data/persons';
import type { Person } from '@/lib/types/person';

export const MAX_TREE_LEVELS = 6; // self, parents, grandparents, great-grandparents, etc.
/** Minimum levels: always draw slots up to great-grandparents (levels 0..3). */
export const MIN_TREE_LEVELS = 4;

/** Builds tree matrix: tree[level][index] = Person | null. At least MIN_TREE_LEVELS levels. Level 5 (great-great-great-grandparents) only if at least one person exists. */
export function buildTreeMatrix(rootPersonId: string): (Person | null)[][] {
  const matrix: (Person | null)[][] = [];

  for (let level = 0; level < MAX_TREE_LEVELS; level++) {
    const count = Math.pow(2, level);
    const row: (Person | null)[] = [];

    for (let i = 0; i < count; i++) {
      if (level === 0) {
        row.push(getPersonById(rootPersonId));
      } else {
        const parentSlot = matrix[level - 1]![i >> 1];
        const parentIndex = i % 2;
        const personId = parentIndex === 0 ? parentSlot?.fatherId : parentSlot?.motherId;
        row.push(personId ? getPersonById(personId) ?? null : null);
      }
    }
    matrix.push(row);

    // Level 5 (great-great-great-grandparents): add row only if at least one person exists
    if (level === 4) {
      const nextRow: (Person | null)[] = [];
      const parentRow = matrix[4]!;
      for (let i = 0; i < 32; i++) {
        const parentSlot = parentRow[i >> 1];
        const parentIndex = i % 2;
        const personId = parentIndex === 0 ? parentSlot?.fatherId : parentSlot?.motherId;
        nextRow.push(personId ? getPersonById(personId) ?? null : null);
      }
      if (!nextRow.some((p) => p !== null)) break;
      matrix.push(nextRow);
    }
  }

  // Ensure at least 4 levels (self, parents, grandparents, great-grandparents); empty slots are null
  while (matrix.length < MIN_TREE_LEVELS) {
    const level = matrix.length;
    const count = Math.pow(2, level);
    matrix.push(Array.from({ length: count }, () => null));
  }
  return matrix;
}
