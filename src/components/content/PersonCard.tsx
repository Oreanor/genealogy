'use client';

import { CONTENT_LINK_CLASS } from '@/lib/constants/theme';
import { getPersonById } from '@/lib/data/persons';
import { getChildren, getCousins, getSpouse, getSiblings } from '@/lib/utils/person';
import type { Person } from '@/lib/types/person';
import { useLocaleRoutes } from '@/lib/i18n/context';
import Link from 'next/link';

interface PersonCardProps {
  person: Person;
}

export function PersonCard({ person }: PersonCardProps) {
  const { t, routes } = useLocaleRoutes();
  const children = getChildren(person.id);
  const siblings = getSiblings(person.id);
  const cousins = getCousins(person.id);
  const parents = person.parentIds
    .map((id) => getPersonById(id))
    .filter((p): p is Person => p != null);
  const spouse = getSpouse(person.id);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-semibold text-[var(--ink)]">{person.name}</h2>
      {(parents.length > 0 || children.length > 0 || siblings.length > 0 || cousins.length > 0 || spouse) && (
        <div className="space-y-2 text-[var(--ink)]">
          {spouse && (
            <p>
              <span className="font-medium">
                {spouse.gender === 'f' ? t('spouseF') : t('spouseM')}
              </span>{' '}
              <Link href={routes.person(spouse.id)} className={CONTENT_LINK_CLASS}>
                {spouse.name}
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
                    {p.name}
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
                    {c.name}
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
                    {s.name}
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
                    {c.name}
                  </Link>
                </span>
              ))}
            </p>
          )}
        </div>
      )}
      {person.birthYears && (
        <p className="text-[var(--ink)]">
          <span className="font-medium">{t('years')}</span> {person.birthYears}
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
    </div>
  );
}
