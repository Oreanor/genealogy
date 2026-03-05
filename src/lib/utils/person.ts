import type { Person } from '@/lib/types/person';
import { getPersonById, getPersons } from '@/lib/data/persons';

/** Formats life dates for display (tree, person card). */
export function formatLifeDates(birth?: string, death?: string): string {
  if (birth && death) return `${birth} – ${death}`;
  if (birth) return birth;
  if (death) return death;
  return '';
}

/** Full name: LastName FirstName Patronymic. Empty parts omitted. */
export function getFullName(person: Person | null | undefined): string {
  if (!person) return '';
  const parts = [person.lastName, person.firstName, person.patronymic].filter(
    (s): s is string => Boolean(s?.trim())
  );
  return parts.join(' ') || '';
}

/** Sort by last name, then first name (for person list). */
export function sortPersonsBySurname(persons: Person[]): Person[] {
  return [...persons].sort((a, b) => {
    const surnameA = (a.lastName ?? '').toLowerCase();
    const surnameB = (b.lastName ?? '').toLowerCase();
    if (surnameA !== surnameB) return surnameA.localeCompare(surnameB);
    const nameA = (a.firstName ?? '').toLowerCase();
    const nameB = (b.firstName ?? '').toLowerCase();
    return nameA.localeCompare(nameB);
  });
}

/** Whether the person matches the search string (last, first, patronymic). */
export function personMatchesSearch(person: Person, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  const full = getFullName(person).toLowerCase();
  const first = (person.firstName ?? '').toLowerCase();
  const last = (person.lastName ?? '').toLowerCase();
  const patronymic = (person.patronymic ?? '').toLowerCase();
  return full.includes(q) || first.includes(q) || last.includes(q) || patronymic.includes(q);
}

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
