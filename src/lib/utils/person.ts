import type { Person } from '@/lib/types/person';
import type { Locale } from '@/lib/i18n/config';
import { getMessages } from '@/lib/i18n/messages';

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

export function getTemplateRootNameByLocale(locale: Locale): string {
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

const CYR_TO_LAT_MAP: Record<string, string> = {
  А: 'A', а: 'a', Б: 'B', б: 'b', В: 'V', в: 'v', Г: 'G', г: 'g',
  Д: 'D', д: 'd', Е: 'E', е: 'e', Ё: 'Yo', ё: 'yo', Ж: 'Zh', ж: 'zh',
  З: 'Z', з: 'z', И: 'I', и: 'i', Й: 'Y', й: 'y', К: 'K', к: 'k',
  Л: 'L', л: 'l', М: 'M', м: 'm', Н: 'N', н: 'n', О: 'O', о: 'o',
  П: 'P', п: 'p', Р: 'R', р: 'r', С: 'S', с: 's', Т: 'T', т: 't',
  У: 'U', у: 'u', Ф: 'F', ф: 'f', Х: 'Kh', х: 'kh', Ц: 'Ts', ц: 'ts',
  Ч: 'Ch', ч: 'ch', Ш: 'Sh', ш: 'sh', Щ: 'Shch', щ: 'shch',
  Ъ: '', ъ: '', Ы: 'Y', ы: 'y', Ь: '', ь: '',
  Э: 'E', э: 'e', Ю: 'Yu', ю: 'yu', Я: 'Ya', я: 'ya',
  Є: 'Ye', є: 'ye', І: 'I', і: 'i', Ї: 'Yi', ї: 'yi', Ґ: 'G', ґ: 'g',
};

export function isLatinScriptLocale(locale: Locale): boolean {
  return LATIN_SCRIPT_LOCALES.has(locale);
}

export function transliterateCyrillicToLatin(input: string): string {
  return input
    .split('')
    .map((ch) => CYR_TO_LAT_MAP[ch] ?? ch)
    .join('');
}

export function formatNameByLocale(input: string, locale: Locale): string {
  const text = input.trim();
  if (!text) return '';
  if (!isLatinScriptLocale(locale)) return text;
  return transliterateCyrillicToLatin(text);
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
