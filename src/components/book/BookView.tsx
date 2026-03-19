'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';
import { useLocaleRoutes } from '@/lib/i18n/context';
import { isSectionId } from '@/lib/constants/sections';
import type { SectionId } from '@/lib/constants/sections';
import { BookSpread } from './BookSpread';
import { BookPage } from './BookPage';
import { HelpSpread } from './HelpSpread';
import { KinshipSpread } from './KinshipSpread';
import { HistorySection } from './HistorySection';
import { PhotosSection } from './PhotosSection';
import { PersonsSection } from './PersonsSection';
import { FamilyTree } from '@/components/tree/FamilyTree';
import { getPersonById } from '@/lib/data/persons';
import { PersonDetailPanel } from '@/components/tree/PersonDetailPanel';
import { BOOK_SPREAD_SHADOW_MD } from '@/lib/constants/theme';

export function BookView() {
  const searchParams = useSearchParams();
  const { t } = useLocaleRoutes();
  const [selectedTreePersonId, setSelectedTreePersonId] = useState<string | null>(null);
  const closePersonPanel = useCallback(() => setSelectedTreePersonId(null), []);
  const sectionParam = searchParams.get('section') ?? '';
  const section: SectionId = isSectionId(sectionParam) ? sectionParam : 'tree';

  if (section === 'help') {
    return <HelpSpread />;
  }

  if (section === 'kinship') {
    return <KinshipSpread />;
  }

  if (section === 'tree') {
    const selectedTreePerson =
      selectedTreePersonId !== null ? getPersonById(selectedTreePersonId) : null;
    return (
      <>
        <div className={selectedTreePerson ? 'hidden' : 'flex min-w-0 flex-1 flex-col overflow-hidden min-h-[calc(100vh-10rem)] md:min-h-0 md:flex-none'}>
          {/* Mobile: full height vertical block, no book aspect. Desktop: book spread proportions (sized by aspect + max-h) */}
          <div
            className={
              `flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:max-h-[calc(100vh-4rem)] md:max-w-[calc((100vh-6rem)*296/210)] md:aspect-[296/210] md:min-h-[320px] md:flex-initial md:rounded-lg ${BOOK_SPREAD_SHADOW_MD}`
            }
          >
            <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
              <BookPage className="flex h-full min-h-0 min-w-0 flex-col p-2 sm:p-5 md:p-6">
                <h1 className="book-serif mb-2 hidden border-b border-(--ink-muted)/35 pb-0 text-center text-lg font-semibold text-(--ink) md:block md:text-2xl lg:text-3xl">
                  {t('treeTitle')}
                </h1>
                <FamilyTree onPersonClick={setSelectedTreePersonId} />
              </BookPage>
            </div>
          </div>
        </div>
        {selectedTreePerson && (
          <PersonDetailPanel
            key={selectedTreePerson.id}
            person={selectedTreePerson}
            onClose={closePersonPanel}
            onSelectPerson={setSelectedTreePersonId}
            inline
          />
        )}
      </>
    );
  }

  if (section === 'history') {
    return <HistorySection />;
  }

  if (section === 'photos') {
    return <PhotosSection />;
  }

  if (section === 'persons') {
    return <PersonsSection />;
  }

  return null;
}
