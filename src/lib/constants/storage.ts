/** Ключи localStorage для настроек приложения (цвет страниц, язык). */
export const STORAGE_KEYS = {
  paperColor: 'genealogy-paper-color',
  locale: 'genealogy-locale',
  adminTab: 'genealogy-admin-tab',
} as const;

/** Cookie для редиректа на последнюю вкладку админки (читает middleware) */
export const ADMIN_TAB_COOKIE = 'genealogy-admin-tab';

export const ADMIN_TAB_IDS = ['persons', 'texts', 'photos'] as const;
export type AdminTabId = (typeof ADMIN_TAB_IDS)[number];
