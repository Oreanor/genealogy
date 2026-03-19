'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';
import { useLocaleRoutes } from '@/lib/i18n/context';
import { isSectionId } from '@/lib/constants/sections';
import type { SectionId } from '@/lib/constants/sections';
import { BookPage } from './BookPage';
import { HelpSpread } from './HelpSpread';
import { HistorySection } from './HistorySection';
import { PhotosSection } from './PhotosSection';
import { PersonsSection } from './PersonsSection';
import { FamilyTree } from '@/components/tree/FamilyTree';
import { getPersonById } from '@/lib/data/persons';
import { PersonDetailPanel } from '@/components/tree/PersonDetailPanel';
import { BOOK_SPREAD_SHADOW_MD } from '@/lib/constants/theme';
import { Button } from '@/components/ui/atoms/Button';
import { getKinship } from '@/lib/utils/kinship';

export function BookView() {
  const searchParams = useSearchParams();
  const { t } = useLocaleRoutes();
  const [selectedTreePersonId, setSelectedTreePersonId] = useState<string | null>(null);
  const closePersonPanel = useCallback(() => setSelectedTreePersonId(null), []);
  const [kinshipPickMode, setKinshipPickMode] = useState(false);
  const [kinshipSelectedIds, setKinshipSelectedIds] = useState<string[]>([]);
  const [treeMode, setTreeMode] = useState<'ancestors' | 'descendants'>('ancestors');
  const sectionParam = searchParams.get('section') ?? '';
  const section: SectionId = isSectionId(sectionParam) ? sectionParam : 'tree';

  if (section === 'help') {
    return <HelpSpread />;
  }

  if (section === 'tree') {
    const selectedTreePerson =
      selectedTreePersonId !== null ? getPersonById(selectedTreePersonId) : null;

    const toggleKinshipPickMode = () => {
      setKinshipPickMode((v) => {
        const next = !v;
        if (next) {
          // When entering kinship pick mode, lock the panel and selection state.
          setSelectedTreePersonId(null);
          setKinshipSelectedIds([]);
        } else {
          setKinshipSelectedIds([]);
        }
        return next;
      });
    };

    const resetKinshipSelection = () => {
      setKinshipSelectedIds([]);
    };

    const onKinshipNodeClick = (personId: string) => {
      setKinshipSelectedIds((prev) => {
        if (prev.length === 0) return [personId];
        if (prev.length === 1) {
          return prev[0] === personId ? [] : [prev[0], personId];
        }

        // prev.length === 2
        if (prev[0] === personId) return [prev[1]];
        if (prev[1] === personId) return [prev[0]];
        // Third distinct: replace second, keep first.
        return [prev[0], personId];
      });
    };

    const kinshipHintById = (() => {
      if (kinshipSelectedIds.length !== 2) return {};
      const [a, b] = kinshipSelectedIds;
      const resAB = getKinship(a, b);
      const resBA = getKinship(b, a);
      return {
        // "наоборот": показываем, кем B является для A, и кем A является для B
        [a]: resBA ? t(resBA.key) : t('kinshipNoRelation'),
        [b]: resAB ? t(resAB.key) : t('kinshipNoRelation'),
      } as Record<string, string>;
    })();

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
              <BookPage className="relative flex h-full min-h-0 min-w-0 flex-col p-2 sm:p-5 md:p-6">
                <h1 className="book-serif mb-2 hidden border-b border-(--ink-muted)/35 pb-0 text-center text-lg font-semibold text-(--ink) md:block md:text-2xl lg:text-3xl">
                  {t('treeTitle')}
                </h1>
                <FamilyTree
                  onPersonClick={setSelectedTreePersonId}
                  kinshipMode={kinshipPickMode}
                  kinshipSelectedIds={kinshipSelectedIds}
                  onKinshipSelect={onKinshipNodeClick}
                  kinshipHintById={kinshipHintById}
                  treeMode={treeMode}
                />
                <div className="absolute bottom-3 right-3 z-20 flex items-center gap-3">
                  {kinshipPickMode && (
                    <>
                      <div className="text-[12px] font-semibold leading-tight text-(--ink)">
                        {t('kinshipSelectTwoHint')}
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={resetKinshipSelection}
                        disabled={kinshipSelectedIds.length === 0}
                        className="disabled:opacity-80"
                      >
                        {t('kinshipReset')}
                      </Button>
                    </>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={toggleKinshipPickMode}
                  >
                    {kinshipPickMode ? t('back') : t('chapters_kinship')}
                  </Button>
                </div>
                <div className="absolute bottom-3 left-3 z-20">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setTreeMode((m) => (m === 'ancestors' ? 'descendants' : 'ancestors'))}
                  >
                    {treeMode === 'ancestors' ? t('treeModeDescendants') : t('treeModeAncestors')}
                  </Button>
                </div>
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
