'use client';

import { PersonCard } from '@/components/content/PersonCard';
import { PageContentRenderer } from '@/components/content/PageContentRenderer';
import { HistoryContentRenderer } from '@/components/content/HistoryContentRenderer';
import { FamilyTree } from '@/components/tree/FamilyTree';
import { NavButton } from '@/components/ui/NavButton';
import { CHAPTER_IDS } from '@/lib/constants/chapters';
import { useLocaleRoutes } from '@/lib/i18n/context';
import { getPersonById, getPersons } from '@/lib/data/persons';
import type { PageContent, Spread } from '@/lib/types/spread';
import { useSpreadState } from '@/hooks/useSpreadState';
import { useRouter, useSearchParams } from 'next/navigation';
import { BookPage } from './BookPage';
import { BookSpread } from './BookSpread';

interface SpreadNavigationProps {
  readonly chapterSlug: string;
  readonly chapterTitle: string;
  readonly spreads: Spread[];
}

export function SpreadNavigation({
  chapterSlug,
  chapterTitle,
  spreads,
}: SpreadNavigationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, routes } = useLocaleRoutes();
  const defaultState = useSpreadState(spreads.length);
  const personId = searchParams.get('id');
  const isPersony = chapterSlug === CHAPTER_IDS.PERSONS;

  const persons = isPersony ? getPersons() : [];
  const personIndex = personId ? persons.findIndex((p) => p.id === personId) : -1;
  const safeIndex = isPersony
    ? Math.max(0, Math.min(personIndex >= 0 ? personIndex : defaultState.safeIndex, spreads.length - 1))
    : defaultState.safeIndex;
  const hasPrev = isPersony ? safeIndex > 0 : defaultState.hasPrev;
  const hasNext = isPersony ? safeIndex < spreads.length - 1 : defaultState.hasNext;

  const spread = spreads[safeIndex];
  const personForSpread = spread?.left?.personId ? getPersonById(spread.left.personId) : null;

  const goPrev = () => {
    if (isPersony && persons[safeIndex - 1]) {
      router.push(routes.person(persons[safeIndex - 1].id));
    } else {
      router.push(routes.chapterSpread(chapterSlug));
    }
  };

  const goNext = () => {
    if (isPersony && persons[safeIndex + 1]) {
      router.push(routes.person(persons[safeIndex + 1].id));
    } else {
      router.push(routes.chapterSpread(chapterSlug));
    }
  };

  if (!spread) {
    return null;
  }

  const isTreeSpread = spread.left?.tree === true;
  const isPersonSpread = !!spread.left?.personId && personForSpread;

  const renderPage = (content: PageContent, isLeft: boolean) => {
    if (isPersonSpread && isLeft) {
      return (
        <BookPage>
          <h1 className="text-2xl font-semibold text-[var(--ink)] md:text-3xl">
            {chapterTitle}
          </h1>
          <div className="mt-6 flex-1">
            <PersonCard person={personForSpread} />
          </div>
        </BookPage>
      );
    }
    const hasContent =
      (content.blocks && content.blocks.length > 0) ||
      !!content.image?.src ||
      (content.historyEntries && content.historyEntries.length > 0);

    return (
      <BookPage>
        {isLeft && safeIndex === 0 && (
          <h1 className="text-2xl font-semibold text-[var(--ink)] md:text-3xl">
            {chapterTitle}
          </h1>
        )}
        <div className="mt-6 flex-1">
          {content.historyEntries && content.historyEntries.length > 0 ? (
            <HistoryContentRenderer entries={content.historyEntries} />
          ) : hasContent ? (
            <PageContentRenderer content={content} />
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-[var(--ink-muted)]">
                {t('spreadPage', {
                  n: String(safeIndex + 1),
                  side: isLeft ? t('spreadLeft') : t('spreadRight'),
                })}
              </p>
            </div>
          )}
        </div>
      </BookPage>
    );
  };

  return (
    <div className="relative w-full">
      <BookSpread
        left={renderPage(spread.left, true)}
        right={renderPage(spread.right, false)}
        fullWidth={
          isTreeSpread ? (
            <BookPage>
              <h1 className="mb-2 text-center text-xl font-semibold text-[var(--ink)]">
                {t('treeTitle')}
              </h1>
              <FamilyTree />
            </BookPage>
          ) : undefined
        }
      />

      {spreads.length > 1 && (
        <div className="absolute bottom-2 left-2 right-2 z-20 flex items-center justify-between pointer-events-none">
          <div className="pointer-events-auto">
            <NavButton onClick={goPrev} disabled={!hasPrev}>
              ← {t('back')}
            </NavButton>
          </div>
          <span className="text-sm font-medium text-[var(--ink)] drop-shadow-sm">
            {safeIndex + 1} / {spreads.length}
          </span>
          <div className="pointer-events-auto">
            <NavButton onClick={goNext} disabled={!hasNext}>
              {t('next')} →
            </NavButton>
          </div>
        </div>
      )}
    </div>
  );
}
