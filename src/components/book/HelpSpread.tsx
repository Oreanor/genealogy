'use client';

import { useLocaleRoutes } from '@/lib/i18n/context';
import type { SectionId } from '@/lib/constants/sections';
import { BookSpread } from './BookSpread';

const STEP_KEYS = [
  'treeHelpStep1', 'treeHelpStep2', 'treeHelpStep3', 'treeHelpStep4',
  'treeHelpStep5', 'treeHelpStep6', 'treeHelpStep7', 'treeHelpStep8',
];

const HELP_TARGETS: SectionId[] = ['tree', 'persons', 'history', 'photos', 'map'];

function isHelpTarget(value: string): value is SectionId {
  return HELP_TARGETS.includes(value as SectionId);
}

interface HelpSpreadProps {
  section?: string;
}

/**
 * Help content as a two-column flow inside a standard BookSpread.
 * CSS columns handle the split so no bullet gets clipped at the page edge.
 */
export function HelpSpread({ section }: HelpSpreadProps) {
  const { t } = useLocaleRoutes();
  const targetSection: SectionId = section && isHelpTarget(section) ? section : 'tree';
  const targetTitleKey =
    targetSection === 'tree'
      ? 'chapters_family-tree'
      : targetSection === 'persons'
        ? 'chapters_persons'
        : targetSection === 'history'
          ? 'chapters_history'
          : targetSection === 'photos'
            ? 'chapters_photos'
            : 'chapters_map';

  const contextualHelpKeys: Record<SectionId, string[]> = {
    tree: STEP_KEYS,
    persons: ['personsSearchPlaceholder', 'personsSelectHint', 'goToPerson'],
    history: ['historySearchPlaceholder', 'historySelectHint', 'personMentionedInStories'],
    photos: ['noPhotosYet', 'openFullscreen', 'photoToggleBack', 'lightboxShowLabels', 'lightboxHideLabels'],
    map: ['bookHelpMap1', 'bookHelpMap2', 'bookHelpMap3'],
    kinship: [],
    help: [],
  };

  return (
    <BookSpread
      fullWidth={
        <div
          className="h-full w-full overflow-y-auto bg-(--paper) p-6 sm:p-8 md:p-9 shadow-inner"
          style={{ columns: 2, columnGap: '2.5rem', columnRule: '1px solid var(--border-subtle)' }}
        >
          <h2 className="book-serif mb-5 hidden text-xl font-semibold text-(--ink) md:mb-5 md:block md:text-2xl">
            {`${t('chapters_help')}: ${t(targetTitleKey)}`}
          </h2>
          {targetSection === 'tree' ? (
            <>
              <p className="mb-6 text-base leading-relaxed text-(--ink)">
                {t('treeHelpIntro')}
              </p>
              <p className="mb-3 text-base font-medium text-(--ink)">
                {t('treeHelpStepsTitle')}
              </p>
              <ul className="list-inside list-disc space-y-2.5 text-left text-base text-(--ink)">
                {STEP_KEYS.map((key) => (
                  <li key={key} style={{ breakInside: 'avoid' }}>{t(key)}</li>
                ))}
              </ul>
              <p className="mt-6 text-base leading-relaxed text-(--ink)" style={{ breakInside: 'avoid' }}>
                {t('treeHelpData')}
              </p>
              <p className="mt-4 text-base leading-relaxed text-(--ink)" style={{ breakInside: 'avoid' }}>
                {t('treeHelpPerSectionBefore')}
                <strong>{t('treeHelpPerSectionBold')}</strong>
              </p>
            </>
          ) : (
            <>
              <p className="mb-3 text-base font-medium text-(--ink)">
                {t('treeHelpStepsTitle')}
              </p>
              <ul className="list-inside list-disc space-y-2.5 text-left text-base text-(--ink)">
                {contextualHelpKeys[targetSection].map((key) => (
                  <li key={key} style={{ breakInside: 'avoid' }}>{t(key)}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      }
    />
  );
}
