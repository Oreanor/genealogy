'use client';

import { useLocaleRoutes } from '@/lib/i18n/context';
import { BookSpread } from './BookSpread';

const STEP_KEYS = [
  'treeHelpStep1', 'treeHelpStep2', 'treeHelpStep3', 'treeHelpStep4',
  'treeHelpStep5', 'treeHelpStep6', 'treeHelpStep7', 'treeHelpStep8',
];

/**
 * Help content as a two-column flow inside a standard BookSpread.
 * CSS columns handle the split so no bullet gets clipped at the page edge.
 */
export function HelpSpread() {
  const { t } = useLocaleRoutes();

  return (
    <BookSpread
      fullWidth={
        <div
          className="h-full w-full overflow-y-auto bg-[var(--paper)] p-6 sm:p-8 md:p-9 shadow-inner"
          style={{ columns: 2, columnGap: '2.5rem', columnRule: '1px solid var(--border-subtle)' }}
        >
          <h2 className="book-serif mb-5 text-xl font-semibold text-[var(--ink)] md:text-2xl">
            {t('adminHelp')}
          </h2>
          <p className="mb-6 text-base leading-relaxed text-[var(--ink)]">
            {t('treeHelpIntro')}
          </p>
          <p className="mb-3 text-base font-medium text-[var(--ink)]">
            {t('treeHelpStepsTitle')}
          </p>
          <ul className="list-inside list-disc space-y-2.5 text-left text-base text-[var(--ink)]">
            {STEP_KEYS.map((key) => (
              <li key={key} style={{ breakInside: 'avoid' }}>{t(key)}</li>
            ))}
          </ul>
          <p className="mt-6 text-base leading-relaxed text-[var(--ink)]" style={{ breakInside: 'avoid' }}>
            {t('treeHelpData')}
          </p>
          <p className="mt-4 text-base leading-relaxed text-[var(--ink)]" style={{ breakInside: 'avoid' }}>
            {t('treeHelpPerSectionBefore')}
            <strong>{t('treeHelpPerSectionBold')}</strong>
          </p>
        </div>
      }
    />
  );
}
