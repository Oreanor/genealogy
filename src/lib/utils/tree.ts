import { getPersonById } from '@/lib/data/persons';
import type { Person } from '@/lib/types/person';
import { getChildren } from '@/lib/data/familyRelations';

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

export interface DescendantsTreeData {
  matrix: (Person | null)[][];
  parentKeyByChildKey: Record<string, string>;
}

/**
 * Descendants tree matrix built level-by-level using real children links.
 * Slots remain a fixed binary-like layout, but when children exceed capacity,
 * extra children are truncated; `parentKeyByChildKey` keeps correct parent->child
 * mapping for line drawing.
 */
export function buildDescendantsMatrix(rootPersonId: string): DescendantsTreeData {
  const matrix: (Person | null)[][] = [];
  const parentKeyByChildKey: Record<string, string> = {};
  // Safety cap: don't let huge-family branches explode the layout.
  const MAX_DESCENDANT_SLOTS = 12;

  for (let level = 0; level < MAX_TREE_LEVELS; level++) {
    const row: (Person | null)[] = [];

    if (level === 0) {
      row.push(getPersonById(rootPersonId));
      matrix.push(row);
      continue;
    }

    const prevRow = matrix[level - 1] ?? [];
    const binCount = Math.pow(2, level);
    let totalChildren = 0;
    const parentsChildren: Array<{ parentIndex: number; children: Person[] }> = [];

    for (let parentIndex = 0; parentIndex < prevRow.length; parentIndex += 1) {
      const parent = prevRow[parentIndex];
      if (!parent) continue;
      const children = getChildren(parent.id)
        .slice()
        .sort((a, b) => a.id.localeCompare(b.id));
      parentsChildren.push({ parentIndex, children });
      totalChildren += children.length;
    }

    const slotCount = Math.min(MAX_DESCENDANT_SLOTS, Math.max(binCount, totalChildren));
    const nextRow: (Person | null)[] = Array.from({ length: slotCount }, () => null);
    let nextIndex = 0;

    for (const { parentIndex, children } of parentsChildren) {
      if (nextIndex >= slotCount) break;
      const parentSlotKey = `${level - 1}-${parentIndex}`;

      for (const child of children) {
        if (nextIndex >= slotCount) break;
        const childSlotKey = `${level}-${nextIndex}`;
        nextRow[nextIndex] = child;
        parentKeyByChildKey[childSlotKey] = parentSlotKey;
        nextIndex += 1;
      }
    }

    matrix.push(nextRow);

    // Level 4 (great-great-great-grandparents): add deeper levels only if any person exists
    if (level === 4) {
      if (!nextRow.some((p) => p !== null)) break;
    }

    // Stop early if there are no children at this level.
    if (nextIndex === 0) break;
  }

  while (matrix.length < MIN_TREE_LEVELS) {
    // For descendants mode we use empty rows (no placeholders) unless deeper
    // levels are built. This keeps layout stable without exploding width.
    matrix.push([]);
  }

  return { matrix, parentKeyByChildKey };
}
