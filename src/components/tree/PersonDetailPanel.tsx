'use client';

import { useState } from 'react';
import { CONTENT_LINK_CLASS } from '@/lib/constants/theme';
import { getPersonById, getPersons } from '@/lib/data/persons';
import {
  getPhotosByPerson,
  getAvatarForPerson,
  getLightboxFacesFromPhoto,
} from '@/lib/data/photos';
import { getHistoryEntriesByPerson } from '@/lib/data/history';
import { formatLifeDates, getFullName } from '@/lib/utils/person';
import { getChildren, getCousins, getSpouse, getSiblings } from '@/lib/data/familyRelations';
import type { Person } from '@/lib/types/person';
import type { PhotoEntry } from '@/lib/types/photo';
import { useTranslations } from '@/lib/i18n/context';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ImageLightbox } from '@/components/ui/ImageLightbox';
import { BookSpread } from '@/components/book/BookSpread';
import { BookPage } from '@/components/book/BookPage';

interface PersonDetailPanelProps {
  person: Person;
  onClose: () => void;
  onSelectPerson: (personId: string) => void;
}

function PersonInfoContent({
  person,
  pathname,
  onSelectPerson,
}: {
  person: Person;
  pathname: string;
  onSelectPerson: (id: string) => void;
}) {
  const t = useTranslations();
  const children = getChildren(person.id);
  const siblings = getSiblings(person.id);
  const cousins = getCousins(person.id);
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
    <div className="flex flex-col gap-4 overflow-y-auto">
      <h2 className="book-serif text-2xl font-semibold text-(--ink)">{getFullName(person)}</h2>
      {(parents.length > 0 || children.length > 0 || siblings.length > 0 || cousins.length > 0 || spouse) && (
        <div className="space-y-2 text-(--ink)">
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
          {siblings.length > 0 && (
            <p>
              <span className="font-medium">{t('siblings')}</span>{' '}
              {siblings.map((s, i) => (
                <span key={s.id}>
                  {i > 0 && ', '}
                  <button type="button" {...linkProps(s.id)}>
                    {getFullName(s)}
                  </button>
                </span>
              ))}
            </p>
          )}
          {cousins.length > 0 && (
            <p>
              <span className="font-medium">{t('cousins')}</span>{' '}
              {cousins.map((c, i) => (
                <span key={c.id}>
                  {i > 0 && ', '}
                  <button type="button" {...linkProps(c.id)}>
                    {getFullName(c)}
                  </button>
                </span>
              ))}
            </p>
          )}
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
      {historyMentions.length > 0 && (
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-(--ink)">{t('personMentionedInStories')}</h3>
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
        </div>
      )}
    </div>
  );
}

export function PersonDetailPanel({ person, onClose, onSelectPerson }: PersonDetailPanelProps) {
  const t = useTranslations();
  const pathname = usePathname() ?? '';
  const personPhotos = getPhotosByPerson(person.id);
  const avatarSource = getAvatarForPerson(person.id, person.avatarPhotoSrc);
  const [largePhoto, setLargePhoto] = useState<PhotoEntry | null>(() => {
    if (avatarSource) {
      const entry = personPhotos.find((p) => p.src === avatarSource.src) ?? null;
      return entry;
    }
    return personPhotos[0] ?? null;
  });
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const persons = getPersons();

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
                    onSelectPerson={onSelectPerson}
                  />
                </BookPage>
              }
              right={
                <BookPage className="flex flex-col gap-3 overflow-hidden">
                  <div className="flex min-h-0 flex-1 flex-col gap-3">
                    {largePhoto ? (
                      <button
                        type="button"
                        className="relative min-h-[200px] flex-1 overflow-hidden rounded bg-(--paper-light) focus:outline-none"
                        onClick={() => setLightboxOpen(true)}
                        aria-label={t('openFullscreen')}
                      >
                        <Image
                          src={largePhoto.src}
                          alt={largePhoto.caption ?? ''}
                          fill
                          className="object-contain"
                          sizes="(max-width: 600px) 100vw, 50vw"
                        />
                      </button>
                    ) : (
                      <div className="flex min-h-[200px] flex-1 items-center justify-center rounded bg-(--paper-light) text-(--ink-muted)">
                        {t('personPhotos')}
                      </div>
                    )}
                    {personPhotos.length > 0 && (
                      <div className="shrink-0">
                        <p className="mb-1 text-xs font-medium text-(--ink-muted)">
                          {t('personPhotos')}
                        </p>
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {personPhotos.map((photo) => (
                            <button
                              key={photo.src}
                              type="button"
                              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded border-2 transition-colors focus:outline-none ${
                                largePhoto?.src === photo.src
                                  ? 'border-(--accent)'
                                  : 'border-transparent hover:border-(--border-subtle)'
                              }`}
                              onClick={() => setLargePhoto(photo)}
                              aria-label={photo.caption ?? photo.id}
                            >
                              <Image
                                src={photo.src}
                                alt=""
                                fill
                                className="object-cover"
                                sizes="64px"
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </BookPage>
              }
            />
          </div>
        </div>
      </div>
      {lightboxOpen && largePhoto && (
        <ImageLightbox
          src={largePhoto.src}
          alt={largePhoto.caption ?? ''}
          caption={largePhoto.caption}
          faces={getLightboxFacesFromPhoto(largePhoto, persons)}
          open
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}
