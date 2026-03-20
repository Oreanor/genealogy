'use client';

import { useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import { getMessages } from '@/lib/i18n/messages';
import { isLocale } from '@/lib/i18n/config';

interface StorageGateProps {
  children: React.ReactNode;
}

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

function useLoadingText(): string {
  const pathname = usePathname() ?? '';
  const segment = pathname.split('/').filter(Boolean)[0];
  const locale = segment && isLocale(segment) ? segment : 'ru';
  return getMessages(locale).loading ?? 'Loading';
}

export function StorageGate({ children }: StorageGateProps) {
  const ready = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const loadingText = useLoadingText();

  if (!ready) {
    return (
      <div className="flex min-h-screen min-w-full items-center justify-center bg-(--paper) text-(--ink)">
        {loadingText}
      </div>
    );
  }

  return <>{children}</>;
}
