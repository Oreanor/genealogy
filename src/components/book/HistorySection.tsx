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
import { CONTENT_LINK_CLASS } from '@/lib/constants/theme';
import { useIsMobile } from '@/hooks/useIsMobile';
import { Button } from '@/components/ui/atoms/Button';

export function HistorySection() {
  const searchParams = useSearchParams();
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const { t } = useLocaleRoutes();
  const [historySearch, setHistorySearch] = useState('');
  const isMobile = useIsMobile();
  const [textLightboxOpen, setTextLightboxOpen] = useState(false);

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

  return (
    <>
      {/* Mobile: список текстов в одной колонке, контент в лайтбоксе */}
      <div className="flex min-h-0 flex-1 flex-col px-4 md:hidden">
        <div className="mt-2">
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
                  <button
                    type="button"
                    className={`block w-full rounded-md px-3 py-1.5 text-left text-base transition-colors hover:bg-(--paper-light) ${CONTENT_LINK_CLASS} ${
                      isSelected ? 'bg-(--paper-light) font-medium' : ''
                    }`}
                    onClick={() => {
                      const url = `${pathname}?section=history&entry=${originalIndex}`;
                      router.push(url);
                      setTextLightboxOpen(true);
                    }}
                  >
                    {entry.title || `${t('chapters_history')} ${originalIndex + 1}`}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>

      {/* Desktop: two columns */}
      <div className="hidden md:block">
        <BookSpread
          left={
            <BookPage className="p-5 sm:p-6 md:p-7">
              <h1 className="book-serif mb-3 border-b border-(--ink-muted)/35 pb-0 text-lg font-semibold text-(--ink) md:text-xl lg:text-2xl">
                {t('chapters_history')}
              </h1>
              <div className="mt-1.5">
                <SearchField
                  placeholder={t('historySearchPlaceholder')}
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  aria-label={t('historySearchPlaceholder')}
                />
              </div>
              <ul className="mt-2.5 flex-1 min-h-0 overflow-y-auto space-y-0.5">
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
                          className={`block rounded-md px-2.5 py-1 text-sm transition-colors hover:bg-(--paper-light) ${CONTENT_LINK_CLASS} ${isSelected ? 'bg-(--paper-light) font-medium' : ''}`}
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
            <BookPage className="p-5 sm:p-6 md:p-7">
              <div
                ref={textScrollRef}
                className="flex h-full min-h-0 flex-col overflow-y-auto"
              >
                {selectedEntry ? (
                  <HistoryContentRenderer entries={[selectedEntry]} />
                ) : (
                  <p className="py-4 text-sm text-(--ink-muted)">
                    {t('historySelectHint')}
                  </p>
                )}
              </div>
            </BookPage>
          }
        />
      </div>
      {isMobile && textLightboxOpen && selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-3 py-4">
          <div className="flex max-h-[calc(100vh-3rem)] w-full max-w-[640px] flex-col overflow-hidden rounded-2xl bg-(--paper) shadow-2xl">
            <div
              ref={textScrollRef}
              className="flex-1 overflow-y-auto px-5 pb-5"
            >
              <div className="h-4" />
              <HistoryContentRenderer entries={[selectedEntry]} />
            </div>
            <div className="border-t border-(--border-subtle) bg-(--paper) px-4 py-2.5 flex justify-center">
              <Button
                variant="secondary"
                className="px-4"
                onClick={() => {
                  setTextLightboxOpen(false);
                  const url = `${pathname}?section=history`;
                  router.push(url);
                }}
              >
                {t('back')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
