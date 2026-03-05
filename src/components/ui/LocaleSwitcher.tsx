'use client';

import { useRef, useState } from 'react';
import { STORAGE_KEYS } from '@/lib/constants/storage';
import { LOCALES } from '@/lib/i18n/config';
import { useLocale, useTranslations } from '@/lib/i18n/context';
import { getPathSegments } from '@/lib/utils/path';
import { useClickOutside } from '@/hooks/useClickOutside';
import { usePathname, useRouter } from 'next/navigation';

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
    const href = `/${locale}${basePath ? `/${basePath}` : ''}`;
    router.push(href);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-9 cursor-pointer flex-shrink-0 items-center justify-center rounded-lg border-2 border-[var(--border)] bg-[var(--paper)] text-xs font-semibold text-[var(--ink)] shadow-md transition-shadow hover:shadow-lg md:h-11 md:w-11"
        aria-label={t('tooltipLanguage')}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {LOCALE_LABELS[currentLocale] ?? currentLocale.toUpperCase()}
      </button>
      {open && (
        <div
          className="absolute right-0 top-full z-10 mt-2 w-9 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-xl md:w-11"
          role="listbox"
          aria-label="Выбор языка"
        >
          {LOCALES.map((locale) => (
            <button
              key={locale}
              type="button"
              role="option"
              aria-selected={locale === currentLocale}
              onClick={() => goToLocale(locale)}
              className="flex w-full cursor-pointer items-center justify-center rounded-lg px-1 py-2 text-sm font-medium text-[var(--ink)] transition-colors hover:bg-[var(--border-subtle)]"
            >
              {LOCALE_LABELS[locale] ?? locale.toUpperCase()}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
