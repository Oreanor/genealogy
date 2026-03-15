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
  const bookMaxW = isAdmin ? '' : 'max-w-full md:max-w-[calc((100vh-6rem)*296/210)]';

  return (
    <AdminToolbarProvider>
      <div
        className={`relative flex bg-(--book-bg) px-1 sm:px-1.5 md:px-3 lg:px-4 ${
          isAdmin
            ? 'h-screen flex-col overflow-hidden'
            : alignTop
              ? 'min-h-screen flex-col items-center justify-start pt-16'
              : 'h-screen min-h-screen flex-col items-center justify-start pt-2 pb-2 sm:pt-3 sm:pb-3 md:pt-4 md:pb-4'
        }`}
      >
        <BookToolbar />
      <div
        className={
          isAdmin
            ? 'ml-12 flex min-h-0 flex-1 flex-col overflow-y-auto pb-5 md:ml-16 max-w-none'
            : 'mx-auto flex min-h-0 w-full max-w-[100%] flex-1 flex-col items-center gap-0'
        }
      >
        <div
          className={`flex w-full min-w-0 flex-1 flex-col min-h-0 ${isAdmin ? 'max-w-full' : bookMaxW}`}
        >
          {!isAdmin && <SectionBookmarks />}
          <div className={!isAdmin ? 'book-content flex min-h-0 flex-1 flex-col overflow-y-auto pt-2.5 md:pt-0' : ''}>{children}</div>

        </div>
      </div>
      </div>
    </AdminToolbarProvider>
  );
}
