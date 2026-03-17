'use client';

import { useCallback, useState, type ReactNode } from 'react';
import { useTranslations } from '@/lib/i18n/context';
import { ADMIN_TAB_IDS, type AdminTabId } from '@/lib/constants/storage';
import { HelpCircle } from 'lucide-react';
import { AdminHelpDialog } from './AdminHelpDialog';

export type { AdminTabId };

interface AdminTabsProps {
  active: AdminTabId;
  onSelect: (id: AdminTabId) => void;
  children: ReactNode;
}

export function AdminTabs({ active, onSelect, children }: AdminTabsProps) {
  const t = useTranslations();
  const [helpOpen, setHelpOpen] = useState(false);
  const handleTabClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const id = (e.currentTarget as HTMLButtonElement).dataset.tabid as AdminTabId;
      if (id) onSelect(id);
    },
    [onSelect]
  );
  return (
    <div>
      {/* Верхние вкладки скрыты на мобиле, показываем только на md+ */}
      <nav className="hidden flex-wrap items-end justify-between gap-1 border-b border-(--border) md:flex">
        <div className="flex flex-wrap gap-1">
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
        <button
          type="button"
          onClick={() => setHelpOpen(true)}
          className="flex items-center gap-1.5 rounded-t-md bg-(--nav-btn) px-3 py-1.5 text-sm font-medium text-(--nav-btn-ink) shadow-md transition-colors hover:bg-(--nav-btn-hover) md:px-4 md:py-2"
          aria-label={t('adminHelp')}
        >
          <HelpCircle className="size-4" aria-hidden />
          {t('adminHelp')}
        </button>
      </nav>
      <div className="pt-4">
        {children}
      </div>
      {helpOpen && (
        <AdminHelpDialog activeTab={active} onClose={() => setHelpOpen(false)} />
      )}
    </div>
  );
}
