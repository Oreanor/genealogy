import type { Person } from '@/lib/types/person';
import appData from '@/data/data.json';

const persons = (appData as { persons: Person[] }).persons;

export function getPersons(): Person[] {
  return persons;
}

export function getPersonById(id: string): Person | null {
  return persons.find((p) => p.id === id) ?? null;
}
