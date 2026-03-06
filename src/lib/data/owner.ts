import { getRootPersonId } from '@/lib/data/root';
import { getPersonById } from '@/lib/data/persons';

/** Family surname for book title: root person's lastName, or fallback */
export function getFamilySurname(): string {
  const root = getPersonById(getRootPersonId());
  const name = root?.lastName?.trim();
  return name ?? 'Семья';
}

/** Default book title (Russian) for metadata and SSR */
export function getDefaultBookTitle(): string {
  return `Родословная семьи ${getFamilySurname()}`;
}

/** Default description (Russian) for metadata */
export function getDefaultMetaDescription(): string {
  return `Интерактивный альбом-книга о родословной семьи ${getFamilySurname()}`;
}
