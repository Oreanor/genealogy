'use client';

import { useCallback, useRef, useState, type ReactNode } from 'react';
import { useLocaleRoutes } from '@/lib/i18n/context';
import { ADMIN_TAB_IDS, type AdminTabId } from '@/lib/constants/storage';
import {
  BookOpen,
  Clipboard,
  HelpCircle,
  MoreHorizontal,
  Save,
  Upload,
} from 'lucide-react';
import { AdminHelpDialog } from './AdminHelpDialog';
import { Tooltip } from '@/components/ui/Tooltip';
import { Button } from '@/components/ui/atoms/Button';
import { PageColorPicker } from '@/components/ui/PageColorPickerClient';
import { LocaleSwitcher } from '@/components/ui/LocaleSwitcher';
import { useAdminToolbar } from '@/lib/contexts/AdminToolbarContext';
import { SquareIconButton, SquareIconLink } from '@/components/ui/SquareIconButton';

export type { AdminTabId };

interface AdminTabsProps {
  active: AdminTabId;
  onSelect: (id: AdminTabId) => void;
  onAddPersonRow?: (() => void) | null;
  onDeleteSelectedRows?: (() => void) | null;
  deleteSelectedDisabled?: boolean;
  onAddTextEntry?: (() => void) | null;
  onRefreshPhotos?: (() => void) | null;
  onTogglePhotosVisibility?: (() => void) | null;
  onDeleteAllPhotos?: (() => void) | null;
  photosToggleLabel?: string;
  children: ReactNode;
}

export function AdminTabs({
  active,
  onSelect,
  onAddPersonRow = null,
  onDeleteSelectedRows = null,
  deleteSelectedDisabled = true,
  onAddTextEntry = null,
  onRefreshPhotos = null,
  onTogglePhotosVisibility = null,
  onDeleteAllPhotos = null,
  photosToggleLabel = '',
  children,
}: AdminTabsProps) {
  const { t, routes } = useLocaleRoutes();
  const [helpOpen, setHelpOpen] = useState(false);
  const { actions } = useAdminToolbar();
  const [adminMoreOpen, setAdminMoreOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTabClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const id = (e.currentTarget as HTMLButtonElement).dataset.tabid as AdminTabId;
      if (id) onSelect(id);
    },
    [onSelect]
  );

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
    <div>
      {/* Верхние вкладки скрыты на мобиле, показываем только на md+ */}
      <nav className="relative z-50 hidden flex-wrap items-end justify-between gap-1 border-b border-(--border) md:-mt-3 md:flex">
        <div className="flex flex-wrap items-end gap-1">
          {ADMIN_TAB_IDS.map((id) => (
            <button
              key={id}
              type="button"
              data-tabid={id}
              onClick={handleTabClick}
              className={`rounded-t-md px-4 py-2 text-sm font-medium shadow-sm transition-colors ${
                active === id
                  ? 'bg-(--nav-btn-hover) text-(--nav-btn-ink) -mb-px border-b border-(--nav-btn-hover)'
                  : 'bg-(--nav-btn) text-(--nav-btn-ink) hover:bg-(--nav-btn-hover)'
              }`}
            >
              {t(id === 'persons' ? 'adminTabPersons' : id === 'texts' ? 'chapters_history' : 'adminTabPhotos')}
            </button>
          ))}
        </div>
        <div className="relative z-50 flex flex-wrap items-end justify-end gap-1">
          <div className="mr-4 flex items-end gap-1">
            {active === 'persons' && onAddPersonRow && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onAddPersonRow}
                className="mb-0.5"
              >
                {t('adminAddRow')}
              </Button>
            )}
            {active === 'persons' && onDeleteSelectedRows && (
              <Button
                variant="danger"
                size="sm"
                onClick={onDeleteSelectedRows}
                disabled={deleteSelectedDisabled}
                className="mb-0.5"
              >
                {t('adminDeleteRows')}
              </Button>
            )}
            {active === 'texts' && onAddTextEntry && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onAddTextEntry}
                className="mb-0.5"
              >
                + {t('adminAddEntry')}
              </Button>
            )}
            {active === 'photos' && onRefreshPhotos && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onRefreshPhotos}
                className="mb-0.5"
              >
                {t('adminRefreshList')}
              </Button>
            )}
            {active === 'photos' && onTogglePhotosVisibility && photosToggleLabel && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onTogglePhotosVisibility}
                className="mb-0.5"
              >
                {photosToggleLabel}
              </Button>
            )}
            {active === 'photos' && onDeleteAllPhotos && (
              <Button
                variant="danger"
                size="sm"
                onClick={onDeleteAllPhotos}
                className="mb-0.5"
              >
                {t('adminDeleteAll')}
              </Button>
            )}
            {actions && (
              <div className="relative shrink-0">
                <Tooltip label={t('adminMoreActions') ?? 'JSON'} side="bottom">
                  <Button
                    variant="secondary"
                    size="sm"
                    aria-label={t('adminMoreActions') ?? 'JSON'}
                    onClick={() => setAdminMoreOpen((v) => !v)}
                    className="mb-0.5 inline-flex items-center gap-1.5"
                  >
                    <MoreHorizontal className="size-4" aria-hidden />
                    <span>JSON</span>
                  </Button>
                </Tooltip>
                {adminMoreOpen && (
                  <div className="absolute right-0 top-full z-30 mt-2 min-w-[180px] rounded-lg border border-(--border) bg-(--paper) p-2 shadow-xl">
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
                      className="mt-1 justify-start text-xs"
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
                      className="mt-1 justify-start text-xs"
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
            )}
          </div>
          <Tooltip label={t('tooltipToBook')} side="bottom">
            <SquareIconLink
              href={routes.home}
              label={t('tooltipToBook')}
              tone="inverse"
            >
              <BookOpen className="size-[18px]" aria-hidden />
            </SquareIconLink>
          </Tooltip>

          <Tooltip label={t('tooltipPageColor')} side="bottom">
            <PageColorPicker />
          </Tooltip>

          <Tooltip label={t('tooltipLanguage')} side="bottom">
            <LocaleSwitcher />
          </Tooltip>

          <Tooltip label={t('adminHelp')} side="bottom">
            <SquareIconButton
              onClick={() => setHelpOpen(true)}
              label={t('adminHelp')}
            >
              <HelpCircle className="size-[18px]" aria-hidden />
            </SquareIconButton>
          </Tooltip>

        </div>
      </nav>
      {actions && (
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleFileChange}
        />
      )}
      <div className="pt-2 pb-24 md:pb-0">
        {children}
      </div>
      <div className="fixed inset-x-2 bottom-[calc(env(safe-area-inset-bottom)+52px)] z-40 flex flex-wrap items-center gap-1 rounded-lg border border-(--border) bg-(--book-bg) p-1.5 shadow-lg md:hidden">
        {active === 'persons' && onAddPersonRow && (
          <Button variant="secondary" size="sm" onClick={onAddPersonRow}>
            {t('adminAddRow')}
          </Button>
        )}
        {active === 'persons' && onDeleteSelectedRows && (
          <Button
            variant="danger"
            size="sm"
            onClick={onDeleteSelectedRows}
            disabled={deleteSelectedDisabled}
          >
            {t('adminDeleteRows')}
          </Button>
        )}
        {active === 'texts' && onAddTextEntry && (
          <Button variant="secondary" size="sm" onClick={onAddTextEntry}>
            + {t('adminAddEntry')}
          </Button>
        )}
        {active === 'photos' && onRefreshPhotos && (
          <Button variant="secondary" size="sm" onClick={onRefreshPhotos}>
            {t('adminRefreshList')}
          </Button>
        )}
        {active === 'photos' && onTogglePhotosVisibility && photosToggleLabel && (
          <Button variant="secondary" size="sm" onClick={onTogglePhotosVisibility}>
            {photosToggleLabel}
          </Button>
        )}
        {active === 'photos' && onDeleteAllPhotos && (
          <Button variant="danger" size="sm" onClick={onDeleteAllPhotos}>
            {t('adminDeleteAll')}
          </Button>
        )}
        {actions && (
          <div className="relative ml-auto shrink-0">
            <Button
              variant="secondary"
              size="sm"
              aria-label={t('adminMoreActions') ?? 'JSON'}
              onClick={() => setAdminMoreOpen((v) => !v)}
              className="inline-flex items-center gap-1.5"
            >
              <MoreHorizontal className="size-4" aria-hidden />
              <span>JSON</span>
            </Button>
            {adminMoreOpen && (
              <div className="absolute right-0 top-full z-30 mt-2 min-w-[180px] rounded-lg border border-(--border) bg-(--paper) p-2 shadow-xl">
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
                  className="mt-1 justify-start text-xs"
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
                  className="mt-1 justify-start text-xs"
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
        )}
      </div>
      {helpOpen && (
        <AdminHelpDialog activeTab={active} onClose={() => setHelpOpen(false)} />
      )}
    </div>
  );
}
