import { describe, expect, it } from 'vitest';
import type { Person } from '@/lib/types/person';
import {
  isEmptyPersonRow,
  nextPersonId,
  personIdNum,
  sortPersonsByColumn,
  sortPersonsDefault,
} from './adminPersonsTableUtils';

function makePerson(overrides: Partial<Person>): Person {
  return {
    id: 'p001',
    firstName: 'Ivan',
    lastName: 'Ivanov',
    ...overrides,
  };
}

describe('adminPersonsTableUtils', () => {
  it('detects numeric ids and empty rows', () => {
    expect(personIdNum('p007')).toBe(7);
    expect(Number.isNaN(personIdNum('custom-id'))).toBe(true);
    expect(
      isEmptyPersonRow(makePerson({ id: 'p100', firstName: '', lastName: '', patronymic: '' }))
    ).toBe(true);
    expect(isEmptyPersonRow(makePerson({ id: 'p101', firstName: 'Anna', lastName: '' }))).toBe(
      false
    );
  });

  it('sorts empty rows first and then by surname with id tie-break', () => {
    const persons = [
      makePerson({ id: 'p010', firstName: 'Boris', lastName: 'Petrov' }),
      makePerson({ id: 'p002', firstName: '', lastName: '', patronymic: '' }),
      makePerson({ id: 'p003', firstName: 'Anna', lastName: 'Ivanova' }),
      makePerson({ id: 'p001', firstName: 'Aleksei', lastName: 'Petrov' }),
    ];

    expect(sortPersonsDefault(persons).map((person) => person.id)).toEqual([
      'p002',
      'p003',
      'p001',
      'p010',
    ]);
  });

  it('sorts by selected column and generates next padded id', () => {
    const persons = [
      makePerson({ id: 'p001', firstName: 'Ivan', lastName: 'Sidorov', occupation: 'Teacher' }),
      makePerson({ id: 'p010', firstName: 'Anna', lastName: 'Ivanova', occupation: 'Doctor' }),
      makePerson({ id: 'custom', firstName: 'Boris', lastName: 'Petrov', occupation: 'Teacher' }),
    ];

    expect(sortPersonsByColumn(persons, 'occupation', 'asc').map((person) => person.id)).toEqual([
      'p010',
      'custom',
      'p001',
    ]);
    expect(nextPersonId(persons)).toBe('p011');
  });
});
