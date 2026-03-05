/**
 * Album "owner" config. Changing the surname here updates book title and description
 * in all locales. Person data (names in data.json) is unchanged — branding only.
 */
export const FAMILY_SURNAME = 'Никонец';

/** Default book title (Russian) for metadata and SSR */
export function getDefaultBookTitle(): string {
  return `Родословная семьи ${FAMILY_SURNAME}`;
}

/** Default description (Russian) for metadata */
export function getDefaultMetaDescription(): string {
  return `Интерактивный альбом-книга о родословной семьи ${FAMILY_SURNAME}`;
}
