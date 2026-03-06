'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useLocaleRoutes } from '@/lib/i18n/context';
import { BookSpread } from './BookSpread';
import { BookPage } from './BookPage';
import { HistoryContentRenderer } from '@/components/content/HistoryContentRenderer';
import { getHistoryEntries } from '@/lib/data/history';
import Link from 'next/link';
import { SearchField } from '@/components/ui/molecules/SearchField';
import { CONTENT_LINK_CLASS, SECTION_HEADING_CLASS } from '@/lib/constants/theme';

export function HistorySection() {
  const searchParams = useSearchParams();
  const pathname = usePathname() ?? '';
  const { t } = useLocaleRoutes();
  const [historySearch, setHistorySearch] = useState('');

  const entries = getHistoryEntries();
  const entryParam = searchParams.get('entry');
  const entryIndex = entryParam !== null ? parseInt(entryParam, 10) : -1;
  const selectedEntry =
    entryIndex >= 0 && entryIndex < entries.length ? entries[entryIndex] : null;

  const filteredHistoryEntries = useMemo(() => {
    const q = historySearch.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((entry) => {
      const titleMatch = (entry.title ?? '').toLowerCase().includes(q);
      const textPlain = (entry.richText ?? '').replace(/<[^>]*>/g, ' ').toLowerCase();
      return titleMatch || textPlain.includes(q);
    });
  }, [historySearch, entries]);

  return (
    <BookSpread
      left={
        <BookPage>
          <h1 className={SECTION_HEADING_CLASS}>
            {t('chapters_history')}
          </h1>
          <div className="mt-6">
            <SearchField
              placeholder={t('historySearchPlaceholder')}
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              aria-label={t('historySearchPlaceholder')}
            />
          </div>
          <ul className="mt-6 flex-1 min-h-0 overflow-y-auto space-y-3">
            {filteredHistoryEntries.length === 0 ? (
              <li className="text-(--ink-muted)">{t('unknown')}</li>
            ) : (
              filteredHistoryEntries.map((entry) => {
                const originalIndex = entries.indexOf(entry);
                const isSelected = selectedEntry === entry;
                return (
                  <li key={originalIndex}>
                    <Link
                      href={`${pathname}?section=history&entry=${originalIndex}`}
                      className={`block rounded-md px-3 py-2.5 text-base transition-colors hover:bg-(--paper-light) ${CONTENT_LINK_CLASS} ${isSelected ? 'bg-(--paper-light) font-medium' : ''}`}
                    >
                      {entry.title || `${t('chapters_history')} ${originalIndex + 1}`}
                    </Link>
                  </li>
                );
              })
            )}
          </ul>
        </BookPage>
      }
      right={
        <BookPage className="p-8 sm:p-10 md:p-12">
          <div className="flex h-full min-h-0 flex-col overflow-y-auto">
            {selectedEntry ? (
              <HistoryContentRenderer entries={[selectedEntry]} />
            ) : (
              <p className="text-(--ink-muted) py-6 text-base">
                {t('historySelectHint')}
              </p>
            )}
          </div>
        </BookPage>
      }
    />
  );
}
