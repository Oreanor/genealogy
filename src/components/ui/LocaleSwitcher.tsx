'use client';

import { useRef, useState } from 'react';
import { STORAGE_KEYS } from '@/lib/constants/storage';
import { TOOLBAR_BUTTON_CLASS } from '@/lib/constants/theme';
import { LOCALES } from '@/lib/i18n/config';
import { useLocale, useTranslations } from '@/lib/i18n/context';
import { getPathSegments } from '@/lib/utils/path';
import { useClickOutside } from '@/hooks/useClickOutside';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';

const LOCALE_LABELS: Record<string, string> = {
  ru: 'RU',
  en: 'EN',
  de: 'DE',
  fr: 'FR',
  es: 'ES',
  it: 'IT',
  pt: 'PT',
  nl: 'NL',
  uk: 'UK',
  pl: 'PL',
};

function saveLocaleToStorage(locale: string) {
  try {
    localStorage.setItem(STORAGE_KEYS.locale, locale);
  } catch {
    // ignore
  }
}

export function LocaleSwitcher() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentLocale = useLocale();
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false), open);

  if (!pathname) return null;

  const segments = getPathSegments(pathname);
  const basePath = segments.slice(1).join('/');

  const goToLocale = (locale: string) => {
    saveLocaleToStorage(locale);
    const search = searchParams?.toString();
    const href = `/${locale}${basePath ? `/${basePath}` : ''}${search ? `?${search}` : ''}`;
    router.push(href);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`${TOOLBAR_BUTTON_CLASS} text-xs font-semibold text-(--ink)`}
        aria-label={t('tooltipLanguage')}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {LOCALE_LABELS[currentLocale] ?? currentLocale.toUpperCase()}
      </button>
      {open && (
        <div
          className="absolute left-0 top-full z-10 mt-2 w-9 rounded-xl border border-(--border) bg-(--surface) p-2 shadow-xl md:w-11"
          role="listbox"
          aria-label={t('selectLanguage')}
        >
          {LOCALES.map((locale) => (
            <button
              key={locale}
              type="button"
              role="option"
              aria-selected={locale === currentLocale}
              onClick={() => goToLocale(locale)}
              className="flex w-full cursor-pointer items-center justify-center rounded-lg px-1 py-2 text-sm font-medium text-(--ink) transition-colors hover:bg-(--border-subtle)"
            >
              {LOCALE_LABELS[locale] ?? locale.toUpperCase()}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
