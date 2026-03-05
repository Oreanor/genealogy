'use client';

import { usePathname } from 'next/navigation';
import { AdminToolbarProvider } from '@/lib/contexts/AdminToolbarContext';
import { SectionBookmarks } from './SectionBookmarks';
import { BookToolbar } from './BookToolbar';

interface BookLayoutProps {
  children: React.ReactNode;
  /** Content at top (for admin), not centered */
  alignTop?: boolean;
}

export function BookLayout({ children, alignTop = false }: BookLayoutProps) {
  const pathname = usePathname() ?? '';
  const isAdmin = pathname.includes('/admin');

  return (
    <AdminToolbarProvider>
      <div
        className={`relative flex bg-(--book-bg) p-1 sm:p-1.5 md:p-3 lg:p-4 ${
          isAdmin
            ? 'h-screen flex-col overflow-hidden pt-16'
            : alignTop
              ? 'min-h-screen flex-col items-center justify-start pt-16'
              : 'min-h-screen flex-col items-center justify-center pb-4 md:pb-6'
        }`}
      >
        <BookToolbar />
      <div
        className={`mx-auto flex w-full max-w-[98%] flex-col items-center gap-0 sm:max-w-[96%] md:max-w-[97%] lg:max-w-7xl ${
          isAdmin ? 'min-h-0 flex-1 overflow-y-auto' : 'mb-2 md:mb-4'
        }`}
      >
        <div
          className={`flex w-full min-w-0 flex-col ${isAdmin ? 'max-w-full' : 'max-w-[calc((100vh-6rem)*296/210)]'}`}
        >
          {!isAdmin && (
            <div className="flex w-full justify-end pr-0.5 md:pr-1">
              <SectionBookmarks />
            </div>
          )}
          {children}
        </div>
      </div>
      </div>
    </AdminToolbarProvider>
  );
}
