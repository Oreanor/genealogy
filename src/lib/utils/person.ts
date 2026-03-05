import type { Person } from '@/lib/types/person';
import { getPersonById, getPersons } from '@/lib/data/persons';

/** Форматирует даты жизни для отображения (древо, карточка). */
export function formatLifeDates(birth?: string, death?: string): string {
  if (birth && death) return `${birth} – ${death}`;
  if (birth) return birth;
  if (death) return death;
  return '';
}

/** Полное имя: Фамилия Имя Отчество. Пустые части пропускаются. */
export function getFullName(person: Person | null | undefined): string {
  if (!person) return '';
  const parts = [person.lastName, person.firstName, person.patronymic].filter(
    (s): s is string => Boolean(s?.trim())
  );
  return parts.join(' ') || '';
}

export function getChildren(personId: string): Person[] {
  return getPersons().filter((p) => p.parentIds.includes(personId));
}

/** Супруг/супруга — второй родитель у общего ребёнка (вычисляется из дерева). */
export function getSpouse(personId: string): Person | null {
  const children = getChildren(personId);
  if (children.length === 0) return null;
  const otherParentId = children[0].parentIds.find((id) => id !== personId);
  if (!otherParentId) return null;
  return getPersonById(otherParentId) ?? null;
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

/** Двоюродные братья и сёстры — дети братьев/сестёр родителей */
export function getCousins(personId: string): Person[] {
  const person = getPersons().find((p) => p.id === personId);
  if (!person || person.parentIds.length === 0) return [];
  const siblingIds = new Set(getSiblings(personId).map((s) => s.id));
  siblingIds.add(personId);
  const cousinIds = new Set<string>();
  for (const parentId of person.parentIds) {
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
  return getPersons().filter((p) => p.parentIds.length === 0);
}
