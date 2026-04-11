import { BookLayout } from '@/components/book';
import { getBundledPersons } from '@/lib/data/persons';
import { getPhotos } from '@/lib/data/photos';
import { getHistoryEntries } from '@/lib/data/history';
import { getRootPersonId } from '@/lib/data/root';
import { getPlaceFallbacks } from '@/lib/data/mapFallbacks';
import { getLineDynamics } from '@/lib/data/lineDynamics';
import { AdminPageClient } from '@/components/admin/AdminPageClient';
import type { AdminTabId } from '@/components/admin/AdminTabs';
import { ADMIN_TAB_IDS } from '@/lib/constants/storage';

function parseTab(tab: string | string[] | undefined): AdminTabId {
  const t = Array.isArray(tab) ? tab[0] : tab;
  return t && ADMIN_TAB_IDS.includes(t as AdminTabId) ? (t as AdminTabId) : 'persons';
}

interface AdminPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string | string[] }>;
}

export default async function AdminPage({ params, searchParams }: AdminPageProps) {
  await params;
  const { tab } = await searchParams;
  const initialTab = parseTab(tab);
  const [persons, photos, history, placeFallbacks, lineDynamics] = [
    getBundledPersons(),
    getPhotos({ includeHidden: true }),
    getHistoryEntries({ includeHidden: true }),
    getPlaceFallbacks(),
    getLineDynamics(),
  ];
  const rootPersonId = getRootPersonId();
  return (
    <BookLayout alignTop>
      <div className="w-full max-w-[100%] p-4 sm:max-w-[100%] md:max-w-[100%]">
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
  );
}
