import type { Person } from '@/lib/types/person';
import { getPersonById, getPersons } from './persons';

export function getChildren(personId: string): Person[] {
  return getPersons().filter((p) => p.fatherId === personId || p.motherId === personId);
}

/** Spouse: the other parent of a shared child (derived from tree). */
export function getSpouse(personId: string): Person | null {
  const children = getChildren(personId);
  if (children.length === 0) return null;
  const c = children[0]!;
  const otherParentId = c.fatherId === personId ? c.motherId : c.fatherId;
  if (!otherParentId) return null;
  return getPersonById(otherParentId) ?? null;
}

export function getSiblings(personId: string): Person[] {
  const person = getPersons().find((p) => p.id === personId);
  if (!person || (person.fatherId == null && person.motherId == null)) return [];
  return getPersons().filter(
    (p) =>
      p.id !== personId &&
      p.fatherId === person.fatherId &&
      p.motherId === person.motherId
  );
}

/** Cousins: children of parents' siblings */
export function getCousins(personId: string): Person[] {
  const person = getPersons().find((p) => p.id === personId);
  if (!person || (person.fatherId == null && person.motherId == null)) return [];
  const siblingIds = new Set(getSiblings(personId).map((s) => s.id));
  siblingIds.add(personId);
  const cousinIds = new Set<string>();
  for (const parentId of [person.fatherId, person.motherId].filter(Boolean) as string[]) {
    const parentSiblings = getSiblings(parentId);
    for (const auntOrUncle of parentSiblings) {
      for (const child of getChildren(auntOrUncle.id)) {
        if (!siblingIds.has(child.id)) cousinIds.add(child.id);
      }
    }
  }
  return getPersons().filter((p) => cousinIds.has(p.id));
}

export function getRoots(): Person[] {
  return getPersons().filter((p) => !p.fatherId && !p.motherId);
}
