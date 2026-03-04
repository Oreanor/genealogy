import { getPersonById } from '@/lib/data/persons';
import type { Person } from '@/lib/types/person';

export const MAX_TREE_LEVELS = 6; // я, родители, деды, прадеды, прапрадеды, прапрапрадеды

/** Строит матрицу древа: tree[level][index] = Person | null. Прапрапра (level 5) — только если есть хоть один человек. */
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
        const personId = parentSlot?.parentIds[parentIndex];
        row.push(personId ? getPersonById(personId) ?? null : null);
      }
    }
    matrix.push(row);

    // Прапрапра (level 5): добавляем ряд только если есть хотя бы один человек
    if (level === 4) {
      const nextRow: (Person | null)[] = [];
      const parentRow = matrix[4]!;
      for (let i = 0; i < 32; i++) {
        const parentSlot = parentRow[i >> 1];
        const parentIndex = i % 2;
        const personId = parentSlot?.parentIds[parentIndex];
        nextRow.push(personId ? getPersonById(personId) ?? null : null);
      }
      if (!nextRow.some((p) => p !== null)) break;
      matrix.push(nextRow);
    }
  }

  return matrix;
}
