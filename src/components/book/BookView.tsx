'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { useLocaleRoutes } from '@/lib/i18n/context';
import { isSectionId } from '@/lib/constants/sections';
import type { SectionId } from '@/lib/constants/sections';
import { BookPage } from './BookPage';
import { HelpSpread } from './HelpSpread';
import { HistorySection } from './HistorySection';
import { PhotosSection } from './PhotosSection';
import { PersonsSection } from './PersonsSection';
import { UnifiedMapSection } from './UnifiedMapSection';
import { FamilySearchPersonsSection } from './FamilySearchPersonsSection';
import { FamilyTree } from '@/components/tree/FamilyTree';
import { getPersonById } from '@/lib/data/persons';
import { PersonDetailPanel } from '@/components/tree/PersonDetailPanel';
import { BOOK_SPREAD_SHADOW_MD } from '@/lib/constants/theme';
import { Button } from '@/components/ui/atoms/Button';
import { getKinship } from '@/lib/utils/kinship';
import { getRootPersonId } from '@/lib/data/root';
import { useRootPersonId, useSetRootPersonId } from '@/lib/contexts/RootPersonContext';

const EMPTY_KINSHIP_HINT_BY_ID: Record<string, string> = {};

export function BookView() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLocaleRoutes();
  const currentRootPersonId = useRootPersonId();
  const setRootPersonId = useSetRootPersonId();
  const defaultRootPersonId = getRootPersonId();
  const selectedTreePersonId = searchParams.get('treePerson');
  const updateTreePersonInUrl = useCallback(
    (personId: string | null) => {
      if (!pathname) return;
      const params = new URLSearchParams(searchParams.toString());
      if (personId) params.set('treePerson', personId);
      else params.delete('treePerson');
      const next = params.toString();
      router.replace(`${pathname}${next ? `?${next}` : ''}`);
    },
    [pathname, router, searchParams]
  );
  const handleTreePersonSelect = useCallback(
    (personId: string) => {
      updateTreePersonInUrl(personId);
    },
    [updateTreePersonInUrl]
  );
  const closePersonPanel = useCallback(() => {
    updateTreePersonInUrl(null);
  }, [updateTreePersonInUrl]);
  const [kinshipPickMode, setKinshipPickMode] = useState(false);
  const [kinshipSelectedIds, setKinshipSelectedIds] = useState<string[]>([]);
  const [treeMode, setTreeMode] = useState<'ancestors' | 'descendants'>('ancestors');

  const toggleKinshipPickMode = useCallback(() => {
    const next = !kinshipPickMode;
    setKinshipPickMode(next);
    setKinshipSelectedIds([]);
    if (next) {
      updateTreePersonInUrl(null);
    }
  }, [kinshipPickMode, updateTreePersonInUrl]);

  const resetKinshipSelection = useCallback(() => {
    setKinshipSelectedIds([]);
  }, []);

  const resetTreeRoot = useCallback(() => {
    setRootPersonId(defaultRootPersonId);
  }, [defaultRootPersonId, setRootPersonId]);

  const onKinshipNodeClick = useCallback((personId: string) => {
    setKinshipSelectedIds((prev) => {
      if (prev.length === 0) return [personId];
      if (prev.length === 1) {
        return prev[0] === personId ? [] : [prev[0], personId];
      }
      if (prev[0] === personId) return [prev[1]];
      if (prev[1] === personId) return [prev[0]];
      return [prev[0], personId];
    });
  }, []);

  const kinshipHintById = useMemo(() => {
    if (kinshipSelectedIds.length !== 2) return EMPTY_KINSHIP_HINT_BY_ID;
    const [a, b] = kinshipSelectedIds;
    const resAB = getKinship(a, b);
    const resBA = getKinship(b, a);
    return {
      [a]: resBA ? t(resBA.key) : t('kinshipNoRelation'),
      [b]: resAB ? t(resAB.key) : t('kinshipNoRelation'),
    } as Record<string, string>;
  }, [kinshipSelectedIds, t]);
  const sectionParam = searchParams.get('section') ?? '';
  const section: SectionId = isSectionId(sectionParam) ? sectionParam : 'tree';
  const helpForParam = searchParams.get('for') ?? '';
  const resetRootLabel = t('treeResetRoot');
  const resetRootDisabledTitle = t('treeResetRootAlready');
  const isDefaultTreeRoot = currentRootPersonId === defaultRootPersonId;

  if (section === 'help') {
    return <HelpSpread section={helpForParam} />;
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
              <BookPage className="relative flex h-full min-h-0 min-w-0 flex-col p-2 sm:p-5 md:p-6">
                <h1 className="book-serif mb-2 hidden border-b border-(--ink-muted)/35 pb-0 text-center text-lg font-semibold text-(--ink) md:block md:text-2xl lg:text-3xl">
                  {t(
                    treeMode === 'ancestors'
                      ? 'treePageHeadingAncestors'
                      : 'treePageHeadingDescendants'
                  )}
                </h1>
                <div className="relative z-30 mb-2 flex items-start justify-between gap-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setTreeMode((m) => (m === 'ancestors' ? 'descendants' : 'ancestors'))}
                    className={
                      treeMode === 'descendants'
                        ? '!border-zinc-900 !bg-zinc-900 !text-white hover:!bg-zinc-800'
                        : ''
                    }
                  >
                    {treeMode === 'ancestors' ? t('treeModeDescendants') : t('treeModeAncestors')}
                  </Button>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={resetTreeRoot}
                      disabled={isDefaultTreeRoot}
                      title={isDefaultTreeRoot ? resetRootDisabledTitle : undefined}
                      className="disabled:opacity-80"
                    >
                      {resetRootLabel}
                    </Button>
                    {kinshipPickMode && (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={resetKinshipSelection}
                          disabled={kinshipSelectedIds.length === 0}
                          className="disabled:opacity-80"
                        >
                          {t('kinshipClearSelection')}
                        </Button>
                      </>
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={toggleKinshipPickMode}
                    >
                      {kinshipPickMode ? t('kinshipBackToView') : t('chapters_kinship')}
                    </Button>
                  </div>
                </div>
                <div className="relative z-0 min-h-0 flex-1 overflow-hidden rounded-md border border-(--ink-muted)/25 px-2 pb-2 md:px-3 md:pb-3">
                  <FamilyTree
                    onPersonClick={handleTreePersonSelect}
                    kinshipMode={kinshipPickMode}
                    kinshipSelectedIds={kinshipSelectedIds}
                    onKinshipSelect={onKinshipNodeClick}
                    kinshipHintById={kinshipHintById}
                    treeMode={treeMode}
                  />
                </div>
              </BookPage>
            </div>
          </div>
        </div>
        {selectedTreePerson && (
          <PersonDetailPanel
            person={selectedTreePerson}
            onClose={closePersonPanel}
            onSelectPerson={handleTreePersonSelect}
            inline
          />
        )}
      </>
    );
  }

  switch (section) {
    case 'history':
      return <HistorySection />;
    case 'photos':
      return <PhotosSection />;
    case 'map':
      return <UnifiedMapSection />;
    case 'familySearch':
      return <FamilySearchPersonsSection />;
    case 'persons':
      return <PersonsSection />;
    default:
      return null;
  }
}
