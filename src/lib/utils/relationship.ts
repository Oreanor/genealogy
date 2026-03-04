import type { Person } from '@/lib/types/person';

/** Роль в древе по уровню и позиции (0=отец, 1=мать, и т.д.) */
export function getTreeRole(level: number, index: number, person: Person | null): string {
  if (!person) return '';
  if (level === 0) return 'я';
  if (level === 1) return index === 0 ? 'отец' : 'мать';
  const isMale = person.gender === 'm';
  switch (level) {
    case 2:
      return isMale ? 'дед' : 'бабушка';
    case 3:
      return isMale ? 'прадед' : 'прабабушка';
    case 4:
      return isMale ? 'прапрадед' : 'прапрабабушка';
    case 5:
      return isMale ? 'прапрапрадед' : 'прапрапрабабушка';
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
