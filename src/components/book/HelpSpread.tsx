'use client';

import { useLocaleRoutes } from '@/lib/i18n/context';
import { bookHelpSectionTitleMessageKey, resolveBookHelpTargetSection } from '@/lib/constants/sections';
import {
  BOOK_HELP_CONTEXTUAL_KEYS_SPREAD,
  TREE_HELP_STEP_MESSAGE_KEYS,
} from '@/lib/utils/bookHelpContent';
import { BookSpread } from './BookSpread';

interface HelpSpreadProps {
  section?: string;
}

/**
 * Help content as a two-column flow inside a standard BookSpread.
 * CSS columns handle the split so no bullet gets clipped at the page edge.
 */
export function HelpSpread({ section }: HelpSpreadProps) {
  const { t } = useLocaleRoutes();
  const targetSection = resolveBookHelpTargetSection(section);
  const targetTitleKey = bookHelpSectionTitleMessageKey(targetSection);
  const contextualHelpKeys = BOOK_HELP_CONTEXTUAL_KEYS_SPREAD;

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
                {TREE_HELP_STEP_MESSAGE_KEYS.map((key) => (
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
