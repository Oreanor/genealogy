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
} satisfies Record<string, string>;

/** Cookie for redirect to last admin tab (read by proxy) */
export const ADMIN_TAB_COOKIE = 'genealogy-admin-tab';

export type AdminTabId = 'persons' | 'texts' | 'photos';

export const ADMIN_TAB_IDS: readonly AdminTabId[] = ['persons', 'texts', 'photos'];

export function isAdminTabId(value: string): value is AdminTabId {
  return ADMIN_TAB_IDS.some((id) => id === value);
}
