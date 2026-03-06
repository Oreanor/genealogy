'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
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

export function BookView() {
  const searchParams = useSearchParams();
  const { t } = useLocaleRoutes();
  const [selectedTreePersonId, setSelectedTreePersonId] = useState<string | null>(null);
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
        <BookSpread
          fullWidth={
            <BookPage className="p-3 sm:p-5 md:p-6">
              <h1 className="book-serif mb-2 text-center text-xl font-semibold text-(--ink) md:text-2xl lg:text-3xl">
                {t('treeTitle')}
              </h1>
              <FamilyTree onPersonClick={setSelectedTreePersonId} />
            </BookPage>
          }
        />
        {selectedTreePerson && (
          <PersonDetailPanel
            key={selectedTreePerson.id}
            person={selectedTreePerson}
            onClose={() => setSelectedTreePersonId(null)}
            onSelectPerson={setSelectedTreePersonId}
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
