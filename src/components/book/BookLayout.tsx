'use client';

import { AdminButton } from '@/components/ui/AdminButton';
import { PageColorPicker } from '@/components/ui/PageColorPickerClient';
import { LocaleSwitcher } from '@/components/ui/LocaleSwitcher';
import { SectionBookmarks } from './SectionBookmarks';

interface BookLayoutProps {
  children: React.ReactNode;
  /** Content at top (for admin), not centered */
  alignTop?: boolean;
}

export function BookLayout({ children, alignTop = false }: BookLayoutProps) {
  return (
    <div
      className={`relative flex min-h-screen flex-col bg-[var(--book-bg)] p-1 sm:p-2 md:p-4 lg:p-5 ${
        alignTop ? 'items-center justify-start pt-16' : 'items-center justify-center'
      }`}
    >
      <div className="absolute right-2 top-[2vh] z-20 flex flex-col items-end gap-2">
        <AdminButton />
        <PageColorPicker />
        <LocaleSwitcher />
      </div>
      <div className="relative mx-auto w-full max-w-[95%] sm:max-w-[92%] md:max-w-[94%] lg:max-w-7xl">
        <SectionBookmarks />
        {children}
      </div>
    </div>
  );
}
