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

/**
 * Horizontal positions (same unit as `viewWidth`, e.g. FamilyTree VIEW_WIDTH) for ancestor mode.
 * Single child under a parent is centered on the parent's X; two siblings (father/mother) are
 * placed symmetrically around the parent so a straight patriline/matriline stays vertical.
 */
export function computeAncestorLayoutX(
  matrix: (Person | null)[][],
  visibleLevelCount: number,
  viewWidth: number
): Map<string, number> {
  const memo = new Map<string, number>();
  // Keep nodes inside the canvas when some slots are missing.
  // This prevents right/left branches from getting cut off.
  const INNER_MARGIN_PX = viewWidth * 0.05;
  const innerWidth = Math.max(1, viewWidth - 2 * INNER_MARGIN_PX);

  function fallbackX(level: number, index: number): number {
    const count = Math.pow(2, level);
    return INNER_MARGIN_PX + ((2 * index + 1) / (2 * count)) * innerWidth;
  }

  function xFor(level: number, index: number): number {
    const key = `${level}-${index}`;
    if (memo.has(key)) return memo.get(key)!;

    const person = matrix[level]?.[index];
    if (!person) {
      const fb = fallbackX(level, index);
      memo.set(key, fb);
      return fb;
    }

    if (level === 0) {
      memo.set(key, viewWidth / 2);
      return viewWidth / 2;
    }

    const p = index >> 1;
    const parentPerson = matrix[level - 1]?.[p];
    if (!parentPerson) {
      const fb = fallbackX(level, index);
      memo.set(key, fb);
      return fb;
    }

    const xp = xFor(level - 1, p);
    const row = matrix[level]!;
    const li = 2 * p;
    const ri = li + 1;
    const hasL = !!row[li];
    const hasR = !!row[ri];

    let x: number;
    if (hasL && hasR) {
      // Compress spacing between different "parent groups" (p),
      // but keep father/mother within the group a bit more separated.
      const prevCount = Math.pow(2, level - 1);
      const centerStep = innerWidth / Math.max(1, prevCount);
      const sepDesired = centerStep * 0.58; // denser layout while keeping spouses separated

      // Additional cap so the pair doesn't overlap neighboring groups.
      const sepCap = centerStep * 0.82;
      const sep = Math.min(sepDesired, sepCap, viewWidth / Math.max(0.50, level * 0.72));

      x = index === li ? xp - sep / 2 : xp + sep / 2;
    } else {
      x = xp;
    }

    memo.set(key, x);
    return x;
  }

  for (let level = 0; level < visibleLevelCount; level++) {
    const row = matrix[level];
    if (!row) continue;
    for (let i = 0; i < row.length; i++) {
      if (row[i]) xFor(level, i);
    }
  }

  return memo;
}

export interface DescendantsTreeData {
  matrix: (Person | null)[][];
  parentKeyByChildKey: Record<string, string>;
}

/**
 * Horizontal positions for descendants mode.
 * - 1 child: place directly under parent (vertical line).
 * - 2+ children: place symmetrically around parent (fan).
 */
export function computeDescendantLayoutX(
  matrix: (Person | null)[][],
  parentKeyByChildKey: Record<string, string>,
  visibleLevelCount: number,
  viewWidth: number
): Map<string, number> {
  const xByKey = new Map<string, number>();
  const childrenByParent = new Map<string, string[]>();

  for (let level = 1; level < visibleLevelCount; level += 1) {
    const row = matrix[level] ?? [];
    for (let index = 0; index < row.length; index += 1) {
      if (!row[index]) continue;
      const childKey = `${level}-${index}`;
      const parentKey = parentKeyByChildKey[childKey];
      if (!parentKey) continue;
      const arr = childrenByParent.get(parentKey) ?? [];
      arr.push(childKey);
      childrenByParent.set(parentKey, arr);
    }
  }

  for (const arr of childrenByParent.values()) {
    arr.sort((a, b) => {
      const ai = Number.parseInt(a.split('-')[1] ?? '0', 10);
      const bi = Number.parseInt(b.split('-')[1] ?? '0', 10);
      return ai - bi;
    });
  }

  // Fixed grid unit: equal spacing, no per-level "nudging".
  const unitGapPx = viewWidth * 0.2;
  let nextLeaf = 0;

  const place = (key: string): number => {
    const kids = childrenByParent.get(key) ?? [];
    if (kids.length === 0) {
      const x = nextLeaf;
      nextLeaf += 1;
      xByKey.set(key, x);
      return x;
    }
    const childXs = kids.map((k) => place(k));
    const x = (childXs[0]! + childXs[childXs.length - 1]!) / 2;
    xByKey.set(key, x);
    return x;
  };

  place('0-0');

  const rootXUnits = xByKey.get('0-0') ?? 0;
  const rootXPx = viewWidth / 2;
  const out = new Map<string, number>();
  for (const [key, units] of xByKey.entries()) {
    out.set(key, rootXPx + (units - rootXUnits) * unitGapPx);
  }
  return out;
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
