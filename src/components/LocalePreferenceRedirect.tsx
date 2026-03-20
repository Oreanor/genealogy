'use client';

import { STORAGE_KEYS } from '@/lib/constants/storage';
import { DEFAULT_LOCALE, isLocale } from '@/lib/i18n/config';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

/**
 * On visiting home in default locale (/en), applies saved language from localStorage
 * (same "setting" as page color).
 */
export function LocalePreferenceRedirect() {
  const pathname = usePathname();
  const router = useRouter();
  const didRedirect = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !pathname || didRedirect.current) return;
    if (pathname !== `/${DEFAULT_LOCALE}`) return;

    try {
      const saved = localStorage.getItem(STORAGE_KEYS.locale);
      if (saved && isLocale(saved) && saved !== DEFAULT_LOCALE) {
        didRedirect.current = true;
        router.replace(`/${saved}`);
      }
    } catch {
      // ignore
    }
  }, [pathname, router]);

  return null;
}
