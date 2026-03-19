'use client';

import { useState } from 'react';
import { CONTENT_LINK_CLASS } from '@/lib/constants/theme';
import { getPersons } from '@/lib/data/persons';
import { getPhotosByPerson, getLightboxFacesFromPhoto, getPreferredPanelPhoto } from '@/lib/data/photos';
import { getHistoryEntriesByPerson } from '@/lib/data/history';
import { formatPersonNameForLocale, getFullName } from '@/lib/utils/person';
import type { Person } from '@/lib/types/person';
import type { PhotoEntry } from '@/lib/types/photo';
import { useLocale, useTranslations } from '@/lib/i18n/context';
import { BookSpread } from '@/components/book/BookSpread';
import { BookPage } from '@/components/book/BookPage';
import { PersonSpreadLeftContent, PersonSpreadRightContent } from '@/components/content/PersonSpreadContent';
import { ImageLightbox } from '@/components/ui/ImageLightbox';
import { usePhotoImageBounds } from '@/hooks/usePhotoImageBounds';
import { useIsMobile } from '@/hooks/useIsMobile';

interface PersonDetailPanelProps {
  person: Person;
  onClose: () => void;
  onSelectPerson: (personId: string) => void;
  /** Render inside book container (no overlay). When false, render as modal. */
  inline?: boolean;
}

export function PersonDetailPanel({ person, onClose, onSelectPerson, inline = false }: PersonDetailPanelProps) {
  const personPhotos = getPhotosByPerson(person.id);
  const firstPhoto = getPreferredPanelPhoto(person.id);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoEntry | null>(firstPhoto);
  const [showFaces, setShowFaces] = useState(false);
  const [showPhotoBack, setShowPhotoBack] = useState(false);
  const isMobile = useIsMobile();
  const locale = useLocale();
  const t = useTranslations();
  const historyMentions = getHistoryEntriesByPerson(person.id);
  const [selectedHistoryIndex, setSelectedHistoryIndex] = useState<number | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const { photoContainerRef, imageBounds, setImageBounds, onPhotoImageLoad } = usePhotoImageBounds();

  const selectedHistoryEntry =
    selectedHistoryIndex !== null
      ? historyMentions.find((h) => h.index === selectedHistoryIndex)?.entry ?? null
      : null;

  const spreadContent = (
    <BookSpread
      left={
        <BookPage className="overflow-y-auto">
          {inline && (
            <button
              type="button"
              onClick={onClose}
              className="mb-3 text-sm text-(--link) hover:underline focus:outline-none"
            >
              ← {t('back')}
            </button>
          )}
          <PersonSpreadLeftContent
            person={person}
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
            renderPersonLink={(p, displayName) => (
              <button
                type="button"
                className={CONTENT_LINK_CLASS}
                onClick={(e) => {
                  e.preventDefault();
                  onSelectPerson(p.id);
                }}
                role="button"
              >
                {displayName ?? formatPersonNameForLocale(p, locale)}
              </button>
            )}
          />
        </BookPage>
      }
      right={
        <BookPage className="flex flex-col overflow-hidden">
          <PersonSpreadRightContent
            photo={selectedPhoto}
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
  );

  const lightbox =
    lightboxOpen &&
    selectedPhoto && (
      <ImageLightbox
        src={selectedPhoto.src}
        alt={selectedPhoto.caption ?? ''}
        caption={selectedPhoto.caption}
        backSrc={selectedPhoto.backSrc}
        backCaption={selectedPhoto.backCaption}
        faces={getLightboxFacesFromPhoto(selectedPhoto, getPersons())}
        open
        onClose={() => setLightboxOpen(false)}
      />
    );

  if (inline) {
    return (
      <>
        {spreadContent}
        {lightbox}
      </>
    );
  }

  return (
    <>
      {lightbox}
      <div
        className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4"
        onClick={onClose}
        role="presentation"
      >
        <div
          className="flex w-full flex-col gap-2"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal
          aria-label={getFullName(person)}
        >
          <div className="overflow-hidden rounded-lg shadow-xl">
            {spreadContent}
          </div>
        </div>
      </div>
    </>
  );
}
