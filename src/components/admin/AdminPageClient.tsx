'use client';

import { useCallback, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from '@/lib/i18n/context';
import type { AdminTabId } from './AdminTabs';
import { AdminTabs } from './AdminTabs';
import { AdminPersonsTable } from './AdminPersonsTable';
import { AdminTextsTab } from './AdminTextsTab';
import { AdminPhotosTab } from './AdminPhotosTab';
import { ADMIN_TAB_COOKIE } from '@/lib/constants/storage';
import type { Person } from '@/lib/types/person';
import type { Page } from '@/lib/types/spread';
import type { HistoryEntry } from '@/lib/types/history';
import type { PhotoEntry } from '@/lib/types/photo';

function setTabCookie(tab: string) {
  try {
    document.cookie = `${ADMIN_TAB_COOKIE}=${tab};path=/;max-age=31536000`;
  } catch {
    // ignore
  }
}

const ADMIN_DATA_FILENAME = 'admin-data.json';

export interface AdminDataSections {
  persons: Person[];
  pages: Page[];
  photos: PhotoEntry[];
  history: HistoryEntry[];
}

interface AdminPageClientProps {
  persons: Person[];
  pages: Page[];
  photos: PhotoEntry[];
  history: HistoryEntry[];
  initialTab: AdminTabId;
}

function downloadFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function toCombinedJson(data: AdminDataSections): string {
  return JSON.stringify(data, null, 2);
}

export function AdminPageClient({
  persons,
  pages,
  photos,
  history: initialHistory,
  initialTab,
}: AdminPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations();
  const dataRef = useRef<AdminDataSections>({
    persons,
    pages,
    photos,
    history: initialHistory,
  });

  const getCombinedJson = useCallback(() => toCombinedJson(dataRef.current), []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(getCombinedJson());
      alert(t('adminCopied'));
    } catch {
      alert(t('adminCopyFailed'));
    }
  }, [getCombinedJson, t]);

  const handleDownload = useCallback(() => {
    downloadFile(ADMIN_DATA_FILENAME, getCombinedJson());
  }, [getCombinedJson]);

  const handleSelectTab = useCallback(
    (id: AdminTabId) => {
      setTabCookie(id);
      const url = `${pathname ?? ''}?tab=${id}`;
      router.replace(url, { scroll: false });
    },
    [router, pathname]
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={handleCopy}
          title={t('adminCopyJson')}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--paper-light)]"
          aria-label={t('adminCopyJson')}
        >
          <ClipboardIcon />
        </button>
        <button
          type="button"
          onClick={handleDownload}
          title={t('adminDownloadJson')}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--paper-light)]"
          aria-label={t('adminDownloadJson')}
        >
          <FloppyIcon />
        </button>
      </div>
      <AdminTabs active={initialTab} onSelect={handleSelectTab}>
        <div className={initialTab === 'persons' ? '' : 'hidden'}>
          <AdminPersonsTable
            initialPersons={persons}
            onDataChange={(p) => {
              dataRef.current = { ...dataRef.current, persons: p };
            }}
          />
        </div>
        <div className={initialTab === 'texts' ? '' : 'hidden'}>
          <AdminTextsTab
            initialHistory={initialHistory}
            persons={persons}
            onHistoryChange={(h) => {
              dataRef.current = { ...dataRef.current, history: h };
            }}
          />
        </div>
        <div className={initialTab === 'photos' ? '' : 'hidden'}>
          <AdminPhotosTab
            initialPhotos={photos}
            onDataChange={(p) => {
              dataRef.current = { ...dataRef.current, photos: p };
            }}
          />
        </div>
      </AdminTabs>
    </div>
  );
}

/** Иконка буфера обмена (два листочка) */
function ClipboardIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="8" y="4" width="12" height="16" rx="2" />
      <path d="M16 2H8a2 2 0 0 0-2 2v2h12V4a2 2 0 0 0-2-2z" />
    </svg>
  );
}

/** Иконка дискеты (сохранить) */
function FloppyIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}
