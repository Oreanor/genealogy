'use client';

import type { Person } from '@/lib/types/person';

export const PERSON_ID_PAD = 3;

/** Numeric part of id (e.g. p001, p002) for sorting; NaN otherwise */
export function personIdNum(id: string): number {
  const m = /^p(\d+)$/.exec(id);
  return m ? Number.parseInt(m[1]!, 10) : Number.NaN;
}

export function isEmptyPersonRow(person: Person): boolean {
  const last = (person.lastName ?? '').trim();
  const first = (person.firstName ?? '').trim();
  const patr = (person.patronymic ?? '').trim();
  return last === '' && first === '' && patr === '';
}

/** Empty/new rows first, then by surname alphabetically. */
export function sortPersonsDefault(ps: Person[]): Person[] {
  return [...ps].sort((a, b) => {
    const aLast = (a.lastName ?? '').trim();
    const bLast = (b.lastName ?? '').trim();
    const aFirst = (a.firstName ?? '').trim();
    const bFirst = (b.firstName ?? '').trim();
    const aPatr = (a.patronymic ?? '').trim();
    const bPatr = (b.patronymic ?? '').trim();

    const aEmpty = aLast === '' && aFirst === '' && aPatr === '';
    const bEmpty = bLast === '' && bFirst === '' && bPatr === '';
    if (aEmpty !== bEmpty) return aEmpty ? -1 : 1;

    if (aLast !== bLast) return aLast.localeCompare(bLast, 'ru', { sensitivity: 'base' });
    if (aFirst !== bFirst) return aFirst.localeCompare(bFirst, 'ru', { sensitivity: 'base' });
    if (aPatr !== bPatr) return aPatr.localeCompare(bPatr, 'ru', { sensitivity: 'base' });

    const na = personIdNum(a.id);
    const nb = personIdNum(b.id);
    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
    return a.id.localeCompare(b.id, 'ru', { sensitivity: 'base' });
  });
}

export type SortDirection = 'asc' | 'desc';
export type SortKey = keyof Person;

export function compareValues(a: string, b: string): number {
  return a.localeCompare(b, 'ru', { sensitivity: 'base', numeric: true });
}

export function sortPersonsByColumn(
  ps: Person[],
  sortBy: SortKey,
  direction: SortDirection
): Person[] {
  const factor = direction === 'asc' ? 1 : -1;
  return [...ps].sort((a, b) => {
    const av = String(a[sortBy] ?? '').trim();
    const bv = String(b[sortBy] ?? '').trim();
    const cmp = compareValues(av, bv);
    if (cmp !== 0) return cmp * factor;

    // Stable tie-breaker: default persons ordering.
    return sortPersonsDefault([a, b])[0] === a ? -1 : 1;
  });
}

/** Table columns (no id, no #); Father/Mother rendered separately. */
export const COLUMNS: (keyof Person)[] = [
  'lastName',
  'firstName',
  'patronymic',
  'birthDate',
  'deathDate',
  'birthPlace',
  'residenceCity',
  'occupation',
  'comment',
  'gender',
];

export const COLUMN_LABELS: Partial<Record<keyof Person, string>> = {
  firstName: 'adminFirstName',
  patronymic: 'adminPatronymic',
  lastName: 'adminLastName',
  birthDate: 'adminBirthDate',
  deathDate: 'adminDeathDate',
  birthPlace: 'adminBirthPlace',
  residenceCity: 'adminResidenceCity',
  occupation: 'adminOccupation',
  comment: 'adminComment',
  gender: 'adminGender',
};

export const INITIAL_COLUMN_WIDTHS: Record<string, number> = {
  lastName: 120,
  firstName: 120,
  patronymic: 120,
  birthDate: 92,
  deathDate: 92,
  birthPlace: 110,
  residenceCity: 110,
  occupation: 120,
  comment: 140,
  gender: 56,
  avatar: 52,
  father: 180,
  mother: 180,
};

export function minWidthForColumn(id: string): number {
  if (id === 'gender') return 48;
  if (id === 'avatar') return 44;
  if (id === 'birthDate' || id === 'deathDate') return 82;
  if (id === 'father' || id === 'mother') return 120;
  return 90;
}

export function nextPersonId(persons: Person[]): string {
  const nums = persons
    .map((p) => personIdNum(p.id))
    .filter((n) => !Number.isNaN(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return `p${String(max + 1).padStart(PERSON_ID_PAD, '0')}`;
}

export type TranslationFn = (key: string, params?: Record<string, string | number>) => string;

export type CityReviewState = {
  rowIdx: number;
  field: 'birthPlace' | 'residenceCity';
  city: string;
  geocodedPoint: { lat: number; lon: number } | null;
  manualLat: string;
  manualLon: string;
};
