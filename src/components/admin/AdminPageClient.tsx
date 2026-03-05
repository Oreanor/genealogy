'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from '@/lib/i18n/context';
import { useAdminToolbar } from '@/lib/contexts/AdminToolbarContext';
import type { AdminTabId } from './AdminTabs';
import { AdminTabs } from './AdminTabs';
import { AdminPersonsTable } from './AdminPersonsTable';
import { AdminTextsTab } from './AdminTextsTab';
import { AdminPhotosTab } from './AdminPhotosTab';
import { Dialog } from '@/components/ui/molecules/Dialog';
import { ADMIN_TAB_COOKIE } from '@/lib/constants/storage';
import type { Person } from '@/lib/types/person';
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
  rootPersonId: string;
  persons: Person[];
  photos: PhotoEntry[];
  history: HistoryEntry[];
}

interface AdminPageClientProps {
  rootPersonId: string;
  persons: Person[];
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
  rootPersonId: initialRootPersonId,
  persons,
  photos,
  history: initialHistory,
  initialTab,
}: AdminPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations();
  const [rootPersonId, setRootPersonId] = useState(initialRootPersonId);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const dataRef = useRef<AdminDataSections>({
    rootPersonId: initialRootPersonId,
    persons,
    photos,
    history: initialHistory,
  });

  useEffect(() => {
    dataRef.current = { ...dataRef.current, rootPersonId };
  }, [rootPersonId]);

  const getCombinedJson = useCallback(() => toCombinedJson(dataRef.current), []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(getCombinedJson());
      setAlertMessage(t('adminCopied'));
    } catch {
      setAlertMessage(t('adminCopyFailed'));
    }
  }, [getCombinedJson, t]);

  const handleDownload = useCallback(() => {
    downloadFile(ADMIN_DATA_FILENAME, getCombinedJson());
    setAlertMessage(t('adminDownloaded'));
  }, [getCombinedJson, t]);

  const handleSelectTab = useCallback(
    (id: AdminTabId) => {
      setTabCookie(id);
      const url = `${pathname ?? ''}?tab=${id}`;
      router.replace(url, { scroll: false });
    },
    [router, pathname]
  );

  const { setActions } = useAdminToolbar();
  useEffect(() => {
    setActions({ onCopy: handleCopy, onDownload: handleDownload });
    return () => setActions(null);
  }, [setActions, handleCopy, handleDownload]);

  return (
    <div className="space-y-4">
      <AdminTabs active={initialTab} onSelect={handleSelectTab}>
        <div className={initialTab === 'persons' ? '' : 'hidden'}>
          <AdminPersonsTable
            rootPersonId={rootPersonId}
            initialPersons={persons}
            onDataChange={(p) => {
              dataRef.current = { ...dataRef.current, persons: p };
            }}
            onRootChange={(id) => {
              setRootPersonId(id);
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
      {alertMessage !== null && (
        <Dialog
          open
          onClose={() => setAlertMessage(null)}
          variant="alert"
          confirmLabel={t('dialogOk')}
        >
          {alertMessage}
        </Dialog>
      )}
    </div>
  );
}
