/** Путь к обложке/титульной фотографии (в public/). Пустая строка = заглушка */
export const COVER_IMAGE = '';

export const CHAPTERS = [
  { id: 'semejnoe-drevo', title: 'Семейное древо' },
  { id: 'persony', title: 'Персоны' },
  { id: 'istoriya', title: 'История' },
  { id: 'foto', title: 'Фото' },
  { id: 'drugie-materialy', title: 'Другие материалы' },
] as const;

export type ChapterId = (typeof CHAPTERS)[number]['id'];

export const CHAPTER_IDS = {
  TREE: 'semejnoe-drevo',
  PERSONS: 'persony',
  HISTORY: 'istoriya',
  PHOTOS: 'foto',
  OTHER: 'drugie-materialy',
} as const satisfies Record<string, ChapterId>;

/** ID персоны «я» (корень древа снизу) */
export const ROOT_PERSON_ID = 'person-1';
