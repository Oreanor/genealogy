'use client';

import { useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useLocaleRoutes } from '@/lib/i18n/context';
import { BookSpread } from './BookSpread';
import { BookPage } from './BookPage';
import { PersonCard } from '@/components/content/PersonCard';
import { getPersons } from '@/lib/data/persons';
import { sortPersonsBySurname, personMatchesSearch, getFullName } from '@/lib/utils/person';
import Link from 'next/link';
import { SearchField } from '@/components/ui/molecules/SearchField';
import { SECTION_HEADING_CLASS } from '@/lib/constants/theme';

export function PersonsSection() {
  const searchParams = useSearchParams();
  const { t, routes } = useLocaleRoutes();
  const [personsSearch, setPersonsSearch] = useState('');

  const persons = getPersons();
  const personId = searchParams.get('id');
  const selectedPerson = personId ? persons.find((p) => p.id === personId) : null;

  const filteredSortedPersons = useMemo(() => {
    return sortPersonsBySurname(persons).filter((p) =>
      personMatchesSearch(p, personsSearch)
    );
  }, [persons, personsSearch]);

  return (
    <BookSpread
      left={
        <BookPage>
          <h1 className={SECTION_HEADING_CLASS}>
            {t('chapters_persons')}
          </h1>
          <div className="mt-6">
            <SearchField
              placeholder={t('personsSearchPlaceholder')}
              value={personsSearch}
              onChange={(e) => setPersonsSearch(e.target.value)}
              aria-label={t('personsSearchPlaceholder')}
            />
          </div>
          <ul className="mt-4 flex-1 min-h-0 overflow-y-auto">
            {filteredSortedPersons.length === 0 ? (
              <li className="text-(--ink-muted)">{t('unknown')}</li>
            ) : (
              filteredSortedPersons.map((person, idx) => {
                const name = getFullName(person) || person.id;
                const letter = (person.lastName || name).charAt(0).toUpperCase();
                const prevPerson = filteredSortedPersons[idx - 1];
                const prevLetter = prevPerson
                  ? (prevPerson.lastName || getFullName(prevPerson) || prevPerson.id).charAt(0).toUpperCase()
                  : '';
                const showLetter = letter !== prevLetter;
                return (
                  <li key={person.id}>
                    {showLetter && (
                      <div className="mt-3 mb-1 px-3 text-lg font-bold text-(--ink-muted)" aria-hidden>
                        {letter}
                      </div>
                    )}
                    <Link
                      href={routes.person(person.id)}
                      className={`block rounded-md px-3 py-1 text-sm text-(--ink) no-underline transition-colors hover:bg-(--paper-light) ${selectedPerson?.id === person.id ? 'bg-(--paper-light) font-medium' : ''}`}
                    >
                      {name}
                    </Link>
                  </li>
                );
              })
            )}
          </ul>
        </BookPage>
      }
      right={
        <BookPage>
          <div className="flex h-full min-h-0 flex-col overflow-y-auto">
            {selectedPerson ? (
              <PersonCard person={selectedPerson} />
            ) : (
              <p className="text-(--ink-muted) py-6 text-base">
                {t('personsSelectHint')}
              </p>
            )}
          </div>
        </BookPage>
      }
    />
  );
}
