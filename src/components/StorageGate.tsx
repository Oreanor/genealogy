'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { initThemeFromStorage } from '@/lib/theme-init';
import { getMessages } from '@/lib/i18n/messages';
import { isLocale } from '@/lib/i18n/config';

interface StorageGateProps {
  children: React.ReactNode;
}

function useLoadingText(): string {
  const pathname = usePathname() ?? '';
  const segment = pathname.split('/').filter(Boolean)[0];
  const locale = segment && isLocale(segment) ? segment : 'ru';
  return getMessages(locale).loading ?? 'Загрузка';
}

export function StorageGate({ children }: StorageGateProps) {
  const [ready, setReady] = useState(false);
  const loadingText = useLoadingText();

  useEffect(() => {
    initThemeFromStorage();
    queueMicrotask(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen min-w-full items-center justify-center bg-white text-neutral-700">
        {loadingText}
      </div>
    );
  }

  return <>{children}</>;
}
