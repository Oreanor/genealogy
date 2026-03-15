'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useLocaleRoutes } from '@/lib/i18n/context';
import Link from 'next/link';
import { BookSpread } from './BookSpread';
import { BookPage } from './BookPage';
import { PersonSpreadLeftContent, PersonSpreadRightContent } from '@/components/content/PersonSpreadContent';
import { getPersons } from '@/lib/data/persons';
import { sortPersonsBySurname, personMatchesSearch, getFullName } from '@/lib/utils/person';
import { getPhotosByPerson, getLightboxFacesFromPhoto } from '@/lib/data/photos';
import { getHistoryEntriesByPerson } from '@/lib/data/history';
import type { PhotoEntry } from '@/lib/types/photo';
import { CONTENT_LINK_CLASS } from '@/lib/constants/theme';
import { PersonSearchDropdown } from '@/components/ui/molecules/PersonSearchDropdown';
import { ImageLightbox } from '@/components/ui/ImageLightbox';
import { usePhotoImageBounds } from '@/hooks/usePhotoImageBounds';
import { SECTION_HEADING_CLASS } from '@/lib/constants/theme';

export function PersonsSection() {
  const searchParams = useSearchParams();
  const { t, routes } = useLocaleRoutes();
  const [personsSearch, setPersonsSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

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

  useEffect(() => {
    setSelectedPersonId(personId ?? null);
  }, [personId]);

  const selectedPerson = selectedPersonId
    ? persons.find((p) => p.id === selectedPersonId) ?? null
    : null;

  const personPhotos = selectedPerson ? getPhotosByPerson(selectedPerson.id) : [];
  const historyMentions = selectedPerson ? getHistoryEntriesByPerson(selectedPerson.id) : [];
  const firstPhoto = personPhotos[0] ?? null;
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoEntry | null>(firstPhoto);
  const [selectedHistoryIndex, setSelectedHistoryIndex] = useState<number | null>(null);
  const [showFaces, setShowFaces] = useState(false);
  const [showPhotoBack, setShowPhotoBack] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const { photoContainerRef, imageBounds, setImageBounds, onPhotoImageLoad } = usePhotoImageBounds();
  const isMobile = useIsMobile();

  useEffect(() => {
    const first = selectedPersonId
      ? (getPhotosByPerson(selectedPersonId)[0] ?? null)
      : null;
    setSelectedPhoto(first);
    setSelectedHistoryIndex(null);
    setShowPhotoBack(false);
    setImageBounds(null);
  }, [selectedPersonId, setImageBounds]);

  const selectedHistoryEntry =
    selectedHistoryIndex !== null
      ? historyMentions.find((m) => m.index === selectedHistoryIndex)?.entry ?? null
      : null;

  return (
    <>
    <BookSpread
      left={
        <BookPage>
          <h1 className={`${SECTION_HEADING_CLASS} hidden md:block`}>
            {t('chapters_persons')}
          </h1>
          <div className="mt-0 md:mt-3">
            <PersonSearchDropdown
              value={personsSearch}
              onChange={setPersonsSearch}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              onSelectPerson={(p) => {
                setSelectedPersonId(p.id);
                setPersonsSearch('');
                setSearchFocused(false);
              }}
              filteredPersons={filteredSortedPersons}
              getDisplayName={(p) => getFullName(p) || p.id}
              placeholder={t('personsSearchPlaceholder')}
              ariaLabel={t('personsSearchPlaceholder')}
              searchFocused={searchFocused}
            />
          </div>
          <div className="mt-4 flex-1 min-h-0 overflow-y-auto">
            {selectedPerson ? (
              <PersonSpreadLeftContent
                person={selectedPerson}
                personPhotos={personPhotos}
                selectedPhoto={selectedPhoto}
                onPhotoClick={(photo, toggleBack) => {
                  setSelectedHistoryIndex(null);
                  if (toggleBack) {
                    setShowPhotoBack((v) => !v);
                    if (isMobile) setLightboxOpen(true);
                  } else {
                    setSelectedPhoto(photo);
                    setShowPhotoBack(false);
                    setImageBounds(null);
                    if (isMobile) setLightboxOpen(true);
                  }
                }}
                onHistoryClick={(index) => {
                  setSelectedHistoryIndex(index);
                  setSelectedPhoto(null);
                }}
                renderPersonLink={(p) => (
                  <Link href={routes.person(p.id)} className={CONTENT_LINK_CLASS}>
                    {getFullName(p)}
                  </Link>
                )}
              />
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
          <PersonSpreadRightContent
            photo={selectedPerson ? selectedPhoto : null}
            showFaces={showFaces}
            showBack={showPhotoBack}
            historyEntry={selectedHistoryEntry}
            onBigPhotoClick={selectedPhoto ? () => setLightboxOpen(true) : undefined}
            onToggleFaces={() => setShowFaces((v) => !v)}
            photoContainerRef={photoContainerRef}
            imageBounds={imageBounds}
            onPhotoImageLoad={onPhotoImageLoad}
            caption={
              selectedPhoto
                ? showPhotoBack && selectedPhoto.backSrc && selectedPhoto.backCaption != null
                  ? selectedPhoto.backCaption
                  : selectedPhoto.caption
                : null
            }
          />
        </BookPage>
      }
    />
    {lightboxOpen && selectedPhoto && (
      <ImageLightbox
        src={selectedPhoto.src}
        alt={selectedPhoto.caption ?? ''}
        caption={selectedPhoto.caption}
        backSrc={selectedPhoto.backSrc}
        backCaption={selectedPhoto.backCaption}
        faces={getLightboxFacesFromPhoto(selectedPhoto, persons)}
        open
        onClose={() => setLightboxOpen(false)}
      />
    )}
  </>
  );
}
