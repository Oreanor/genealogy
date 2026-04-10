/** Same signature as `t` from `I18nProvider` / `useTranslations`. */
export type TranslationFn = (
  key: string,
  params?: Record<string, string | number>
) => string;
