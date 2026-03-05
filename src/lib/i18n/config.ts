/** Supported locales (language code) */
export const LOCALES = [
  'ru',
  'en',
  'de',
  'fr',
  'es',
  'it',
  'pt',
  'nl',
  'uk',
  'pl',
] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'ru';

export function isLocale(s: string): s is Locale {
  return (LOCALES as readonly string[]).includes(s);
}
