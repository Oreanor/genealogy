'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useLocaleRoutes } from '@/lib/i18n/context';
import { BookSpread } from './BookSpread';
import { BookPage } from './BookPage';
import { PersonSpreadRightContent } from '@/components/content/PersonSpreadContent';
import { PhotoThumbnails } from '@/components/content/PhotoThumbnails';
import { getPersons } from '@/lib/data/persons';
import {
  getPhotos,
  getPhotosByPerson,
  getLightboxFacesFromPhoto,
  splitPersonPhotosForCarousels,
  splitAllPhotosForCarousels,
} from '@/lib/data/photos';
import { sortPersonsBySurname, personMatchesSearch, getFullName } from '@/lib/utils/person';
import type { PhotoEntry } from '@/lib/types/photo';
import { PersonSearchDropdown } from '@/components/ui/molecules/PersonSearchDropdown';
import { ImageLightbox } from '@/components/ui/ImageLightbox';
import { usePhotoImageBounds } from '@/hooks/usePhotoImageBounds';

export function PhotosSection() {
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLocaleRoutes();
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
    queueMicrotask(() => {
      setSelectedPersonId(personId ?? null);
      setPersonsSearch('');
    });
  }, [personId, persons]);

  const selectedPerson = selectedPersonId
    ? persons.find((p) => p.id === selectedPersonId) ?? null
    : null;

  const allPhotos = useMemo(() => getPhotos(), []);
  const personPhotos = selectedPerson ? getPhotosByPerson(selectedPerson.id) : allPhotos;

  const allSplit = useMemo(() => splitAllPhotosForCarousels(allPhotos), [allPhotos]);
  const personSplit = selectedPerson
    ? splitPersonPhotosForCarousels(personPhotos)
    : null;

  const [selectedPhoto, setSelectedPhoto] = useState<PhotoEntry | null>(null);
  const [showFaces, setShowFaces] = useState(false);
  const [showPhotoBack, setShowPhotoBack] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const { photoContainerRef, imageBounds, setImageBounds, onPhotoImageLoad } = usePhotoImageBounds();
  const isMobile = useIsMobile();

  useEffect(() => {
    queueMicrotask(() => {
      setSelectedPhoto(null);
      setShowPhotoBack(false);
      setImageBounds(null);
    });
  }, [selectedPersonId, setImageBounds]);

  const handlePhotoSelect = useCallback(
    (photo: PhotoEntry, toggleBack?: boolean) => {
      if (toggleBack) {
        setShowPhotoBack((v) => !v);
        if (isMobile) setLightboxOpen(true);
      } else {
        setSelectedPhoto(photo);
        setShowPhotoBack(false);
        setImageBounds(null);
        if (isMobile) setLightboxOpen(true);
      }
    },
    [setImageBounds, isMobile, setLightboxOpen]
  );

  return (
    <>
      <BookSpread
        left={
          <BookPage className="p-5 sm:p-6 md:p-7">
            <h1 className="book-serif mb-3 hidden border-b border-(--ink-muted)/35 pb-0 text-lg font-semibold text-(--ink) md:block md:text-xl lg:text-2xl">
              {t('chapters_photos')}
            </h1>
            <div className="mt-0 md:mt-1.5">
              <PersonSearchDropdown
                value={personsSearch}
                onChange={setPersonsSearch}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                onSelectPerson={(p) => {
                  setSelectedPersonId(p.id);
                  setPersonsSearch('');
                  setSearchFocused(false);
                  router.push(`${pathname}?section=photos&id=${p.id}`);
                }}
                filteredPersons={filteredSortedPersons}
                getDisplayName={(p) => getFullName(p) || p.id}
                placeholder={t('personsSearchPlaceholder')}
                ariaLabel={t('personsSearchPlaceholder')}
                searchFocused={searchFocused}
              />
            </div>

            {selectedPerson && (
              <h2 className="mt-1.5 book-serif text-xl font-semibold text-(--ink) md:text-2xl">
                {getFullName(selectedPerson) || selectedPerson.id}
              </h2>
            )}

            <div className="mt-2.5 flex-1 min-h-0 overflow-y-auto space-y-2.5">
              {selectedPerson ? (
                <>
                  {personSplit && personSplit.noSeries.length > 0 && (
                    <PhotoThumbnails
                      title={t('personPhotos')}
                      photos={personSplit.noSeries}
                      selectedPhoto={selectedPhoto}
                      onSelect={handlePhotoSelect}
                    />
                  )}
                  {personSplit?.bySeries.map(({ seriesName, photos: seriesPhotos }) => (
                    <PhotoThumbnails
                      key={seriesName}
                      title={t('photoSeriesTitle', { name: seriesName })}
                      photos={seriesPhotos}
                      selectedPhoto={selectedPhoto}
                      onSelect={handlePhotoSelect}
                    />
                  ))}
                  {personPhotos.length === 0 && (
                    <p className="text-sm text-(--ink-muted)">{t('noPhotosYet')}</p>
                  )}
                </>
              ) : (
                <>
                  <PhotoThumbnails
                    title={t('adminPhotoPersonal')}
                    photos={allSplit.personal}
                    selectedPhoto={selectedPhoto}
                    onSelect={handlePhotoSelect}
                  />
                  <PhotoThumbnails
                    title={t('adminPhotoGroup')}
                    photos={allSplit.group}
                    selectedPhoto={selectedPhoto}
                    onSelect={handlePhotoSelect}
                  />
                  <PhotoThumbnails
                    title={t('adminPhotoRelated')}
                    photos={allSplit.related}
                    selectedPhoto={selectedPhoto}
                    onSelect={handlePhotoSelect}
                  />
                  {allSplit.bySeries.map(({ seriesName, photos: seriesPhotos }) => (
                    <PhotoThumbnails
                      key={seriesName}
                      title={t('photoSeriesTitle', { name: seriesName })}
                      photos={seriesPhotos}
                      selectedPhoto={selectedPhoto}
                      onSelect={handlePhotoSelect}
                    />
                  ))}
                  {allPhotos.length === 0 && (
                    <p className="text-sm text-(--ink-muted)">{t('noPhotosYet')}</p>
                  )}
                </>
              )}
            </div>
          </BookPage>
        }
        right={
          <BookPage className="flex flex-col overflow-hidden p-5 sm:p-6 md:p-7">
            <PersonSpreadRightContent
              photo={selectedPhoto}
              showFaces={showFaces}
              showBack={showPhotoBack}
              historyEntry={null}
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
