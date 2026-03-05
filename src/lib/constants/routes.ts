import { CHAPTER_IDS } from './chapters';

/** Локаль для построения путей. Тип строки, т.к. вызывается и с locale из params. */
type LocaleParam = string;

const ADMIN_TAB_PARAM = 'tab';

export function getRoutes(locale: LocaleParam) {
  return {
    home: `/${locale}`,
    admin: `/${locale}/admin`,
    adminTab: (tab: string) => `/${locale}/admin?${ADMIN_TAB_PARAM}=${tab}`,
    /** Секция книги: tree | history | photos | persons */
    section: (section: string) => `/${locale}?section=${section}`,
    person: (personId: string) => `/${locale}?section=persons&id=${personId}`,
    /** Алиасы для обратной совместимости (редирект на главную с section) */
    chapter: (slug: string) =>
      slug === CHAPTER_IDS.TREE ? `/${locale}` : `/${locale}?section=${slug}`,
    chapterSpread: (slug: string) =>
      slug === CHAPTER_IDS.TREE ? `/${locale}` : `/${locale}?section=${slug}`,
  } as const;
}

