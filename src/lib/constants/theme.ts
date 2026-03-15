/** Shared toolbar button (BookToolbar, AdminButton, LocaleSwitcher) */
export const TOOLBAR_BUTTON_CLASS =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-(--border) bg-(--paper) shadow-md transition-shadow hover:shadow-lg md:h-11 md:w-11';

/** Class for content links (person card, RichText) — color from theme */
export const CONTENT_LINK_CLASS =
  'text-(--link) underline hover:text-(--link-hover)';

/** Shared class for section headings inside the book (serif, responsive size) */
export const SECTION_HEADING_CLASS =
  'book-serif mb-5 text-xl font-semibold text-(--ink) md:text-2xl lg:text-3xl';

/** Drop shadow under the book container (spread / tree block) — same everywhere. Use BOOK_SPREAD_SHADOW_MD where shadow only on desktop. */
export const BOOK_SPREAD_SHADOW = 'shadow-xl';
export const BOOK_SPREAD_SHADOW_MD = 'md:shadow-xl';
