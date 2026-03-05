'use client';

import { useCallback, type ReactNode } from 'react';
import { useTranslations } from '@/lib/i18n/context';
import { ADMIN_TAB_IDS, type AdminTabId } from '@/lib/constants/storage';

export type { AdminTabId };

interface AdminTabsProps {
  active: AdminTabId;
  onSelect: (id: AdminTabId) => void;
  children: ReactNode;
}

export function AdminTabs({ active, onSelect, children }: AdminTabsProps) {
  const t = useTranslations();
  const handleTabClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const id = (e.currentTarget as HTMLButtonElement).dataset.tabid as AdminTabId;
      if (id) onSelect(id);
    },
    [onSelect]
  );
  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-[var(--border)] pb-2">
        {ADMIN_TAB_IDS.map((id) => (
          <button
            key={id}
            type="button"
            data-tabid={id}
            onClick={handleTabClick}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              active === id
                ? 'bg-[var(--accent)] text-[var(--nav-btn-ink)]'
                : 'bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--paper-light)]'
            }`}
          >
            {t(id === 'persons' ? 'adminTabPersons' : id === 'texts' ? 'chapters_history' : 'adminTabPhotos')}
          </button>
        ))}
      </div>
      {children}
    </div>
  );
}
