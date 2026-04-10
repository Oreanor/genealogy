import type { BookHelpTargetSectionId } from '@/lib/constants/sections';

export const TREE_HELP_STEP_MESSAGE_KEYS = [
  'treeHelpStep1',
  'treeHelpStep2',
  'treeHelpStep3',
  'treeHelpStep4',
  'treeHelpStep5',
  'treeHelpStep6',
  'treeHelpStep7',
  'treeHelpStep8',
] as const;

/** Keys for HelpSpread (inline book) — contextual bullets per section */
export const BOOK_HELP_CONTEXTUAL_KEYS_SPREAD: Record<
  BookHelpTargetSectionId,
  readonly string[]
> = {
  tree: TREE_HELP_STEP_MESSAGE_KEYS,
  persons: ['personsSearchPlaceholder', 'personsSelectHint', 'goToPerson'],
  history: ['historySearchPlaceholder', 'historySelectHint', 'personMentionedInStories'],
  photos: [
    'noPhotosYet',
    'openFullscreen',
    'photoToggleBack',
    'lightboxShowLabels',
    'lightboxHideLabels',
  ],
  map: ['bookHelpMap1', 'bookHelpMap2', 'bookHelpMap3'],
  map2: ['bookHelpMap2Tab1', 'bookHelpMap2Tab2', 'bookHelpMap2Tab3'],
};

/** Keys for BookHelpDialog (toolbar) — shorter dedicated copy */
export const BOOK_HELP_CONTEXTUAL_KEYS_DIALOG: Record<
  BookHelpTargetSectionId,
  readonly string[]
> = {
  tree: TREE_HELP_STEP_MESSAGE_KEYS,
  persons: ['bookHelpPersons1', 'bookHelpPersons2', 'bookHelpPersons3'],
  history: ['bookHelpHistory1', 'bookHelpHistory2', 'bookHelpHistory3'],
  photos: ['bookHelpPhotos1', 'bookHelpPhotos2', 'bookHelpPhotos3', 'bookHelpPhotos4'],
  map: ['bookHelpMap1', 'bookHelpMap2', 'bookHelpMap3', 'bookHelpMap4', 'bookHelpMap5'],
  map2: ['bookHelpMap2Tab1', 'bookHelpMap2Tab2', 'bookHelpMap2Tab3'],
};
