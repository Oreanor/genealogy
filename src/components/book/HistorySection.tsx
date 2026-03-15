'use client';

import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
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
  const router = useRouter();
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

  const textScrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    textScrollRef.current?.scrollTo({ top: 0 });
  }, [entryIndex]);

  const handleMobileEntryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const idx = e.target.value === '' ? -1 : parseInt(e.target.value, 10);
    const url = idx >= 0 ? `${pathname}?section=history&entry=${idx}` : `${pathname}?section=history`;
    router.push(url);
  };

  return (
    <>
      {/* Mobile: dropdown + text below on book-style panel with scroll */}
      <div className="flex min-h-0 flex-1 flex-col gap-4 md:hidden">
        <select
          value={entryIndex >= 0 ? entryIndex : ''}
          onChange={handleMobileEntryChange}
          className="w-full max-w-[280px] rounded-md border-2 border-(--border) bg-(--paper) px-3 py-2 text-(--ink) shadow-md focus:outline-none focus:ring-2 focus:ring-(--ink)"
          aria-label={t('chapters_history')}
        >
          <option value="">{t('historySelectHint')}</option>
          {filteredHistoryEntries.map((entry) => {
            const originalIndex = entries.indexOf(entry);
            return (
              <option key={originalIndex} value={originalIndex}>
                {entry.title || `${t('chapters_history')} ${originalIndex + 1}`}
              </option>
            );
          })}
        </select>
        <div className="min-h-0 flex-1 overflow-hidden rounded-lg shadow-inner">
          <div
            ref={textScrollRef}
            className="h-full overflow-y-auto bg-(--paper) p-4 sm:p-5"
          >
            {selectedEntry ? (
              <HistoryContentRenderer entries={[selectedEntry]} />
            ) : (
              <p className="text-(--ink-muted) py-6 text-base">{t('historySelectHint')}</p>
            )}
          </div>
        </div>
      </div>

      {/* Desktop: two columns */}
      <div className="hidden md:block">
        <BookSpread
          left={
            <BookPage>
              <h1 className={SECTION_HEADING_CLASS}>
                {t('chapters_history')}
              </h1>
              <div className="mt-3">
                <SearchField
                  placeholder={t('historySearchPlaceholder')}
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  aria-label={t('historySearchPlaceholder')}
                />
              </div>
              <ul className="mt-3 flex-1 min-h-0 overflow-y-auto space-y-1">
                {filteredHistoryEntries.length === 0 ? (
                  <li className="text-(--ink-muted)">{t('nothingFound')}</li>
                ) : (
                  filteredHistoryEntries.map((entry) => {
                    const originalIndex = entries.indexOf(entry);
                    const isSelected = selectedEntry === entry;
                    return (
                      <li key={originalIndex}>
                        <Link
                          href={`${pathname}?section=history&entry=${originalIndex}`}
                          className={`block rounded-md px-3 py-1.5 text-base transition-colors hover:bg-(--paper-light) ${CONTENT_LINK_CLASS} ${isSelected ? 'bg-(--paper-light) font-medium' : ''}`}
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
              <div
                ref={textScrollRef}
                className="flex h-full min-h-0 flex-col overflow-y-auto"
              >
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
      </div>
    </>
  );
}
