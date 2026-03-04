import type { Person } from '@/lib/types/person';

interface PersonCardProps {
  person: Person;
}

export function PersonCard({ person }: PersonCardProps) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-semibold text-[var(--ink)]">{person.name}</h2>
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
