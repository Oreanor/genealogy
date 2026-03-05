'use client';

import { useState } from 'react';
import { CONTENT_LINK_CLASS } from '@/lib/constants/theme';
import { getPersonById } from '@/lib/data/persons';
import { getPhotosByPerson } from '@/lib/data/photos';
import { formatLifeDates, getChildren, getCousins, getFullName, getSpouse, getSiblings } from '@/lib/utils/person';
import type { Person } from '@/lib/types/person';
import { useLocaleRoutes } from '@/lib/i18n/context';
import Link from 'next/link';
import Image from 'next/image';
import { ImageLightbox } from '@/components/ui/ImageLightbox';

interface PersonCardProps {
  person: Person;
}

export function PersonCard({ person }: PersonCardProps) {
  const { t, routes } = useLocaleRoutes();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const children = getChildren(person.id);
  const siblings = getSiblings(person.id);
  const cousins = getCousins(person.id);
  const personPhotos = getPhotosByPerson(person.id);
  const parents = person.parentIds
    .map((id) => getPersonById(id))
    .filter((p): p is Person => p != null);
  const spouse = getSpouse(person.id);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="book-serif text-2xl font-semibold text-[var(--ink)]">{getFullName(person)}</h2>
      {(parents.length > 0 || children.length > 0 || siblings.length > 0 || cousins.length > 0 || spouse) && (
        <div className="space-y-2 text-[var(--ink)]">
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
        <p className="text-[var(--ink)]">
          <span className="font-medium">{t('years')}</span>{' '}
          {formatLifeDates(person.birthDate, person.deathDate)}
        </p>
      )}
      {person.birthPlace && (
        <p className="text-[var(--ink)]">
          <span className="font-medium">{t('birthPlace')}</span> {person.birthPlace}
        </p>
      )}
      {person.occupation && (
        <p className="text-[var(--ink)]">
          <span className="font-medium">{t('occupation')}</span> {person.occupation}
        </p>
      )}
      {personPhotos.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-[var(--ink)]">{t('personPhotos')}</h3>
          <ul className="flex flex-wrap gap-2">
            {personPhotos.map((photo, index) => (
              <li key={photo.src}>
                <button
                  type="button"
                  className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--paper-light)] transition-opacity hover:opacity-90 focus:outline-none"
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
