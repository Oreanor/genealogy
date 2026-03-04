export { LOCALES, DEFAULT_LOCALE, isLocale } from './config';
export type { Locale } from './config';
export { getMessages } from './messages';
export {
  I18nProvider,
  useI18n,
  useTranslations,
  useLocale,
  useLocaleRoutes,
} from './context';
