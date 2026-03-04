import type { Person } from '@/lib/types/person';
import { getPersons } from '@/lib/data/persons';

export function getChildren(personId: string): Person[] {
  return getPersons().filter((p) => p.parentIds.includes(personId));
}

export function getSiblings(personId: string): Person[] {
  const person = getPersons().find((p) => p.id === personId);
  if (!person || person.parentIds.length === 0) return [];
  const parentSet = new Set(person.parentIds);
  return getPersons().filter(
    (p) =>
      p.id !== personId &&
      p.parentIds.length === parentSet.size &&
      p.parentIds.every((pid) => parentSet.has(pid))
  );
}

export function getRoots(): Person[] {
  return getPersons().filter((p) => p.parentIds.length === 0);
}
