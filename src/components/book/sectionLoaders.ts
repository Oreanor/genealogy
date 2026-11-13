import type { SectionId } from '@/lib/constants/sections';

/**
 * Lazy loaders for book sections that are not shown on first load.
 * Each section (and the data it imports: FamilySearch, indexed events, maps…) lives in its own
 * chunk, so the home page (tree) doesn't download/parse it up front.
 * The same functions are used by `next/dynamic` in BookView and by `prefetchSection`,
 * so a prefetched chunk is reused when the section renders.
 */
export const sectionLoaders = {
  help: () => import('./HelpSpread').then((m) => m.HelpSpread),
  history: () => import('./HistorySection').then((m) => m.HistorySection),
  photos: () => import('./PhotosSection').then((m) => m.PhotosSection),
  map: () => import('./UnifiedMapSection').then((m) => m.UnifiedMapSection),
  familySearch: () => import('./FamilySearchPersonsSection').then((m) => m.FamilySearchPersonsSection),
  persons: () => import('./PersonsSection').then((m) => m.PersonsSection),
} as const;

type LazySectionId = keyof typeof sectionLoaders;

function isLazySection(id: string): id is LazySectionId {
  return Object.prototype.hasOwnProperty.call(sectionLoaders, id);
}

/** Start downloading a section's chunk (e.g. on tab hover/focus) so switching to it is instant. */
export function prefetchSection(id: SectionId | string): void {
  if (isLazySection(id)) void sectionLoaders[id]().catch(() => {});
}
