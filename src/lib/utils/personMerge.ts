import type { Person } from '@/lib/types/person';
import type { Locale } from '@/lib/i18n/config';
import { getTemplatePersonParts } from '@/lib/utils/person';
import { readPersonNameLocks } from '@/lib/utils/personNameLocks';

function bundledHasStoredNames(
  b: Pick<Person, 'firstName' | 'lastName' | 'patronymic'>
): boolean {
  return Boolean(
    (b.firstName ?? '').trim() || (b.lastName ?? '').trim() || (b.patronymic ?? '').trim()
  );
}

/**
 * Merge bundled row + working row for display.
 * @param hasWorkingSession — true when admin (or any) session list is active: non-locked names follow working state.
 */
export function mergeOnePerson(
  bDisk: Person,
  w: Person,
  locale: Locale,
  hasWorkingSession: boolean
): Person {
  const locks = readPersonNameLocks();
  const tpl = getTemplatePersonParts(locale);
  const id = w.id;

  if (locks.has(id)) {
    return { ...bDisk, ...w };
  }

  if (hasWorkingSession) {
    if (bundledHasStoredNames(bDisk) || bundledHasStoredNames(w)) {
      return { ...bDisk, ...w };
    }
    return {
      ...bDisk,
      ...w,
      firstName: tpl.firstName,
      lastName: tpl.lastName,
      patronymic: tpl.patronymic,
    };
  }

  if (bundledHasStoredNames(bDisk)) {
    return { ...bDisk, ...w };
  }
  return {
    ...bDisk,
    ...w,
    firstName: tpl.firstName,
    lastName: tpl.lastName,
    patronymic: tpl.patronymic,
  };
}

export function mergePersonsForDisplay(
  bundled: Person[],
  working: Person[] | null,
  locale: Locale
): Person[] {
  const bundledById = new Map(bundled.map((p): [string, Person] => [p.id, p]));
  const list = working ?? bundled;
  const hasWorkingSession = working !== null;

  return list.map((w) => {
    const bDisk =
      bundledById.get(w.id) ??
      ({
        ...w,
        firstName: '',
        lastName: '',
        patronymic: '',
      } as Person);
    return mergeOnePerson(bDisk, w, locale, hasWorkingSession);
  });
}
