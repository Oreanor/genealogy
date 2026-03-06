'use client';

import { useState } from 'react';
import { CONTENT_LINK_CLASS } from '@/lib/constants/theme';
import { getPersonById, getPersons } from '@/lib/data/persons';
import { getPhotosByPerson, getLightboxFacesFromPhoto } from '@/lib/data/photos';
import { getHistoryEntriesByPerson } from '@/lib/data/history';
import { formatLifeDates, getFullName } from '@/lib/utils/person';
import { getChildren, getCousins, getSpouse, getSiblings } from '@/lib/data/familyRelations';
import type { Person } from '@/lib/types/person';
import { useLocaleRoutes } from '@/lib/i18n/context';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ImageLightbox } from '@/components/ui/ImageLightbox';

interface PersonCardProps {
  person: Person;
}

export function PersonCard({ person }: PersonCardProps) {
  const { t, routes } = useLocaleRoutes();
  const pathname = usePathname() ?? '';
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const children = getChildren(person.id);
  const siblings = getSiblings(person.id);
  const cousins = getCousins(person.id);
  const personPhotos = getPhotosByPerson(person.id);
  const historyMentions = getHistoryEntriesByPerson(person.id);
  const parents = [person.fatherId, person.motherId]
    .filter(Boolean)
    .map((id) => getPersonById(id as string))
    .filter((p): p is Person => p != null);
  const spouse = getSpouse(person.id);

  return (
    <div className="flex flex-col gap-6">
      <h2 className="book-serif text-2xl font-semibold text-(--ink)">{getFullName(person)}</h2>
      {(parents.length > 0 || children.length > 0 || siblings.length > 0 || cousins.length > 0 || spouse) && (
        <div className="space-y-3 text-(--ink)">
          {spouse && (
            <p>
              <span className="font-medium">
                {spouse.gender === 'f' ? t('spouseF') : t('spouseM')}
              </span>{' '}
              <Link href={routes.person(spouse.id)} className={CONTENT_LINK_CLASS}>
                {getFullName(spouse)}
              </Link>
            </p>
          )}
          {parents.length > 0 && (
            <p>
              <span className="font-medium">{t('parents')}</span>{' '}
              {parents.map((p, i) => (
                <span key={p.id}>
                  {i > 0 && ', '}
                  <Link href={routes.person(p.id)} className={CONTENT_LINK_CLASS}>
                    {getFullName(p)}
                  </Link>
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
                  <Link href={routes.person(c.id)} className={CONTENT_LINK_CLASS}>
                    {getFullName(c)}
                  </Link>
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
                  <Link href={routes.person(s.id)} className={CONTENT_LINK_CLASS}>
                    {getFullName(s)}
                  </Link>
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
                  <Link href={routes.person(c.id)} className={CONTENT_LINK_CLASS}>
                    {getFullName(c)}
                  </Link>
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
        <div className="space-y-2">
          <h3 className="text-base font-medium text-(--ink)">{t('personMentionedInStories')}</h3>
          <ul className="flex flex-wrap gap-3">
            {historyMentions.map(({ entry, index }) => (
              <li key={index}>
                <Link
                  href={`${pathname}?section=history&entry=${index}`}
                  className={`rounded px-3 py-2 text-base ${CONTENT_LINK_CLASS}`}
                >
                  {entry.title || `${t('chapters_history')} ${index + 1}`}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      {personPhotos.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-base font-medium text-(--ink)">{t('personPhotos')}</h3>
          <ul className="flex flex-wrap gap-3">
            {personPhotos.map((photo, index) => (
              <li key={photo.src}>
                <button
                  type="button"
                  className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-(--border-subtle) bg-(--paper-light) transition-opacity hover:opacity-90 focus:outline-none"
                  onClick={() => setLightboxIndex(index)}
                  aria-label={photo.caption || t('openFullscreen')}
                >
                  <Image
                    src={photo.src}
                    alt={photo.caption || ''}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </button>
              </li>
            ))}
          </ul>
          {lightboxIndex !== null && (() => {
            const photo = personPhotos[lightboxIndex];
            return photo ? (
              <ImageLightbox
                src={photo.src}
                alt={photo.caption || ''}
                caption={photo.caption}
                faces={getLightboxFacesFromPhoto(photo, getPersons())}
                open
                onClose={() => setLightboxIndex(null)}
              />
            ) : null;
          })()}
        </div>
      )}
    </div>
  );
}
