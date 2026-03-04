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
