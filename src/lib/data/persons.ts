import type { Person } from '@/lib/types/person';
import personsData from '@/data/persons.json';

const persons = personsData as Person[];

export function getPersons(): Person[] {
  return persons;
}

export function getPersonById(id: string): Person | null {
  return persons.find((p) => p.id === id) ?? null;
}
