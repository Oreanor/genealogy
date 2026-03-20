import { getRootPersonId } from '@/lib/data/root';
import { getBundledPersons } from '@/lib/data/persons';
import { getMessages } from '@/lib/i18n/messages';
import { DEFAULT_LOCALE } from '@/lib/i18n/config';

/** Family surname for book title: root person's lastName, or fallback */
export function getFamilySurname(): string {
  const root = getBundledPersons().find((p) => p.id === getRootPersonId()) ?? null;
  const name = root?.lastName?.trim();
  if (name) return name;
  const templateLast = getMessages(DEFAULT_LOCALE).templateRootLastName?.trim();
  return templateLast || 'Family';
}

/** Default book title (Russian) for metadata and SSR */
export function getDefaultBookTitle(): string {
  return `Родословная семьи ${getFamilySurname()}`;
}

/** Default description (Russian) for metadata */
export function getDefaultMetaDescription(): string {
  return `Интерактивный альбом-книга о родословной семьи ${getFamilySurname()}`;
}
