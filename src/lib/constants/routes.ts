import { CHAPTER_IDS } from './chapters';

/** Локаль для построения путей. Тип строки, т.к. вызывается и с locale из params. */
type LocaleParam = string;

export function getRoutes(locale: LocaleParam) {
  return {
    home: `/${locale}`,
    chapter: (slug: string) => `/${locale}/glava/${slug}`,
    chapterSpread: (slug: string, spreadIndex: number) =>
      `/${locale}/glava/${slug}?spread=${spreadIndex}`,
    person: (personId: string) =>
      `/${locale}/glava/${CHAPTER_IDS.PERSONS}?id=${personId}`,
  } as const;
}

