/** Supported locales (language code). Display order: ru, en, pt, uk, then the rest. */
export type Locale = 'ru' | 'en' | 'pt' | 'uk' | 'de' | 'fr' | 'es' | 'it' | 'nl' | 'pl';

export const LOCALES: readonly Locale[] = [
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
];

export const DEFAULT_LOCALE: Locale = 'en';

export function isLocale(s: string): s is Locale {
  return LOCALES.includes(s as Locale);
}
