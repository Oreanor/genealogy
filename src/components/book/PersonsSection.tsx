'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useLocaleRoutes } from '@/lib/i18n/context';
import { BookSpread } from './BookSpread';
import { BookPage } from './BookPage';
import { PersonCard } from '@/components/content/PersonCard';
import { getPersons } from '@/lib/data/persons';
import { sortPersonsBySurname, personMatchesSearch, getFullName } from '@/lib/utils/person';
import { getPhotosByPerson, getLightboxFacesFromPhoto } from '@/lib/data/photos';
import type { PhotoEntry } from '@/lib/types/photo';
import Image from 'next/image';
import { List, ListX } from 'lucide-react';
import { SearchField } from '@/components/ui/molecules/SearchField';
import { SECTION_HEADING_CLASS } from '@/lib/constants/theme';

export function PersonsSection() {
  const searchParams = useSearchParams();
  const { t } = useLocaleRoutes();
  const [personsSearch, setPersonsSearch] = useState('');

  const persons = getPersons();
  const personId = searchParams.get('id');
  const filteredSortedPersons = useMemo(
    () =>
      sortPersonsBySurname(persons).filter((p) =>
        personMatchesSearch(p, personsSearch)
      ),
    [persons, personsSearch]
  );

  const personFromUrl = personId ? persons.find((p) => p.id === personId) : null;
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(
    personFromUrl?.id ?? null
  );

  const selectedPerson = selectedPersonId
    ? persons.find((p) => p.id === selectedPersonId) ?? null
    : null;

  const personPhotos = selectedPerson ? getPhotosByPerson(selectedPerson.id) : [];
  const firstPhoto = personPhotos[0] ?? null;
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoEntry | null>(firstPhoto);
  const [showFaces, setShowFaces] = useState(false);

  useEffect(() => {
    setSelectedPhoto(firstPhoto);
  }, [firstPhoto]);

  return (
    <BookSpread
      left={
        <BookPage>
          <h1 className={SECTION_HEADING_CLASS}>
            {t('chapters_persons')}
          </h1>
          <div className="mt-6 relative">
            <SearchField
              placeholder={t('personsSearchPlaceholder')}
              value={personsSearch}
              onChange={(e) => setPersonsSearch(e.target.value)}
              aria-label={t('personsSearchPlaceholder')}
            />
            {personsSearch.trim() !== '' && filteredSortedPersons.length > 0 && (
              <ul className="absolute left-0 right-0 z-10 mt-1 max-h-64 overflow-y-auto rounded-md border border-(--border-subtle) bg-(--paper) shadow-lg">
                {filteredSortedPersons.map((p) => {
                  const name = getFullName(p) || p.id;
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPersonId(p.id);
                          setPersonsSearch('');
                        }}
                        className="block w-full px-3 py-1 text-left text-sm text-(--ink) hover:bg-(--paper-light)"
                      >
                        {name}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div className="mt-4 flex-1 min-h-0 overflow-y-auto">
            {selectedPerson ? (
              <>
                <PersonCard person={selectedPerson} showPhotos={false} />
                {personPhotos.length > 0 && (
                  <div className="mt-2 space-y-2">
                    <h3 className="text-base font-medium text-(--ink)">{t('personPhotos')}</h3>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {personPhotos.map((photo) => (
                        <button
                          key={photo.src}
                          type="button"
                          className="relative h-14 w-14 shrink-0 overflow-hidden rounded border border-(--border-subtle) bg-(--paper-light) transition-opacity hover:opacity-80 focus:outline-none"
                          onClick={() => setSelectedPhoto(photo)}
                          aria-label={photo.caption ?? photo.id}
                        >
                          <Image
                            src={photo.src}
                            alt={photo.caption ?? ''}
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="py-6 text-base text-(--ink-muted)">
                {t('personsSelectHint')}
              </p>
            )}
          </div>
        </BookPage>
      }
      right={
        <BookPage className="flex flex-col overflow-hidden">
          <div className="relative flex-1 overflow-hidden rounded bg-(--paper-light)">
            {selectedPhoto ? (
              <>
                <Image
                  src={selectedPhoto.src}
                  alt={selectedPhoto.caption ?? selectedPhoto.id}
                  fill
                  className="object-contain"
                  sizes="(max-width: 600px) 100vw, 50vw"
                />
                {(() => {
                  const faces =
                    selectedPhoto != null
                      ? getLightboxFacesFromPhoto(selectedPhoto, persons)
                      : [];
                  return faces.length > 0 ? (
                    <>
                      {showFaces &&
                        faces.map((face, i) => {
                          const [l, t_, r, b] = face.coords;
                          const w = r - l;
                          const h = b - t_;
                          return (
                            <div key={`${i}-${face.displayName}`} className="pointer-events-none absolute inset-0">
                              <div
                                className="absolute border border-white/90 bg-black/10"
                                style={{
                                  left: `${l}%`,
                                  top: `${t_}%`,
                                  width: `${w}%`,
                                  height: `${h}%`,
                                }}
                              />
                            </div>
                          );
                        })}
                      <button
                        type="button"
                        onClick={() => setShowFaces((v) => !v)}
                        className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded bg-black/60 text-white hover:bg-black/80 focus:outline-none"
                        title={showFaces ? t('lightboxHideLabels') : t('lightboxShowLabels')}
                        aria-label={showFaces ? t('lightboxHideLabels') : t('lightboxShowLabels')}
                      >
                        {showFaces ? <ListX className="size-[16px]" /> : <List className="size-[16px]" />}
                      </button>
                    </>
                  ) : null;
                })()}
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-(--ink-muted)">
                {t('noPhotosYet')}
              </div>
            )}
          </div>
          {selectedPhoto?.caption && (
            <p className="mt-2 text-center text-sm text-(--ink)">
              {selectedPhoto.caption}
            </p>
          )}
        </BookPage>
      }
    />
  );
}
