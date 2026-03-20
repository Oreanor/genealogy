'use client';

import { useCallback, useState } from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { BookOpen, HelpCircle } from 'lucide-react';
import { AdminButton } from '@/components/ui/AdminButton';
import { PageColorPicker } from '@/components/ui/PageColorPickerClient';
import { LocaleSwitcher } from '@/components/ui/LocaleSwitcher';
import { Tooltip } from '@/components/ui/Tooltip';
import { SquareIconButton, SquareIconLink } from '@/components/ui/SquareIconButton';
import { useLocaleRoutes } from '@/lib/i18n/context';
import { PdfPreviewDialog } from '@/components/pdf/PdfPreviewDialog';
import { SECTIONS, isSectionId } from '@/lib/constants/sections';
import type { SectionId } from '@/lib/constants/sections';
import { ADMIN_TAB_IDS, type AdminTabId } from '@/lib/constants/storage';
import { AdminHelpDialog } from '@/components/admin/AdminHelpDialog';
import { BookHelpDialog } from '@/components/book/BookHelpDialog';

function BookLinkButton({ title }: { title?: string }) {
  const { routes, t } = useLocaleRoutes();
  const label = title ?? t('navTree');
  return (
    <SquareIconLink
      href={routes.home}
      label={label}
    >
      <BookOpen className="size-[18px]" aria-hidden />
    </SquareIconLink>
  );
}

/** Toolbar: desktop — vertical left; mobile — bottom bar under content. */
export function BookToolbar() {
  const helpSection = SECTIONS.find(({ id }) => id === 'help');

  const pathname = usePathname() ?? '';
  const searchParams = useSearchParams();
  const router = useRouter();
  const isAdmin = pathname.includes('/admin');
  const { t } = useLocaleRoutes();
  const [pdfOpen, setPdfOpen] = useState(false);
  const [adminHelpOpen, setAdminHelpOpen] = useState(false);
  const [bookHelpOpen, setBookHelpOpen] = useState(false);
  const closePdfPreview = useCallback(() => setPdfOpen(false), []);

  const sectionParam = searchParams.get('section') ?? '';
  const currentSection: SectionId = isSectionId(sectionParam) ? sectionParam : 'tree';
  const safeSectionForSelect: SectionId = currentSection === 'kinship' ? 'tree' : currentSection;
  const helpTarget = currentSection === 'kinship' || currentSection === 'help' ? 'tree' : currentSection;

  const tabParam = searchParams.get('tab') ?? '';
  const currentAdminTab: AdminTabId = ADMIN_TAB_IDS.includes(
    tabParam as AdminTabId
  )
    ? (tabParam as AdminTabId)
    : 'persons';

  const handleSectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value as SectionId;
    const url = id === 'tree' ? pathname : `${pathname}?section=${id}`;
    router.push(url);
  };

  const handleAdminTabChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value as AdminTabId;
    const url = `${pathname}?tab=${id}`;
    router.replace(url, { scroll: false });
  };

  return (
    <>
      {/* Mobile: нижняя панель на серой полосе во всю ширину */}
      <div className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center bg-(--book-bg) pb-[max(env(safe-area-inset-bottom),0px)] pt-1.5 md:hidden">
        <div className="pointer-events-auto flex w-full max-w-[640px] items-center gap-2 px-2">
          {/* 1) Книга/админка */}
          <Tooltip label={isAdmin ? t('tooltipToBook') : t('adminTitle')} side="top">
            <div className="shrink-0">
              {isAdmin ? (
                <BookLinkButton title={t('tooltipToBook')} />
              ) : (
                <AdminButton />
              )}
            </div>
          </Tooltip>

          {/* Выпадающий список разделов: книга или админ-вкладки */}
          {isAdmin ? (
            <select
              value={currentAdminTab}
              onChange={handleAdminTabChange}
              className="flex-1 rounded-md border border-(--border) bg-(--paper) px-2 py-1 text-xs text-(--ink) shadow-sm"
              aria-label={t('adminTitle')}
            >
              {ADMIN_TAB_IDS.map((id) => (
                <option key={id} value={id}>
                  {t(
                    id === 'persons'
                      ? 'adminTabPersons'
                      : id === 'texts'
                        ? 'chapters_history'
                        : 'adminTabPhotos'
                  )}
                </option>
              ))}
            </select>
          ) : (
            <select
              value={safeSectionForSelect}
              onChange={handleSectionChange}
              className="flex-1 rounded-md border border-(--border) bg-(--paper) px-2 py-1 text-xs text-(--ink) shadow-sm"
              aria-label={t('navAria')}
            >
              {SECTIONS.filter(({ id }) => id !== 'help' && id !== 'kinship').map(({ id, i18nKey }) => (
                <option key={id} value={id}>
                  {t(i18nKey)}
                </option>
              ))}
            </select>
          )}

          {/* 3) Цвет страницы */}
          <Tooltip label={t('tooltipPageColor')} side="top">
            <div className="shrink-0">
              <PageColorPicker popupDirection="up" />
            </div>
          </Tooltip>

          {/* 4) Язык */}
          <Tooltip label={t('tooltipLanguage')} side="top">
            <div className="shrink-0">
              <LocaleSwitcher />
            </div>
          </Tooltip>

          {/* 5) Помощь */}
          {isAdmin ? (
            <Tooltip label={t('adminHelp')} side="top">
              <SquareIconButton
                onClick={() => setAdminHelpOpen(true)}
                label={t('adminHelp')}
              >
                <HelpCircle className="size-[18px]" aria-hidden />
              </SquareIconButton>
            </Tooltip>
          ) : helpSection ? (
            <Tooltip label={t(helpSection.i18nKey)} side="top">
              <SquareIconButton
                onClick={() => setBookHelpOpen(true)}
                label={t(helpSection.i18nKey)}
              >
                <HelpCircle className="size-[18px]" aria-hidden />
              </SquareIconButton>
            </Tooltip>
          ) : null}

        </div>
      </div>
      {isAdmin && adminHelpOpen && (
        <AdminHelpDialog
          activeTab={currentAdminTab}
          onClose={() => setAdminHelpOpen(false)}
        />
      )}
      {!isAdmin && (
        <BookHelpDialog
          open={bookHelpOpen}
          section={helpTarget}
          onClose={() => setBookHelpOpen(false)}
        />
      )}
      <PdfPreviewDialog open={pdfOpen} onClose={closePdfPreview} />
    </>
  );
}
