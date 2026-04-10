import { CHAPTER_IDS } from './chapters';

/** Locale for building paths. String type because also called with locale from params. */
type LocaleParam = string;

const ADMIN_TAB_PARAM = 'tab';

export function getRoutes(locale: LocaleParam) {
  return {
    home: `/${locale}`,
    admin: `/${locale}/admin`,
    adminTab: (tab: string) => `/${locale}/admin?${ADMIN_TAB_PARAM}=${tab}`,
    /** Book section: tree | history | photos | persons */
    section: (section: string) => `/${locale}?section=${section}`,
    person: (personId: string) => `/${locale}?section=persons&id=${personId}`,
    /** Aliases for backward compatibility (redirect to home with section) */
    chapter: (slug: string) =>
      slug === CHAPTER_IDS.TREE ? `/${locale}` : `/${locale}?section=${slug}`,
    chapterSpread: (slug: string) =>
      slug === CHAPTER_IDS.TREE ? `/${locale}` : `/${locale}?section=${slug}`,
  };
}

