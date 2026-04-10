/** Book sections: tree, persons, history, photos, map, kinship, help */
export type SectionId =
  | 'tree'
  | 'persons'
  | 'history'
  | 'photos'
  | 'map'
  | 'kinship'
  | 'help';

export const SECTION_IDS: readonly SectionId[] = [
  'tree',
  'persons',
  'history',
  'photos',
  'map',
  'kinship',
  'help',
];

export const SECTIONS: ReadonlyArray<{ id: SectionId; i18nKey: string }> = [
  { id: 'tree', i18nKey: 'chapters_family-tree' },
  { id: 'persons', i18nKey: 'chapters_persons' },
  { id: 'history', i18nKey: 'chapters_history' },
  { id: 'photos', i18nKey: 'chapters_photos' },
  { id: 'map', i18nKey: 'chapters_map' },
  { id: 'kinship', i18nKey: 'chapters_kinship' },
  { id: 'help', i18nKey: 'chapters_help' },
];

export function isSectionId(value: string): value is SectionId {
  return SECTION_IDS.includes(value as SectionId);
}

/** Subset of sections with contextual help in HelpSpread / BookHelpDialog */
export const BOOK_HELP_TARGET_SECTION_IDS = [
  'tree',
  'persons',
  'history',
  'photos',
  'map',
] as const satisfies readonly SectionId[];

export type BookHelpTargetSectionId = (typeof BOOK_HELP_TARGET_SECTION_IDS)[number];

export function isBookHelpTargetSectionId(value: string): value is BookHelpTargetSectionId {
  return (BOOK_HELP_TARGET_SECTION_IDS as readonly string[]).includes(value);
}

export function bookHelpSectionTitleMessageKey(section: BookHelpTargetSectionId): string {
  const row = SECTIONS.find((s) => s.id === section);
  return row?.i18nKey ?? 'chapters_family-tree';
}

export function resolveBookHelpTargetSection(section: string | undefined): BookHelpTargetSectionId {
  return section && isBookHelpTargetSectionId(section) ? section : 'tree';
}
