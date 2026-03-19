'use client';

import { CONTENT_LINK_CLASS } from '@/lib/constants/theme';
import { getPersonById, getPersons } from '@/lib/data/persons';
import { getHistoryEntriesByPerson } from '@/lib/data/history';
import { getPhotosByPerson, getLightboxFacesFromPhoto, splitPersonPhotosForCarousels } from '@/lib/data/photos';
import { formatLifeDates, getFullName } from '@/lib/utils/person';
import { getChildren, getCousins, getSecondCousins, getSpouse, getSiblings } from '@/lib/data/familyRelations';
import { getKinship } from '@/lib/utils/kinship';
import type { Person } from '@/lib/types/person';
import type { PhotoEntry } from '@/lib/types/photo';
import { useTranslations } from '@/lib/i18n/context';
import Image from 'next/image';
import { List, ListX } from 'lucide-react';
import { PhotoThumbnails } from './PhotoThumbnails';

function RelativesGroup({
  label,
  relatives,
  originId,
  renderPersonLink,
  t,
}: {
  label: string;
  relatives: Person[];
  originId: string;
  renderPersonLink: (person: Person) => React.ReactNode;
  t: (key: string) => string;
}) {
  if (relatives.length === 0) return null;
  return (
    <div>
      <span className="font-medium">{label}</span>
      <ul className="mt-0.5 space-y-0.5 pl-3">
        {relatives.map((r) => {
          const kin = getKinship(originId, r.id);
          const kinLabel = kin ? t(kin.key) : '';
          return (
            <li key={r.id} className="flex items-baseline gap-1.5">
              {renderPersonLink(r)}
              {kinLabel && (
                <span className="text-xs text-(--ink-muted)">({kinLabel})</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export interface PersonSpreadLeftContentProps {
  person: Person;
  personPhotos: PhotoEntry[];
  /** Current big photo (for toggle back on same thumb). */
  selectedPhoto?: PhotoEntry | null;
  onPhotoClick: (photo: PhotoEntry, toggleBack?: boolean) => void;
  onHistoryClick: (index: number) => void;
  /** Render link/button for a relative (Link in persons section, button in tree). */
  renderPersonLink: (person: Person) => React.ReactNode;
}

export function PersonSpreadLeftContent({
  person,
  personPhotos,
  selectedPhoto = null,
  onPhotoClick,
  onHistoryClick,
  renderPersonLink,
}: PersonSpreadLeftContentProps) {
  const t = useTranslations();
  const children = getChildren(person.id);
  const siblings = getSiblings(person.id);
  const cousins = getCousins(person.id);
  const secondCousins = getSecondCousins(person.id);
  const historyMentions = getHistoryEntriesByPerson(person.id);
  const parents = [person.fatherId, person.motherId]
    .filter(Boolean)
    .map((id) => getPersonById(id as string))
    .filter((p): p is Person => p != null);
  const spouse = getSpouse(person.id);

  return (
    <div className="flex flex-col gap-5 overflow-y-auto">
      <h2 className="book-serif text-2xl font-semibold text-(--ink)">{getFullName(person)}</h2>
      {(parents.length > 0 || children.length > 0 || siblings.length > 0 || cousins.length > 0 || secondCousins.length > 0 || spouse) && (
        <div className="space-y-3 text-(--ink)">
          {spouse && (
            <p>
              <span className="font-medium">
                {spouse.gender === 'f' ? t('spouseF') : t('spouseM')}
              </span>{' '}
              {renderPersonLink(spouse)}
            </p>
          )}
          {parents.length > 0 && (
            <p>
              <span className="font-medium">{t('parents')}</span>{' '}
              {parents.map((p, i) => (
                <span key={p.id}>
                  {i > 0 && ', '}
                  {renderPersonLink(p)}
                </span>
              ))}
            </p>
          )}
          {children.length > 0 && (
            <p>
              <span className="font-medium">{t('children')}</span>{' '}
              {children.map((c, i) => (
                <span key={c.id}>
                  {i > 0 && ', '}
                  {renderPersonLink(c)}
                </span>
              ))}
            </p>
          )}
          <RelativesGroup
            label={t('siblings')}
            relatives={siblings}
            originId={person.id}
            renderPersonLink={renderPersonLink}
            t={t}
          />
          <RelativesGroup
            label={t('cousins')}
            relatives={cousins}
            originId={person.id}
            renderPersonLink={renderPersonLink}
            t={t}
          />
          <RelativesGroup
            label={t('secondCousins')}
            relatives={secondCousins}
            originId={person.id}
            renderPersonLink={renderPersonLink}
            t={t}
          />
        </div>
      )}
      <div className="space-y-2.5 text-(--ink)">
        {(person.birthDate || person.deathDate) && (
          <p>
            <span className="font-medium">{t('years')}</span>{' '}
            {formatLifeDates(person.birthDate, person.deathDate)}
          </p>
        )}
        {person.birthPlace && (
          <p>
            <span className="font-medium">{t('birthPlace')}</span> {person.birthPlace}
          </p>
        )}
        {person.occupation && (
          <p>
            <span className="font-medium">{t('occupation')}</span> {person.occupation}
          </p>
        )}
        {person.residenceCity && (
          <p>
            <span className="font-medium">{t('residenceCity')}</span> {person.residenceCity}
          </p>
        )}
        {person.comment && (
          <p>
            <span className="font-medium">{t('comment')}</span> {person.comment}
          </p>
        )}
      </div>
      <div className="space-y-3 pt-2">
        <h3 className="book-serif text-base font-semibold text-(--ink)">{t('personPhotos')}</h3>
        {personPhotos.length > 0 ? (
          (() => {
            const { noSeries, bySeries } = splitPersonPhotosForCarousels(personPhotos);
            return (
              <>
                {noSeries.length > 0 && (
                  <PhotoThumbnails
                    photos={noSeries}
                    selectedPhoto={selectedPhoto}
                    onSelect={onPhotoClick}
                  />
                )}
                {bySeries.map(({ seriesName, photos: seriesPhotos }) => (
                  <PhotoThumbnails
                    key={seriesName}
                    title={t('photoSeriesTitle', { name: seriesName })}
                    photos={seriesPhotos}
                    selectedPhoto={selectedPhoto}
                    onSelect={onPhotoClick}
                  />
                ))}
              </>
            );
          })()
        ) : (
          <p className="text-sm text-(--ink-muted)">{t('noPhotosYet')}</p>
        )}
      </div>
      <div className="space-y-2 pt-2">
        <h3 className="book-serif text-base font-semibold text-(--ink)">{t('personMentionedInStories')}</h3>
        {historyMentions.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {historyMentions.map(({ entry, index }) => (
              <li key={index}>
                <button
                  type="button"
                  onClick={() => onHistoryClick(index)}
                  className={`rounded px-2 py-1 text-sm ${CONTENT_LINK_CLASS}`}
                >
                  {entry.title || `${t('chapters_history')} ${index + 1}`}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-(--ink-muted)">{t('noTextsYet')}</p>
        )}
      </div>
    </div>
  );
}

export interface PersonSpreadRightContentProps {
  photo: PhotoEntry | null;
  showFaces: boolean;
  showBack: boolean;
  historyEntry: { title: string; richText: string } | null;
  onBigPhotoClick?: () => void;
  onToggleFaces: () => void;
  photoContainerRef?: React.RefObject<HTMLDivElement | null>;
  imageBounds?: { left: number; top: number; width: number; height: number } | null;
  onPhotoImageLoad?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  /** Caption to show below photo (when showing back, use backCaption). */
  caption?: string | null;
}

export function PersonSpreadRightContent({
  photo,
  showFaces,
  showBack,
  historyEntry,
  onBigPhotoClick,
  onToggleFaces,
  photoContainerRef,
  imageBounds,
  onPhotoImageLoad,
  caption,
}: PersonSpreadRightContentProps) {
  const t = useTranslations();

  if (historyEntry) {
    return (
      <div className="flex-1 overflow-y-auto">
        <h3 className="book-serif text-xl font-semibold text-(--ink) mb-4">
          {historyEntry.title}
        </h3>
        <div
          className="book-serif prose-sm text-(--ink) leading-relaxed"
          dangerouslySetInnerHTML={{ __html: historyEntry.richText }}
        />
      </div>
    );
  }

  if (!photo) {
    return (
      <div className="flex flex-1 items-center justify-center text-center text-sm text-(--ink-muted)">
        {t('noMediaData')}
      </div>
    );
  }

  const persons = getPersons();
  const faces = getLightboxFacesFromPhoto(photo, persons);
  const hasFaces = faces.length > 0;
  const hasBack = Boolean(photo.backSrc);
  const displaySrc = hasBack && showBack && photo.backSrc ? photo.backSrc : photo.src;
  const displayCaption = hasBack && showBack && photo.backCaption != null ? photo.backCaption : photo.caption;
  const bounds = imageBounds ?? { left: 0, top: 0, width: 100, height: 100 };

  const imageBlock = (
    <>
      <Image
        src={displaySrc}
        alt={displayCaption ?? ''}
        fill
        className="object-contain"
        sizes="(max-width: 600px) 100vw, 50vw"
        onLoad={onPhotoImageLoad}
      />
      {hasFaces &&
        !(hasBack && showBack) &&
        showFaces && (
          <div
            className="pointer-events-none absolute"
            style={{
              left: `${bounds.left}%`,
              top: `${bounds.top}%`,
              width: `${bounds.width}%`,
              height: `${bounds.height}%`,
            }}
          >
            {faces.map((face, i) => {
              const [l, t_, r, b] = face.coords;
              const w = r - l;
              const h = b - t_;
              return (
                <div key={`${i}-${face.displayName}`} className="absolute inset-0">
                  <div
                    className="absolute border-2 border-white/90"
                    style={{
                      left: `${l}%`,
                      top: `${t_}%`,
                      width: `${w}%`,
                      height: `${h}%`,
                    }}
                  />
                  <div
                    className="absolute rounded bg-black/75 px-2 py-0.5 text-xs font-medium text-white leading-tight text-center"
                    style={{
                      left: `${(l + r) / 2}%`,
                      top: `${b + 1}%`,
                      transform: 'translateX(-50%)',
                    }}
                  >
                    {face.lastName != null || face.firstName != null || face.patronymic != null ? (
                      <>
                        {face.lastName && <span className="block">{face.lastName}</span>}
                        {face.firstName && <span className="block">{face.firstName}</span>}
                        {face.patronymic && <span className="block">{face.patronymic}</span>}
                      </>
                    ) : (
                      face.displayName
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
    </>
  );

  return (
    <>
      <div
        ref={photoContainerRef}
        className="relative flex flex-1 min-h-0 overflow-hidden rounded bg-(--paper-light)"
      >
        {onBigPhotoClick ? (
          <button
            type="button"
            className="relative h-full w-full cursor-pointer focus:outline-none"
            onClick={onBigPhotoClick}
            aria-label={t('openFullscreen')}
          >
            <div className="relative h-full w-full">{imageBlock}</div>
          </button>
        ) : (
          <div className="relative h-full w-full">{imageBlock}</div>
        )}
        {hasFaces && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onToggleFaces();
            }}
            className={`absolute bottom-2 right-2 z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded bg-black/60 text-white hover:bg-black/80 focus:outline-none ${hasBack && showBack ? 'invisible pointer-events-none' : ''}`}
            title={showFaces ? t('lightboxHideLabels') : t('lightboxShowLabels')}
            aria-label={showFaces ? t('lightboxHideLabels') : t('lightboxShowLabels')}
          >
            {showFaces ? <ListX className="size-[18px]" /> : <List className="size-[18px]" />}
          </button>
        )}
      </div>
      {caption != null && caption !== '' && (
        <p className="mt-2 text-center text-sm text-(--ink)">
          {caption}
        </p>
      )}
    </>
  );
}
