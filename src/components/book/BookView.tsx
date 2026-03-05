'use client';

import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useLocaleRoutes } from '@/lib/i18n/context';
import { isSectionId } from '@/lib/constants/sections';
import type { SectionId } from '@/lib/constants/sections';
import { BookSpread } from './BookSpread';
import { BookPage } from './BookPage';
import { FamilyTree } from '@/components/tree/FamilyTree';
import { HistoryContentRenderer } from '@/components/content/HistoryContentRenderer';
import { PersonCard } from '@/components/content/PersonCard';
import { getHistoryEntries } from '@/lib/data/history';
import { getPhotos } from '@/lib/data/photos';
import { getPersons } from '@/lib/data/persons';
import { sortPersonsBySurname, personMatchesSearch, getFullName } from '@/lib/utils/person';
import Image from 'next/image';
import Link from 'next/link';
import { NavButton } from '@/components/ui/NavButton';
import { CONTENT_LINK_CLASS } from '@/lib/constants/theme';

const PHOTOS_PER_PAGE = 9;
const PHOTOS_PER_SPREAD = PHOTOS_PER_PAGE * 2;

export function BookView() {
  const searchParams = useSearchParams();
  const { t, routes } = useLocaleRoutes();
  const [personsSearch, setPersonsSearch] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const sectionParam = searchParams.get('section') ?? '';
  const section: SectionId = isSectionId(sectionParam) ? sectionParam : 'tree';

  const filteredSortedPersons = useMemo(() => {
    if (section !== 'persons') return [];
    const persons = getPersons();
    return sortPersonsBySurname(persons).filter((p) =>
      personMatchesSearch(p, personsSearch)
    );
  }, [section, personsSearch]);

  const filteredHistoryEntries = useMemo(() => {
    if (section !== 'history') return [];
    const entries = getHistoryEntries();
    const q = historySearch.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((entry) => {
      const titleMatch = (entry.title ?? '').toLowerCase().includes(q);
      const textPlain = (entry.richText ?? '').replace(/<[^>]*>/g, ' ').toLowerCase();
      return titleMatch || textPlain.includes(q);
    });
  }, [section, historySearch]);

  if (section === 'tree') {
    return (
      <BookSpread
        fullWidth={
          <BookPage>
            <h1 className="mb-2 text-center text-xl font-semibold text-[var(--ink)]">
              {t('treeTitle')}
            </h1>
            <FamilyTree />
          </BookPage>
        }
      />
    );
  }

  if (section === 'history') {
    const entries = getHistoryEntries();
    const entryParam = searchParams.get('entry');
    const entryIndex = entryParam !== null ? parseInt(entryParam, 10) : -1;
    const selectedEntry =
      entryIndex >= 0 && entryIndex < entries.length ? entries[entryIndex] : null;

    return (
      <BookSpread
        left={
          <BookPage>
            <h1 className="text-2xl font-semibold text-[var(--ink)] md:text-3xl lg:text-4xl">
              {t('chapters_history')}
            </h1>
            <div className="mt-4 flex items-center gap-2 rounded-md border border-[var(--border-subtle)] bg-[var(--paper)] pl-3 pr-2 py-1.5 focus-within:border-[var(--accent)] focus-within:outline-none focus-within:ring-1 focus-within:ring-[var(--accent)]">
              <svg
                className="size-5 shrink-0 text-[var(--ink-muted)]"
                aria-hidden
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="search"
                placeholder={t('historySearchPlaceholder')}
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="min-w-0 flex-1 bg-transparent py-1 text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none"
                aria-label={t('historySearchPlaceholder')}
              />
            </div>
            <ul className="mt-4 flex-1 min-h-0 overflow-y-auto space-y-2">
              {filteredHistoryEntries.length === 0 ? (
                <li className="text-[var(--ink-muted)]">{t('unknown')}</li>
              ) : (
                filteredHistoryEntries.map((entry, idx) => {
                  const originalIndex = entries.indexOf(entry);
                  const isSelected = selectedEntry === entry;
                  return (
                    <li key={originalIndex}>
                      <Link
                        href={`${pathname}?section=history&entry=${originalIndex}`}
                        className={`block rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-[var(--paper-light)] ${CONTENT_LINK_CLASS} ${isSelected ? 'bg-[var(--paper-light)] font-medium' : ''}`}
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
          <BookPage>
            <div className="flex h-full min-h-0 flex-col overflow-y-auto">
              {selectedEntry ? (
                <HistoryContentRenderer entries={[selectedEntry]} />
              ) : (
                <p className="text-[var(--ink-muted)] py-4">
                  {t('historySelectHint')}
                </p>
              )}
            </div>
          </BookPage>
        }
      />
    );
  }

  if (section === 'photos') {
    const photos = getPhotos();
    const photoId = searchParams.get('photo');
    const selectedPhoto = photoId ? photos.find((p) => p.id === photoId) : null;
    const spreadParam = searchParams.get('spread');
    const spread = spreadParam !== null ? Math.max(0, parseInt(spreadParam, 10) || 0) : 0;

    if (selectedPhoto) {
      const backUrl = `${pathname}?section=photos${spread > 0 ? `&spread=${spread}` : ''}`;
      return (
        <BookSpread
          fullWidth={
            <BookPage>
              <Link
                href={backUrl}
                className={`mb-2 inline-block text-sm ${CONTENT_LINK_CLASS}`}
              >
                ← {t('back')}
              </Link>
              <div className="flex flex-1 min-h-0 flex-col">
                <div className="relative min-h-0 flex-1 w-full">
                  <Image
                    src={selectedPhoto.src}
                    alt={selectedPhoto.caption ?? selectedPhoto.id}
                    fill
                    className="object-contain"
                    sizes="100vw"
                  />
                </div>
                {selectedPhoto.caption && (
                  <p className="mt-2 shrink-0 text-sm text-[var(--ink-muted)]">
                    {selectedPhoto.caption}
                  </p>
                )}
              </div>
            </BookPage>
          }
        />
      );
    }

    const leftPhotos = photos.slice(spread * PHOTOS_PER_SPREAD, spread * PHOTOS_PER_SPREAD + PHOTOS_PER_PAGE);
    const rightPhotos = photos.slice(
      spread * PHOTOS_PER_SPREAD + PHOTOS_PER_PAGE,
      spread * PHOTOS_PER_SPREAD + PHOTOS_PER_SPREAD
    );
    const totalSpreads = Math.ceil(photos.length / PHOTOS_PER_SPREAD);
    const hasPrev = spread > 0;
    const hasNext = spread < totalSpreads - 1;

    const photoGrid = (list: typeof photos) => (
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
        {list.map((photo) => (
          <Link
            key={photo.id}
            href={`${pathname}?section=photos&spread=${spread}&photo=${photo.id}`}
            className="relative block aspect-[3/4] overflow-hidden rounded bg-[var(--paper-light)]"
          >
            <Image
              src={photo.src}
              alt={photo.caption ?? photo.id}
              fill
              className="object-cover transition-opacity hover:opacity-90"
              sizes="(max-width: 640px) 33vw, 20vw"
            />
          </Link>
        ))}
      </div>
    );

    return (
      <div className="relative w-full">
        <BookSpread
          left={
            <BookPage>
              <h1 className="mb-2 text-xl font-semibold text-[var(--ink)] md:text-2xl">
                {t('chapters_photos')}
              </h1>
              <div className="flex-1 min-h-0 overflow-y-auto">
                {photoGrid(leftPhotos)}
              </div>
            </BookPage>
          }
          right={
            <BookPage>
              <div className="flex h-full flex-1 min-h-0 overflow-y-auto">
                {photoGrid(rightPhotos)}
              </div>
            </BookPage>
          }
        />
        {totalSpreads > 1 && (
          <div className="absolute bottom-2 left-2 right-2 z-20 flex items-center justify-between pointer-events-none">
            <div className="pointer-events-auto">
              <NavButton
                onClick={() => router.push(`${pathname}?section=photos&spread=${spread - 1}`)}
                disabled={!hasPrev}
              >
                ← {t('back')}
              </NavButton>
            </div>
            <span className="text-sm font-medium text-[var(--ink)] drop-shadow-sm">
              {spread + 1} / {totalSpreads}
            </span>
            <div className="pointer-events-auto">
              <NavButton
                onClick={() => router.push(`${pathname}?section=photos&spread=${spread + 1}`)}
                disabled={!hasNext}
              >
                {t('next')} →
              </NavButton>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (section === 'persons') {
    const persons = getPersons();
    const personId = searchParams.get('id');
    const selectedPerson = personId ? persons.find((p) => p.id === personId) : null;

    return (
      <BookSpread
        left={
          <BookPage>
            <h1 className="text-2xl font-semibold text-[var(--ink)] md:text-3xl lg:text-4xl">
              {t('chapters_persons')}
            </h1>
            <div className="mt-4 flex items-center gap-2 rounded-md border border-[var(--border-subtle)] bg-[var(--paper)] pl-3 pr-2 py-1.5 focus-within:border-[var(--accent)] focus-within:outline-none focus-within:ring-1 focus-within:ring-[var(--accent)]">
              <svg
                className="size-5 shrink-0 text-[var(--ink-muted)]"
                aria-hidden
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="search"
                placeholder={t('personsSearchPlaceholder')}
                value={personsSearch}
                onChange={(e) => setPersonsSearch(e.target.value)}
                className="min-w-0 flex-1 bg-transparent py-1 text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none"
                aria-label={t('personsSearchPlaceholder')}
              />
            </div>
            <ul className="mt-4 flex-1 min-h-0 overflow-y-auto space-y-2">
              {filteredSortedPersons.length === 0 ? (
                <li className="text-[var(--ink-muted)]">{t('unknown')}</li>
              ) : (
                filteredSortedPersons.map((person) => (
                  <li key={person.id}>
                    <Link
                      href={routes.person(person.id)}
                      className={`block rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-[var(--paper-light)] ${CONTENT_LINK_CLASS} ${selectedPerson?.id === person.id ? 'bg-[var(--paper-light)] font-medium' : ''}`}
                    >
                      {getFullName(person) || person.id}
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </BookPage>
        }
        right={
          <BookPage>
            <div className="flex h-full min-h-0 flex-col overflow-y-auto">
              {selectedPerson ? (
                <PersonCard person={selectedPerson} />
              ) : (
                <p className="text-[var(--ink-muted)] py-4">
                  {t('personsSelectHint')}
                </p>
              )}
            </div>
          </BookPage>
        }
      />
    );
  }

  return null;
}
