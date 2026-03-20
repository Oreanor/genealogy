'use client';

import { useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import { getMessages } from '@/lib/i18n/messages';
import { DEFAULT_LOCALE, isLocale } from '@/lib/i18n/config';
import { LoadingOverlay } from '@/components/ui/molecules/LoadingOverlay';

interface StorageGateProps {
  children: React.ReactNode;
}

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

function useLoadingText(): string {
  const pathname = usePathname() ?? '';
  const segment = pathname.split('/').filter(Boolean)[0];
  const locale = segment && isLocale(segment) ? segment : DEFAULT_LOCALE;
  return getMessages(locale).loading ?? 'Loading';
}

export function StorageGate({ children }: StorageGateProps) {
  const ready = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const loadingText = useLoadingText();

  if (!ready) {
    return (
      <LoadingOverlay text={loadingText} mode="fixed" />
    );
  }

  return <>{children}</>;
}
