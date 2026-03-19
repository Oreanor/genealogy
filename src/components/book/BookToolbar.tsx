`use client`;

import { useCallback, useRef, useState } from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { BookOpen, Clipboard, Save, Upload, MoreHorizontal, HelpCircle } from 'lucide-react';
import { AdminButton } from '@/components/ui/AdminButton';
import { PageColorPicker } from '@/components/ui/PageColorPickerClient';
import { LocaleSwitcher } from '@/components/ui/LocaleSwitcher';
import { Tooltip } from '@/components/ui/Tooltip';
import { Button } from '@/components/ui/atoms/Button';
import { SquareIconLink } from '@/components/ui/SquareIconButton';
import { useLocaleRoutes } from '@/lib/i18n/context';
import { useAdminToolbar } from '@/lib/contexts/AdminToolbarContext';
import { PdfPreviewDialog } from '@/components/pdf/PdfPreviewDialog';
import { SECTIONS, isSectionId } from '@/lib/constants/sections';
import type { SectionId } from '@/lib/constants/sections';
import { ADMIN_TAB_IDS, type AdminTabId } from '@/lib/constants/storage';

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
  const { actions } = useAdminToolbar();
  const { t } = useLocaleRoutes();
  const [pdfOpen, setPdfOpen] = useState(false);
  const [adminMoreOpen, setAdminMoreOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const closePdfPreview = useCallback(() => setPdfOpen(false), []);

  const sectionParam = searchParams.get('section') ?? '';
  const currentSection: SectionId = isSectionId(sectionParam) ? sectionParam : 'tree';

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !actions) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed: unknown = JSON.parse(reader.result as string);
        actions.onImport(parsed);
      } catch {
        /* invalid JSON — ignored, AdminPageClient validates */
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <>
      {/* Mobile: нижняя панель на серой полосе во всю ширину */}
      <div className="pointer-events-none fixed inset-x-0 bottom-5 z-30 flex justify-center bg-(--book-bg) pb-[max(env(safe-area-inset-bottom),0px)] pt-1.5 md:hidden">
        <div className="pointer-events-auto flex w-full max-w-[640px] items-center gap-2 px-2">
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
              value={currentSection}
              onChange={handleSectionChange}
              className="flex-1 rounded-md border border-(--border) bg-(--paper) px-2 py-1 text-xs text-(--ink) shadow-sm"
              aria-label={t('navAria')}
            >
              {SECTIONS.filter(({ id }) => id !== 'help').map(({ id, i18nKey }) => (
                <option key={id} value={id}>
                  {t(i18nKey)}
                </option>
              ))}
            </select>
          )}

          {/* Язык */}
          <Tooltip label={t('tooltipLanguage')} side="top">
            <div className="shrink-0">
              <LocaleSwitcher />
            </div>
          </Tooltip>

          {/* Цвет страницы */}
          <Tooltip label={t('tooltipPageColor')} side="top">
            <div className="shrink-0">
              <PageColorPicker />
            </div>
          </Tooltip>

          {!isAdmin && helpSection && (
            <Tooltip label={t(helpSection.i18nKey)} side="top">
              <SquareIconLink
                href={`${pathname}?section=help`}
                label={t(helpSection.i18nKey)}
                ariaCurrent={currentSection === 'help' ? 'page' : undefined}
              >
                <HelpCircle className="size-[18px]" aria-hidden />
              </SquareIconLink>
            </Tooltip>
          )}

          {/* Кнопка книга/админка справа */}
          <Tooltip label={isAdmin ? t('tooltipToBook') : t('adminTitle')} side="top">
            <div className="shrink-0">
              {isAdmin ? (
                <BookLinkButton title={t('tooltipToBook')} />
              ) : (
                <AdminButton />
              )}
            </div>
          </Tooltip>

          {/* Три точки в админке */}
          {isAdmin && actions ? (
            <div className="relative shrink-0">
              <Tooltip label={t('adminMoreActions') ?? 'Ещё'} side="top">
                <Button
                  variant="icon"
                  aria-label={t('adminMoreActions') ?? 'Ещё'}
                  onClick={() => setAdminMoreOpen((v) => !v)}
                >
                  <MoreHorizontal className="size-5" aria-hidden />
                </Button>
              </Tooltip>
              {adminMoreOpen && (
                <div className="absolute bottom-10 right-0 flex min-w-[180px] flex-col gap-1 rounded-lg border border-(--border) bg-(--paper) p-2 shadow-xl">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="justify-start text-xs"
                    onClick={() => {
                      fileInputRef.current?.click();
                      setAdminMoreOpen(false);
                    }}
                  >
                    <Upload className="mr-1.5 size-3.5" aria-hidden />
                    {t('adminImportJson')}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="justify-start text-xs"
                    onClick={() => {
                      actions.onCopy();
                      setAdminMoreOpen(false);
                    }}
                  >
                    <Clipboard className="mr-1.5 size-3.5" aria-hidden />
                    {t('adminCopyJson')}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="justify-start text-xs"
                    onClick={() => {
                      actions.onDownload();
                      setAdminMoreOpen(false);
                    }}
                  >
                    <Save className="mr-1.5 size-3.5" aria-hidden />
                    {t('adminDownloadJson')}
                  </Button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {isAdmin && (
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleFileChange}
        />
      )}
      <PdfPreviewDialog open={pdfOpen} onClose={closePdfPreview} />
    </>
  );
}
