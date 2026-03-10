'use client';

import { useEffect, useState } from 'react';
import { CONTENT_LINK_CLASS } from '@/lib/constants/theme';
import { getPersonById } from '@/lib/data/persons';
import { getPhotosByPerson, getLightboxFacesFromPhoto } from '@/lib/data/photos';
import { getHistoryEntriesByPerson } from '@/lib/data/history';
import { formatLifeDates, getFullName } from '@/lib/utils/person';
import { getChildren, getCousins, getSecondCousins, getSpouse, getSiblings } from '@/lib/data/familyRelations';
import { getKinship } from '@/lib/utils/kinship';
import type { Person } from '@/lib/types/person';
import type { PhotoEntry } from '@/lib/types/photo';
import { useTranslations } from '@/lib/i18n/context';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { BookSpread } from '@/components/book/BookSpread';
import { BookPage } from '@/components/book/BookPage';
import { getPersons } from '@/lib/data/persons';
import { List, ListX } from 'lucide-react';

function RelativesGroup({
  label,
  relatives,
  originId,
  linkProps,
  t,
}: {
  label: string;
  relatives: Person[];
  originId: string;
  linkProps: (id: string) => Record<string, unknown>;
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
              <button type="button" {...linkProps(r.id)}>
                {getFullName(r)}
              </button>
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

interface PersonDetailPanelProps {
  person: Person;
  onClose: () => void;
  onSelectPerson: (personId: string) => void;
}

function PersonInfoContent({
  person,
  pathname,
  personPhotos,
  onSelectPerson,
  onPhotoClick,
}: {
  person: Person;
  pathname: string;
  personPhotos: PhotoEntry[];
  onSelectPerson: (id: string) => void;
  onPhotoClick: (photo: PhotoEntry) => void;
}) {
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

  const linkProps = (id: string) => ({
    className: CONTENT_LINK_CLASS,
    onClick: (e: React.MouseEvent) => {
      e.preventDefault();
      onSelectPerson(id);
    },
    role: 'button' as const,
  });

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
              <button type="button" {...linkProps(spouse.id)}>
                {getFullName(spouse)}
              </button>
            </p>
          )}
          {parents.length > 0 && (
            <p>
              <span className="font-medium">{t('parents')}</span>{' '}
              {parents.map((p, i) => (
                <span key={p.id}>
                  {i > 0 && ', '}
                  <button type="button" {...linkProps(p.id)}>
                    {getFullName(p)}
                  </button>
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
                  <button type="button" {...linkProps(c.id)}>
                    {getFullName(c)}
                  </button>
                </span>
              ))}
            </p>
          )}
          <RelativesGroup
            label={t('siblings')}
            relatives={siblings}
            originId={person.id}
            linkProps={linkProps}
            t={t}
          />
          <RelativesGroup
            label={t('cousins')}
            relatives={cousins}
            originId={person.id}
            linkProps={linkProps}
            t={t}
          />
          <RelativesGroup
            label={t('secondCousins')}
            relatives={secondCousins}
            originId={person.id}
            linkProps={linkProps}
            t={t}
          />
        </div>
      )}
      {(person.birthDate || person.deathDate) && (
        <p className="text-(--ink)">
          <span className="font-medium">{t('years')}</span>{' '}
          {formatLifeDates(person.birthDate, person.deathDate)}
        </p>
      )}
      {person.birthPlace && (
        <p className="text-(--ink)">
          <span className="font-medium">{t('birthPlace')}</span> {person.birthPlace}
        </p>
      )}
      {person.occupation && (
        <p className="text-(--ink)">
          <span className="font-medium">{t('occupation')}</span> {person.occupation}
        </p>
      )}
      {person.residenceCity && (
        <p className="text-(--ink)">
          <span className="font-medium">{t('residenceCity')}</span> {person.residenceCity}
        </p>
      )}
      {person.comment && (
        <p className="text-(--ink)">
          <span className="font-medium">{t('comment')}</span> {person.comment}
        </p>
      )}
      <div className="space-y-2">
        <h3 className="text-base font-semibold text-(--ink)">{t('personMentionedInStories')}</h3>
        {historyMentions.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {historyMentions.map(({ entry, index }) => (
              <li key={index}>
                <Link
                  href={`${pathname}?section=history&entry=${index}`}
                  className={`rounded px-2 py-1 text-sm ${CONTENT_LINK_CLASS}`}
                >
                  {entry.title || `${t('chapters_history')} ${index + 1}`}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-(--ink-muted)">{t('noTextsYet')}</p>
        )}
      </div>
      <div className="space-y-2">
        <h3 className="text-base font-semibold text-(--ink)">{t('personPhotos')}</h3>
        {personPhotos.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {personPhotos.map((photo) => (
              <button
                key={photo.src}
                type="button"
                className="relative h-14 w-14 shrink-0 overflow-hidden rounded border border-(--border-subtle) bg-(--paper-light) transition-opacity hover:opacity-80 focus:outline-none"
                onClick={() => onPhotoClick(photo)}
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
        ) : (
          <p className="text-sm text-(--ink-muted)">{t('noPhotosYet')}</p>
        )}
      </div>
    </div>
  );
}

function RightPageContent({
  photo,
  showFaces,
}: {
  photo: PhotoEntry | null;
  showFaces: boolean;
}) {
  const t = useTranslations();

  if (photo) {
    const persons = getPersons();
    const faces = getLightboxFacesFromPhoto(photo, persons);
    const hasFaces = faces.length > 0;

    return (
      <div className="relative flex-1 overflow-hidden rounded bg-(--paper-light)">
        <Image
          src={photo.src}
          alt={photo.caption ?? ''}
          fill
          className="object-contain"
          sizes="(max-width: 600px) 100vw, 50vw"
        />
        {hasFaces && (
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
              className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded bg-black/60 text-white hover:bg-black/80 focus:outline-none"
              title={showFaces ? t('lightboxHideLabels') : t('lightboxShowLabels')}
              aria-label={showFaces ? t('lightboxHideLabels') : t('lightboxShowLabels')}
            >
              {showFaces ? <ListX className="size-[16px]" /> : <List className="size-[16px]" />}
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center text-center text-sm text-(--ink-muted)">
      {t('noPhotosYet')}
    </div>
  );
}

export function PersonDetailPanel({ person, onClose, onSelectPerson }: PersonDetailPanelProps) {
  const pathname = usePathname() ?? '';
  const personPhotos = getPhotosByPerson(person.id);
  const firstPhoto = personPhotos[0] ?? null;
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoEntry | null>(firstPhoto);
  const [showFaces, setShowFaces] = useState(false);
  const t = useTranslations();

  useEffect(() => {
    setSelectedPhoto(firstPhoto);
  }, [firstPhoto]);

  return (
    <>
      <div
        className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4"
        onClick={onClose}
        role="presentation"
      >
        <div
          className="flex w-full max-w-4xl flex-col gap-2"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal
          aria-label={getFullName(person)}
        >
          <div className="overflow-hidden rounded-lg shadow-xl">
            <BookSpread
              left={
                <BookPage className="overflow-y-auto">
                  <PersonInfoContent
                    person={person}
                    pathname={pathname}
                    personPhotos={personPhotos}
                    onSelectPerson={onSelectPerson}
                      onPhotoClick={(photo) => setSelectedPhoto(photo)}
                  />
                </BookPage>
              }
              right={
                <BookPage className="flex flex-col overflow-hidden">
                  <RightPageContent
                      photo={selectedPhoto}
                      showFaces={showFaces}
                    />
                    {selectedPhoto && (
                      <button
                        type="button"
                        onClick={() => setShowFaces((v) => !v)}
                        className="mt-2 self-end rounded bg-black/60 px-2 py-1 text-xs text-white hover:bg-black/80 focus:outline-none"
                      >
                        {showFaces ? t('lightboxHideLabels') : t('lightboxShowLabels')}
                      </button>
                    )}
                    {selectedPhoto?.caption && (
                      <p className="mt-2 text-center text-sm text-(--ink)">
                        {selectedPhoto.caption}
                      </p>
                    )}
                </BookPage>
              }
            />
          </div>
        </div>
      </div>
    </>
  );
}
