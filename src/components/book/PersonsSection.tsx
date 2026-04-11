'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useLocale, useLocaleRoutes } from '@/lib/i18n/context';
import Link from 'next/link';
import { BookSpread } from './BookSpread';
import { BookPage } from './BookPage';
import { PersonSpreadLeftContent, PersonSpreadRightContent } from '@/components/content/PersonSpreadContent';
import { getPersons } from '@/lib/data/persons';
import { formatPersonNameForLocale, sortPersonsBySurname, personMatchesSearch } from '@/lib/utils/person';
import {
  getPhotoById,
  getPhotosByPerson,
  getLightboxFacesFromPhoto,
  getPreferredPanelPhoto,
} from '@/lib/data/photos';
import { getHistoryEntriesByPerson } from '@/lib/data/history';
import type { PhotoEntry } from '@/lib/types/photo';
import { CONTENT_LINK_CLASS, HISTORY_RICH_HTML_IMAGE_CLASS } from '@/lib/constants/theme';
import { PersonSearchDropdown } from '@/components/ui/molecules/PersonSearchDropdown';
import { ImageLightbox } from '@/components/ui/ImageLightbox';
import { usePhotoImageBounds } from '@/hooks/usePhotoImageBounds';
import { Button } from '@/components/ui/atoms/Button';
import { buildUrlWithUpdatedSearchParams } from '@/lib/utils/urlParams';

export function PersonsSection() {
  const pathname = usePathname() ?? '';
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t, routes } = useLocaleRoutes();
  const locale = useLocale();
  const [personsSearch, setPersonsSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const persons = getPersons();
  const personId = searchParams.get('id');
  const photoParam = searchParams.get('photo');
  const entryParam = searchParams.get('entry');
  const filteredSortedPersons = useMemo(
    () =>
      sortPersonsBySurname(persons).filter((p) =>
        personMatchesSearch(p, personsSearch)
      ),
    [persons, personsSearch]
  );

  const selectedPerson = personId ? persons.find((p) => p.id === personId) ?? null : null;

  const personPhotos = useMemo(
    () => (selectedPerson ? getPhotosByPerson(selectedPerson.id) : []),
    [selectedPerson]
  );
  const historyMentions = useMemo(
    () => (selectedPerson ? getHistoryEntriesByPerson(selectedPerson.id) : []),
    [selectedPerson]
  );
  const selectedHistoryIndex = useMemo(() => {
    if (!selectedPerson || entryParam == null) return null;
    const parsedEntry = Number.parseInt(entryParam, 10);
    return Number.isInteger(parsedEntry) &&
      historyMentions.some((mention) => mention.index === parsedEntry)
      ? parsedEntry
      : null;
  }, [entryParam, historyMentions, selectedPerson]);
  const selectedHistoryEntry =
    selectedHistoryIndex !== null
      ? historyMentions.find((m) => m.index === selectedHistoryIndex)?.entry ?? null
      : null;
  const selectedPhoto = useMemo<PhotoEntry | null>(() => {
    if (!selectedPerson || selectedHistoryEntry) {
      return null;
    }

    const fromUrlPhoto = photoParam ? getPhotoById(photoParam) : null;
    const hasValidPhoto =
      fromUrlPhoto != null && personPhotos.some((photo) => photo.id === fromUrlPhoto.id);

    return hasValidPhoto ? fromUrlPhoto : getPreferredPanelPhoto(selectedPerson.id);
  }, [personPhotos, photoParam, selectedHistoryEntry, selectedPerson]);
  const [selectedMapState, setSelectedMapState] = useState<{
    personId: string;
    city: string;
  } | null>(null);
  const [showFaces, setShowFaces] = useState(false);
  const [showPhotoBackState, setShowPhotoBackState] = useState<{
    photoId: string | null;
    value: boolean;
  }>({
    photoId: null,
    value: false,
  });
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [textLightboxOpen, setTextLightboxOpen] = useState(false);
  const [mapLightboxOpen, setMapLightboxOpen] = useState(false);
  const selectedMapCity =
    selectedPerson &&
    selectedMapState?.personId === selectedPerson.id &&
    photoParam == null &&
    entryParam == null
      ? selectedMapState.city
      : null;
  const showPhotoBack =
    selectedPhoto != null &&
    showPhotoBackState.photoId === selectedPhoto.id &&
    showPhotoBackState.value;
  const mediaResetKey = `${selectedPerson?.id ?? 'none'}:${selectedPhoto?.id ?? 'none'}:${selectedHistoryIndex ?? 'none'}:${selectedMapCity ?? 'none'}`;
  const { photoContainerRef, imageBounds, onPhotoImageLoad } = usePhotoImageBounds(mediaResetKey);
  const isMobile = useIsMobile();

  return (
    <>
    <BookSpread
      left={
        <BookPage className="p-5 sm:p-6 md:p-7">
          <h1 className="book-serif mb-3 hidden border-b border-(--ink-muted)/35 pb-0 text-lg font-semibold text-(--ink) md:block md:text-xl lg:text-2xl">
            {t('chapters_persons')}
          </h1>
          <div className="mt-0 md:mt-1.5">
            <PersonSearchDropdown
              value={personsSearch}
              onChange={setPersonsSearch}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              onSelectPerson={(p) => {
                setSelectedMapState(null);
                setShowPhotoBackState({ photoId: null, value: false });
                router.push(routes.person(p.id));
                setPersonsSearch('');
                setSearchFocused(false);
                // Принудительно снимаем фокус, чтобы повторный клик по полю снова открывал список
                if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
                  document.activeElement.blur();
                }
              }}
              filteredPersons={filteredSortedPersons}
              getDisplayName={(p) => formatPersonNameForLocale(p, locale) || p.id}
              placeholder={t('personsSearchPlaceholder')}
              ariaLabel={t('personsSearchPlaceholder')}
              searchFocused={searchFocused}
            />
          </div>
          <div className="mt-2.5 flex-1 min-h-0 overflow-y-auto">
            {selectedPerson ? (
              <PersonSpreadLeftContent
                person={selectedPerson}
                personPhotos={personPhotos}
                selectedPhoto={selectedPhoto}
                onPhotoClick={(photo, toggleBack) => {
                  setSelectedMapState(null);
                  if (toggleBack) {
                    setShowPhotoBackState((current) => ({
                      photoId: photo.id,
                      value: current.photoId === photo.id ? !current.value : true,
                    }));
                    if (isMobile) setLightboxOpen(true);
                  } else {
                    router.replace(
                      buildUrlWithUpdatedSearchParams(pathname, searchParams, {
                        section: 'persons',
                        id: selectedPerson.id,
                        photo: photo.id,
                        entry: null,
                      })
                    );
                    setShowPhotoBackState({ photoId: null, value: false });
                    if (isMobile) setLightboxOpen(true);
                  }
                }}
                onHistoryClick={(index) => {
                  setSelectedMapState(null);
                  setShowPhotoBackState({ photoId: null, value: false });
                  router.replace(
                    buildUrlWithUpdatedSearchParams(pathname, searchParams, {
                      section: 'persons',
                      id: selectedPerson.id,
                      entry: String(index),
                      photo: null,
                    })
                  );
                  if (isMobile) {
                    setTextLightboxOpen(true);
                  }
                }}
                onCityClick={(city) => {
                  if (!selectedPerson) return;
                  setSelectedMapState({ personId: selectedPerson.id, city });
                  setShowPhotoBackState({ photoId: null, value: false });
                  setTextLightboxOpen(false);
                  router.replace(
                    buildUrlWithUpdatedSearchParams(pathname, searchParams, {
                      section: 'persons',
                      id: selectedPerson.id,
                      entry: null,
                      photo: null,
                    })
                  );
                  if (isMobile) setMapLightboxOpen(true);
                }}
                renderPersonLink={(p, displayName) => (
                  <Link href={routes.person(p.id)} className={CONTENT_LINK_CLASS}>
                    {displayName ?? formatPersonNameForLocale(p, locale)}
                  </Link>
                )}
              />
            ) : (
              <p className="py-4 text-sm text-(--ink-muted)">
                {t('personsSelectHint')}
              </p>
            )}
          </div>
        </BookPage>
      }
      right={
        <BookPage className="flex flex-col overflow-hidden">
          <PersonSpreadRightContent
            person={selectedPerson}
            photo={selectedPerson ? selectedPhoto : null}
            showFaces={showFaces}
            showBack={showPhotoBack}
            historyEntry={isMobile ? null : selectedHistoryEntry}
            mapCity={isMobile ? null : selectedMapCity}
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
    {isMobile && textLightboxOpen && selectedHistoryEntry && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-3 py-4">
        <div className="flex max-h-[calc(100vh-3rem)] w-full max-w-[640px] flex-col overflow-hidden rounded-2xl bg-(--paper) shadow-2xl">
          <div className="min-w-0 flex-1 space-y-3 overflow-y-auto p-4">
            <h3 className="book-serif text-lg font-semibold text-(--ink)">
              {selectedHistoryEntry.title}
            </h3>
            <div
              className={`book-serif prose-sm min-w-0 max-w-full text-(--ink) leading-relaxed ${HISTORY_RICH_HTML_IMAGE_CLASS}`}
              dangerouslySetInnerHTML={{ __html: selectedHistoryEntry.richText }}
            />
          </div>
          <div className="border-t border-(--border-subtle) bg-(--paper) px-4 py-2.5 flex justify-center">
            <Button
              variant="secondary"
              className="px-4"
              onClick={() => {
                setTextLightboxOpen(false);
                router.replace(
                  buildUrlWithUpdatedSearchParams(pathname, searchParams, {
                    section: 'persons',
                    id: selectedPerson?.id ?? null,
                    entry: null,
                  })
                );
              }}
            >
              ← {t('back')}
            </Button>
          </div>
        </div>
      </div>
    )}
    {isMobile && selectedMapCity && (
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center px-3 py-4 transition-opacity duration-200 ${
          mapLightboxOpen
            ? 'pointer-events-auto visible opacity-100 bg-black/80'
            : 'pointer-events-none invisible opacity-0 bg-black/0'
        }`}
      >
        <div className="flex h-[calc(100vh-3rem)] w-full max-w-[640px] flex-col overflow-hidden rounded-2xl bg-(--paper) shadow-2xl">
          <div className="min-h-0 flex-1 p-4">
            <PersonSpreadRightContent
              person={selectedPerson}
              photo={null}
              showFaces={false}
              showBack={false}
              historyEntry={null}
              mapCity={selectedMapCity}
              onToggleFaces={() => {}}
            />
          </div>
          <div className="border-t border-(--border-subtle) bg-(--paper) px-4 py-2.5 flex justify-center">
            <Button
              variant="secondary"
              className="px-4"
              onClick={() => setMapLightboxOpen(false)}
            >
              ← {t('back')}
            </Button>
          </div>
        </div>
      </div>
    )}
  </>
  );
}
