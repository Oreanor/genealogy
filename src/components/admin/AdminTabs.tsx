'use client';

import Link from 'next/link';
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

export type { AdminTabId };

interface AdminTabsProps {
  active: AdminTabId;
  onSelect: (id: AdminTabId) => void;
  children: ReactNode;
}

export function AdminTabs({ active, onSelect, children }: AdminTabsProps) {
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
      <nav className="hidden flex-wrap items-end justify-between gap-1 border-b border-(--border) md:flex">
        <div className="flex flex-wrap items-end gap-1">
          <Tooltip label={t('tooltipToBook')} side="right">
            <Link
              href={routes.home}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-(--border) bg-(--paper) text-(--ink) shadow-md transition-shadow hover:shadow-lg md:h-11 md:w-11"
              aria-label={t('tooltipToBook')}
            >
              <BookOpen className="size-[18px]" aria-hidden />
            </Link>
          </Tooltip>
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
        <div className="flex flex-wrap items-end justify-end gap-1">
          <button
            type="button"
            onClick={() => setHelpOpen(true)}
            className="flex items-center gap-1.5 rounded-t-md bg-(--nav-btn) px-3 py-1.5 text-sm font-medium text-(--nav-btn-ink) shadow-md transition-colors hover:bg-(--nav-btn-hover) md:px-4 md:py-2"
            aria-label={t('adminHelp')}
          >
            <HelpCircle className="size-4" aria-hidden />
            {t('adminHelp')}
          </button>

          <Tooltip label={t('tooltipPageColor')} side="bottom">
            <PageColorPicker />
          </Tooltip>

          <Tooltip label={t('tooltipLanguage')} side="bottom">
            <LocaleSwitcher />
          </Tooltip>

          {actions && (
            <div className="relative shrink-0">
              <Tooltip label={t('adminMoreActions') ?? 'Ещё'} side="bottom">
                <Button
                  variant="icon"
                  aria-label={t('adminMoreActions') ?? 'Ещё'}
                  onClick={() => setAdminMoreOpen((v) => !v)}
                >
                  <MoreHorizontal className="size-5" aria-hidden />
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
      <div className="pt-4">
        {children}
      </div>
      {helpOpen && (
        <AdminHelpDialog activeTab={active} onClose={() => setHelpOpen(false)} />
      )}
    </div>
  );
}
