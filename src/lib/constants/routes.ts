import { CHAPTER_IDS } from './chapters';

export const ROUTES = {
  home: '/',
  chapter: (slug: string) => `/glava/${slug}`,
  chapterSpread: (slug: string, spreadIndex: number) =>
    `/glava/${slug}?spread=${spreadIndex}`,
  person: (personId: string) => `/glava/${CHAPTER_IDS.PERSONS}?id=${personId}`,
} as const;
