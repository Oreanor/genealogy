/** localStorage keys for app settings (page color, language). */
export const STORAGE_KEYS = {
  paperColor: 'genealogy-paper-color',
  locale: 'genealogy-locale',
  adminTab: 'genealogy-admin-tab',
} as const;

/** Cookie for redirect to last admin tab (read by middleware) */
export const ADMIN_TAB_COOKIE = 'genealogy-admin-tab';

export const ADMIN_TAB_IDS = ['persons', 'texts', 'photos'] as const;
export type AdminTabId = (typeof ADMIN_TAB_IDS)[number];
