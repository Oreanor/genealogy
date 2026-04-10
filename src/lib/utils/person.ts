import type { Person } from '@/lib/types/person';
import type { Locale } from '@/lib/i18n/config';
import { getMessages } from '@/lib/i18n/messages';
import { transliterateCyrillicToLatin } from '@/lib/utils/transliteration';
import { truncateWithEllipsis } from '@/lib/utils/string';

type NameParts = {
  lastName?: string | null;
  firstName?: string | null;
  patronymic?: string | null;
};

export function getTemplatePersonParts(
  locale: Locale
): Pick<Person, 'firstName' | 'lastName' | 'patronymic'> {
  const messages = getMessages(locale);
  return {
    firstName: messages.templateRootFirstName?.trim() ?? '',
    lastName: messages.templateRootLastName?.trim() ?? '',
    patronymic: messages.templateRootPatronymic?.trim() ?? '',
  };
}

function getTemplateRootNameByLocale(locale: Locale): string {
  const t = getTemplatePersonParts(locale);
  return [t.lastName, t.firstName, t.patronymic].filter(Boolean).join(' ').trim();
}

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
  return parts.join(' ');
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

const LATIN_SCRIPT_LOCALES = new Set<Locale>(['en', 'pt', 'de', 'fr', 'es', 'it', 'nl', 'pl']);
const localizedNameCache = new Map<string, string>();

export function isLatinScriptLocale(locale: Locale): boolean {
  return LATIN_SCRIPT_LOCALES.has(locale);
}

export { transliterateCyrillicToLatin };

export function formatNameByLocale(input: string, locale: Locale): string {
  const text = input.trim();
  if (!text) return '';
  if (!isLatinScriptLocale(locale)) return text;
  const cacheKey = `${locale}\u0000${text}`;
  const cached = localizedNameCache.get(cacheKey);
  if (cached != null) return cached;
  const result = transliterateCyrillicToLatin(text);
  localizedNameCache.set(cacheKey, result);
  return result;
}

export function formatNamePartsByLocale(parts: NameParts, locale: Locale): {
  lastName: string;
  firstName: string;
  patronymic: string;
} {
  return {
    lastName: parts.lastName ? formatNameByLocale(parts.lastName, locale) : '',
    firstName: parts.firstName ? formatNameByLocale(parts.firstName, locale) : '',
    patronymic: parts.patronymic ? formatNameByLocale(parts.patronymic, locale) : '',
  };
}

export function formatPersonNameForLocale(
  person: Person | null | undefined,
  locale: Locale
): string {
  const full = getFullName(person);
  if (!person) return '';
  const hasPersonName = Boolean(person.firstName?.trim() || person.lastName?.trim() || person.patronymic?.trim());
  if (!hasPersonName) return getTemplateRootNameByLocale(locale);
  return formatNameByLocale(full, locale);
}

/** Compact “Surname I.P.” for sibling mini-labels on the tree. */
export function formatTreeSiblingChipLabel(
  person: Person,
  locale: Locale,
  maxLastLen = 10
): string {
  const localized = formatNamePartsByLocale(person, locale);
  const last = localized.lastName.trim();
  const firstInitial = localized.firstName.trim().charAt(0);
  const patronymicInitial = localized.patronymic.trim().charAt(0);
  const initials = `${firstInitial ? `${firstInitial}.` : ''}${patronymicInitial ? `${patronymicInitial}.` : ''}`;
  const lastPart = last ? truncateWithEllipsis(last, maxLastLen) : '';
  const label = [lastPart, initials].filter(Boolean).join(' ');
  return label || formatPersonNameForLocale(person, locale);
}
