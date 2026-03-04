import type { Person } from '@/lib/types/person';

/** Ключ перевода роли в древе (для i18n). */
export function getTreeRoleKey(
  level: number,
  index: number,
  person: Person | null
): string {
  if (!person) return '';
  if (level === 0) return 'roleMe';
  if (level === 1) return index === 0 ? 'roleFather' : 'roleMother';
  const isMale = person.gender === 'm';
  switch (level) {
    case 2:
      return isMale ? 'roleGrandfather' : 'roleGrandmother';
    case 3:
      return isMale ? 'roleGreatGrandfather' : 'roleGreatGrandmother';
    case 4:
      return isMale ? 'roleGgGrandfather' : 'roleGgGrandmother';
    case 5:
      return isMale ? 'roleGggGrandfather' : 'roleGggGrandmother';
    default:
      return '';
  }
}

/** «Сын X и Y» или «Дочь X и Y» */
export function formatChildOf(person: Person, getParentName: (id: string) => string): string {
  if (person.parentIds.length === 0) return '';
  const role = person.gender === 'f' ? 'Дочь' : 'Сын';
  const names = person.parentIds.map(getParentName).filter(Boolean);
  if (names.length === 0) return '';
  return `${role} ${names.join(' и ')}`;
}

/** «Отец X, Y» или «Мать X, Y» */
export function formatParentOf(person: Person, childNames: string[]): string {
  if (childNames.length === 0) return '';
  const role = person.gender === 'f' ? 'Мать' : 'Отец';
  return `${role} ${childNames.join(', ')}`;
}
