import { BookLayout } from '@/components/book';
import { getPersons } from '@/lib/data/persons';
import { getPages } from '@/lib/data/pages';
import { getPhotos } from '@/lib/data/photos';
import { getHistoryEntries } from '@/lib/data/history';
import { getMessages } from '@/lib/i18n/messages';
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
  const { locale } = await params;
  const { tab } = await searchParams;
  const initialTab = parseTab(tab);
  const messages = getMessages(locale);
  const [persons, pages, photos, history] = [
    getPersons(),
    getPages(),
    getPhotos(),
    getHistoryEntries(),
  ];
  return (
    <BookLayout alignTop>
      <div className="w-full max-w-[95%] p-4 sm:max-w-[92%] md:max-w-[94%]">
        <h1 className="mb-4 text-2xl font-semibold text-[var(--ink)]">
          {messages.adminTitle ?? 'Admin'}
        </h1>
        <AdminPageClient
          persons={persons}
          pages={pages}
          photos={photos}
          history={history}
          initialTab={initialTab}
        />
      </div>
    </BookLayout>
  );
}
