import type { Person } from '@/lib/types/person';

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
