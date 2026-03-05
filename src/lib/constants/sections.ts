/** Book sections: tree, persons, history, photos */
export const SECTION_IDS = ['tree', 'persons', 'history', 'photos'] as const;
export type SectionId = (typeof SECTION_IDS)[number];

export const SECTIONS = [
  { id: 'tree' as const, i18nKey: 'chapters_family-tree' },
  { id: 'persons' as const, i18nKey: 'chapters_persons' },
  { id: 'history' as const, i18nKey: 'chapters_history' },
  { id: 'photos' as const, i18nKey: 'chapters_photos' },
] as const;

export function isSectionId(value: string): value is SectionId {
  return SECTION_IDS.includes(value as SectionId);
}
