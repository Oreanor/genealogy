import type { Metadata } from 'next';
import { BookLayout } from '@/components/book';
import { StorageGate } from '@/components/StorageGate';
import { getBundledPersons } from '@/lib/data/persons';
import { getPhotos } from '@/lib/data/photos';
import { getHistoryEntries } from '@/lib/data/history';
import { getRootPersonId } from '@/lib/data/root';
import { getPlaceFallbacks } from '@/lib/data/mapFallbacks';
import { getLineDynamics } from '@/lib/data/lineDynamics';
import { AdminPageClient } from '@/components/admin/AdminPageClient';
import type { AdminTabId } from '@/components/admin/AdminTabs';
import { ADMIN_TAB_IDS } from '@/lib/constants/storage';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

function parseTab(tab: string | string[] | undefined): AdminTabId {
  const t = Array.isArray(tab) ? tab[0] : tab;
  return t && ADMIN_TAB_IDS.includes(t as AdminTabId) ? (t as AdminTabId) : 'persons';
}

interface AdminPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string | string[] }>;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const { tab } = await searchParams;
  const initialTab = parseTab(tab);
  const persons = getBundledPersons();
  const photos = getPhotos({ includeHidden: true });
  const history = getHistoryEntries({ includeHidden: true });
  const placeFallbacks = getPlaceFallbacks();
  const lineDynamics = getLineDynamics();
  const rootPersonId = getRootPersonId();
  return (
    // Admin reads localStorage while rendering: client-only, as before.
    <StorageGate>
      <BookLayout alignTop>
        <div className="w-full max-w-full p-4">
          <AdminPageClient
            rootPersonId={rootPersonId}
            persons={persons}
            photos={photos}
            history={history}
            placeFallbacks={placeFallbacks}
            lineDynamics={lineDynamics}
            initialTab={initialTab}
          />
        </div>
      </BookLayout>
    </StorageGate>
  );
}
