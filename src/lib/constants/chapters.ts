/** Path to cover/title photo (in public/). Empty string = placeholder */
export const COVER_IMAGE = '';

export const CHAPTERS = [
  { id: 'family-tree', title: 'Семейное древо' },
  { id: 'persons', title: 'Персоны' },
  { id: 'history', title: 'Истории' },
  { id: 'photos', title: 'Фото' },
] as const;

export type ChapterId = (typeof CHAPTERS)[number]['id'];

export const CHAPTER_IDS = {
  TREE: 'family-tree',
  PERSONS: 'persons',
  HISTORY: 'history',
  PHOTOS: 'photos',
} as const satisfies Record<string, ChapterId>;

/** ID of the root person (self, bottom of tree). Format: p001, p002, … */
export const ROOT_PERSON_ID = 'p001';
