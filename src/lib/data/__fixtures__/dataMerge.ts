import type { Person } from '@/lib/types/person';
import type { PhotoEntry } from '@/lib/types/photo';
import type { HistoryEntry } from '@/lib/types/history';
import type { AdminDataSections } from '@/lib/utils/dataMerge';

/**
 * Create a Person with realistic defaults.
 *
 * Only `id` is required — the rest is filled in automatically:
 * `firstName` defaults to `id`, `gender` to `'m'`, plus empty strings
 * for `patronymic`, `lastName`, `birthPlace`, `residenceCity`, `occupation`,
 * and `comment`.
 *
 * Pass any `Partial<Person>` as `extra` to override or add fields:
 * ```
 * person('p1', { birthDate: '1990', fatherId: 'p2' })
 * ```
 */
export function person(id: string, extra: Partial<Person> = {}): Person {
  return {
    id,
    firstName: id,
    patronymic: '',
    lastName: '',
    birthPlace: '',
    residenceCity: '',
    occupation: '',
    comment: '',
    gender: 'm',
    ...extra,
  };
}

/**
 * Create a PhotoEntry with realistic defaults.
 *
 * Only `id` is required — `src` is auto-derived as `/photos/<id>.jpg`,
 * `category` defaults to `'related'` (same default the app uses on load),
 * and `people` defaults to an empty array.
 *
 * Pass any `Partial<PhotoEntry>` as `extra` to override or add fields:
 * ```
 * photo('ph1', { caption: 'Свадьба', people: [{ personId: 'p1' }] })
 * ```
 */
export function photo(id: string, extra: Partial<PhotoEntry> = {}): PhotoEntry {
  return {
    id,
    src: `/photos/${id}.jpg`,
    category: 'related',
    people: [],
    ...extra,
  };
}

/**
 * Create a HistoryEntry with realistic defaults.
 *
 * Only `title` is required — `richText` defaults to an empty string,
 * `personIds` defaults to an empty array.
 *
 * Pass any `Partial<HistoryEntry>` as `extra` to override or add fields:
 * ```
 * history('Переезд', { richText: '<p>В 1965 году…</p>', personIds: ['p1', 'p2'] })
 * ```
 */
export function history(
  title: string,
  extra: Partial<HistoryEntry> = {}
): HistoryEntry {
  return { title, richText: '', personIds: [], ...extra };
}

/**
 * Build a complete `AdminDataSections` object with sensible defaults.
 *
 * All four required sections are provided (empty arrays + `rootPersonId: 'p001'`).
 * Pass a `Partial<AdminDataSections>` to override any section:
 * ```
 * makeData({ persons: [person('p1')], rootPersonId: 'p1' })
 * ```
 */
export function makeData(
  overrides: Partial<AdminDataSections> = {}
): AdminDataSections {
  return {
    rootPersonId: 'p001',
    persons: [],
    photos: [],
    history: [],
    ...overrides,
  };
}
