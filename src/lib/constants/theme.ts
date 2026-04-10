/**
 * Default “paper” when nothing valid is in localStorage (`genealogy-paper-color`).
 * Inline script in `layout` accepts any `#rrggbb` (same as PageColorPicker).
 */
export const DEFAULT_PAPER_COLOR = '#e7edf2';

/** Shared toolbar button (BookToolbar, AdminButton, LocaleSwitcher) */
export const TOOLBAR_BUTTON_CLASS =
  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-(--border) bg-(--paper) shadow-md transition-shadow hover:shadow-lg md:h-9 md:w-9';

/** Class for content links (person card, RichText) — color from theme */
export const CONTENT_LINK_CLASS =
  'text-(--link) underline hover:text-(--link-hover)';

/** Drop shadow under the book container (spread / tree block) — same everywhere. Use BOOK_SPREAD_SHADOW_MD where shadow only on desktop. */
export const BOOK_SPREAD_SHADOW = 'shadow-xl';
export const BOOK_SPREAD_SHADOW_MD = 'md:shadow-xl';
