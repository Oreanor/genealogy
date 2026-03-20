/** localStorage keys for app settings (page color, language, admin data). */
export const STORAGE_KEYS = {
  paperColor: 'genealogy-paper-color',
  locale: 'genealogy-locale',
  /** One-shot flag to prevent auto-redirect overriding explicit language choice. */
  localeExplicitNav: 'genealogy-locale-explicit-nav',
  adminTab: 'genealogy-admin-tab',
  adminData: 'genealogy-admin-data',
  /** Person ids whose first/last/patronymic were edited in admin — do not auto-replace with locale template. */
  personNameLocks: 'genealogy-person-name-locks',
} as const;

/** Cookie for redirect to last admin tab (read by proxy) */
export const ADMIN_TAB_COOKIE = 'genealogy-admin-tab';

export const ADMIN_TAB_IDS = ['persons', 'texts', 'photos'] as const;
export type AdminTabId = (typeof ADMIN_TAB_IDS)[number];
