import { ROUTES } from '@/lib/constants/routes';
import { getPersonById } from '@/lib/data/persons';
import { getChildren, getSiblings } from '@/lib/utils/person';
import type { Person } from '@/lib/types/person';
import Link from 'next/link';

const linkClass = 'text-amber-800 underline hover:text-amber-900';

interface PersonCardProps {
  person: Person;
}

export function PersonCard({ person }: PersonCardProps) {
  const children = getChildren(person.id);
  const siblings = getSiblings(person.id);
  const parents = person.parentIds
    .map((id) => getPersonById(id))
    .filter((p): p is Person => p != null);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-semibold text-[var(--ink)]">{person.name}</h2>
      {(parents.length > 0 || children.length > 0 || siblings.length > 0) && (
        <div className="space-y-2 text-[var(--ink)]">
          {parents.length > 0 && (
            <p>
              <span className="font-medium">Родители:</span>{' '}
              {parents.map((p, i) => (
                <span key={p.id}>
                  {i > 0 && ', '}
                  <Link href={ROUTES.person(p.id)} className={linkClass}>
                    {p.name}
                  </Link>
                </span>
              ))}
            </p>
          )}
          {children.length > 0 && (
            <p>
              <span className="font-medium">Дети:</span>{' '}
              {children.map((c, i) => (
                <span key={c.id}>
                  {i > 0 && ', '}
                  <Link href={ROUTES.person(c.id)} className={linkClass}>
                    {c.name}
                  </Link>
                </span>
              ))}
            </p>
          )}
          {siblings.length > 0 && (
            <p>
              <span className="font-medium">Братья и сёстры:</span>{' '}
              {siblings.map((s, i) => (
                <span key={s.id}>
                  {i > 0 && ', '}
                  <Link href={ROUTES.person(s.id)} className={linkClass}>
                    {s.name}
                  </Link>
                </span>
              ))}
            </p>
          )}
        </div>
      )}
      {person.birthYears && (
        <p className="text-[var(--ink)]">
          <span className="font-medium">Годы:</span> {person.birthYears}
        </p>
      )}
      {person.birthPlace && (
        <p className="text-[var(--ink)]">
          <span className="font-medium">Место рождения:</span> {person.birthPlace}
        </p>
      )}
      {person.occupation && (
        <p className="text-[var(--ink)]">
          <span className="font-medium">Род занятий:</span> {person.occupation}
        </p>
      )}
    </div>
  );
}
