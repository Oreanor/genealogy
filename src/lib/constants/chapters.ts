/** Slugs for legacy `/chapter/[slug]` redirects. Titles for UI live in i18n (`chapters_*` keys), not here. */
export const CHAPTERS = [
  { id: 'family-tree' },
  { id: 'persons' },
  { id: 'history' },
  { id: 'photos' },
];

export type ChapterId = (typeof CHAPTERS)[number]['id'];

export const CHAPTER_IDS = {
  TREE: 'family-tree',
  PERSONS: 'persons',
  HISTORY: 'history',
  PHOTOS: 'photos',
} satisfies Record<string, ChapterId>;

/** ID of the root person (self, bottom of tree). Format: p001, p002, … */
export const ROOT_PERSON_ID = 'p001';
