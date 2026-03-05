'use client';

import { useSearchParams } from 'next/navigation';
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
import Image from 'next/image';
import Link from 'next/link';
import { CONTENT_LINK_CLASS } from '@/lib/constants/theme';

export function BookView() {
  const searchParams = useSearchParams();
  const { t, routes } = useLocaleRoutes();
  const sectionParam = searchParams.get('section');
  const section: SectionId = isSectionId(sectionParam) ? sectionParam : 'tree';

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
    return (
      <BookSpread
        left={
          <BookPage>
            <h1 className="text-2xl font-semibold text-[var(--ink)] md:text-3xl">
              {t('chapters_history')}
            </h1>
            <div className="mt-6 flex-1 overflow-y-auto">
              <HistoryContentRenderer entries={entries} />
            </div>
          </BookPage>
        }
        right={<BookPage>{/* пустая правая страница или следующий блок */}</BookPage>}
      />
    );
  }

  if (section === 'photos') {
    const photos = getPhotos();
    return (
      <BookSpread
        left={
          <BookPage>
            <h1 className="text-2xl font-semibold text-[var(--ink)] md:text-3xl">
              {t('chapters_photos')}
            </h1>
            <div className="mt-6 flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {photos.map((photo) => (
                  <div key={photo.id} className="relative aspect-[3/4] overflow-hidden rounded">
                    <Image
                      src={photo.src}
                      alt={photo.caption ?? photo.id}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, 33vw"
                    />
                  </div>
                ))}
              </div>
            </div>
          </BookPage>
        }
        right={<BookPage />}
      />
    );
  }

  if (section === 'persons') {
    const persons = getPersons();
    const personId = searchParams.get('id');
    const selectedPerson = personId ? persons.find((p) => p.id === personId) : null;

    if (selectedPerson) {
      return (
        <BookSpread
          left={
            <BookPage>
              <Link href={routes.section('persons')} className={`text-sm ${CONTENT_LINK_CLASS}`}>
                ← {t('back')}
              </Link>
              <h1 className="mt-2 text-2xl font-semibold text-[var(--ink)] md:text-3xl">
                {t('chapters_persons')}
              </h1>
              <div className="mt-6 flex-1">
                <PersonCard person={selectedPerson} />
              </div>
            </BookPage>
          }
          right={<BookPage />}
        />
      );
    }

    return (
      <BookSpread
        left={
          <BookPage>
            <h1 className="text-2xl font-semibold text-[var(--ink)] md:text-3xl">
              {t('chapters_persons')}
            </h1>
            <div className="mt-6 flex-1 overflow-y-auto space-y-6">
              {persons.length === 0 ? (
                <p className="text-[var(--ink-muted)]">{t('unknown')}</p>
              ) : (
                persons.map((person) => (
                  <article key={person.id}>
                    <Link href={routes.person(person.id)} className={CONTENT_LINK_CLASS}>
                      <PersonCard person={person} />
                    </Link>
                  </article>
                ))
              )}
            </div>
          </BookPage>
        }
        right={<BookPage />}
      />
    );
  }

  return null;
}
