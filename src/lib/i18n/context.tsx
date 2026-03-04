'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { getRoutes } from '@/lib/constants/routes';
import type { Locale } from './config';
import { getMessages } from './messages';

interface I18nContextValue {
  locale: Locale;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function interpolate(
  template: string,
  params: Record<string, string | number>
): string {
  return Object.entries(params).reduce(
    (acc, [k, v]) => acc.replace(new RegExp(`\\{\\{\\s*${k}\\s*\\}\\}`, 'g'), String(v)),
    template
  );
}

interface I18nProviderProps {
  locale: Locale;
  messages: Record<string, string>;
  children: ReactNode;
}

export function I18nProvider({ locale, messages, children }: I18nProviderProps) {
  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const value = messages[key];
      if (value == null) return key;
      if (params) return interpolate(value, params);
      return value;
    },
    [messages]
  );

  const value = useMemo(() => ({ locale, t }), [locale, t]);

  return (
    <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

export function useTranslations() {
  return useI18n().t;
}

export function useLocale() {
  return useI18n().locale;
}

/** Локаль + переводы + роуты для текущей локали (упрощает повторяющийся код в компонентах). */
export function useLocaleRoutes() {
  const { locale, t } = useI18n();
  const routes = useMemo(() => getRoutes(locale), [locale]);
  return { locale, t, routes };
}
