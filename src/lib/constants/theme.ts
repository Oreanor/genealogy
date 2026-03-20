/** Light cool gray-blue — default “paper” (overcast / cloudy). */
export const DEFAULT_PAPER_COLOR = '#e7edf2';

/**
 * Preset paper colors accepted by the inline layout script and `theme-init`
 * (localStorage `genealogy-paper-color` must be one of these or it resets to default).
 */
export const PAPER_COLOR_PALETTE = [
  '#ffffff',
  '#e5e7eb',
  DEFAULT_PAPER_COLOR,
  '#9ca3af',
  '#374151',
  '#fef9c3',
  '#fbbf24',
  '#f97316',
  '#ef4444',
  '#ecfdf5',
  '#22c55e',
  '#0ea5e9',
  '#3b82f6',
  '#f5f3ff',
  '#8b5cf6',
  '#a16207',
  '#1f2937',
] as const;

/** Shared toolbar button (BookToolbar, AdminButton, LocaleSwitcher) */
export const TOOLBAR_BUTTON_CLASS =
  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-(--border) bg-(--paper) shadow-md transition-shadow hover:shadow-lg md:h-9 md:w-9';

/** Class for content links (person card, RichText) — color from theme */
export const CONTENT_LINK_CLASS =
  'text-(--link) underline hover:text-(--link-hover)';

/** Shared class for section headings inside the book (serif, responsive size) */
export const SECTION_HEADING_CLASS =
  'book-serif mb-5 text-xl font-semibold text-(--ink) md:text-2xl lg:text-3xl';

/** Drop shadow under the book container (spread / tree block) — same everywhere. Use BOOK_SPREAD_SHADOW_MD where shadow only on desktop. */
export const BOOK_SPREAD_SHADOW = 'shadow-xl';
export const BOOK_SPREAD_SHADOW_MD = 'md:shadow-xl';
