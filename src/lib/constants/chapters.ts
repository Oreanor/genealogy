/** Путь к обложке/титульной фотографии (в public/). Пустая строка = заглушка */
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

/** ID персоны «я» (корень древа снизу) */
export const ROOT_PERSON_ID = 'person-1';
