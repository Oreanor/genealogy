/** Supported locales (language code). Display order: ru, en, pt, uk, then the rest. */
export const LOCALES = [
  'ru',
  'en',
  'pt',
  'uk',
  'de',
  'fr',
  'es',
  'it',
  'nl',
  'pl',
] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

export function isLocale(s: string): s is Locale {
  return (LOCALES as readonly string[]).includes(s);
}
