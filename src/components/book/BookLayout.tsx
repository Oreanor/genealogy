'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { AdminToolbarProvider } from '@/lib/contexts/AdminToolbarContext';
import { useLocaleRoutes } from '@/lib/i18n/context';
import { SECTIONS, isSectionId } from '@/lib/constants/sections';
import { SectionBookmarks } from './SectionBookmarks';
import { BookToolbar } from './BookToolbar';

interface BookLayoutProps {
  children: React.ReactNode;
  /** Content at top (for admin), not centered */
  alignTop?: boolean;
}

export function BookLayout({ children, alignTop = false }: BookLayoutProps) {
  const pathname = usePathname() ?? '';
  const searchParams = useSearchParams();
  const { t } = useLocaleRoutes();
  const isAdmin = pathname.includes('/admin');
  const bookMaxW = isAdmin ? '' : 'max-w-full md:max-w-[calc((100vh-6rem)*296/210)]';

  const sectionParam = searchParams.get('section') ?? '';
  const currentSectionId = isSectionId(sectionParam) ? sectionParam : 'tree';
  const currentSectionMeta = SECTIONS.find(({ id }) => id === currentSectionId);
  const currentSectionTitle = !isAdmin && currentSectionMeta ? t(currentSectionMeta.i18nKey) : null;

  return (
    <AdminToolbarProvider>
      <div
        className={`relative flex bg-(--book-bg) px-1 sm:px-1.5 md:px-3 lg:px-4 ${
          isAdmin
            ? 'h-screen flex-col overflow-hidden'
            : alignTop
              ? 'min-h-screen flex-col items-center justify-start pt-16'
              : 'h-screen min-h-screen flex-col items-center justify-start pt-0 pb-10 sm:pt-0 sm:pb-10 md:pt-4 md:pb-4'
        }`}
      >
        <BookToolbar />
        <div
          className={
            isAdmin
              ? 'ml-0 md:ml-16 flex min-h-0 flex-1 flex-col overflow-y-auto pb-5 max-w-none'
              : 'mx-auto flex min-h-0 w-full max-w-[100%] flex-1 flex-col items-center gap-0 pl-0 md:pl-16'
          }
        >
          <div
            className={`flex w-full min-w-0 flex-1 flex-col min-h-0 ${
              isAdmin ? 'max-w-full' : bookMaxW
            }`}
          >
            {/* Заголовок раздела показываем только на мобиле, на десктопе скрываем */}
            {!isAdmin && currentSectionTitle && (
              <div className="flex w-full justify-center pt-3 pb-1 md:hidden">
                <h1 className="font-serif text-base font-semibold text-(--ink) md:text-lg">
                  {currentSectionTitle}
                </h1>
              </div>
            )}
            {!isAdmin && <SectionBookmarks />}
            <div
              className={
                !isAdmin
                  ? 'book-content flex min-h-0 flex-1 flex-col overflow-y-auto pt-2.5 md:pt-0'
                  : ''
              }
            >
              {children}
            </div>
          </div>
        </div>
      </div>
    </AdminToolbarProvider>
  );
}
