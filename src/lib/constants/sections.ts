/** Секции книги: дерево по умолчанию, затем Истории / Фотографии / Персоны */
export const SECTION_IDS = ['tree', 'history', 'photos', 'persons'] as const;
export type SectionId = (typeof SECTION_IDS)[number];

export const SECTIONS = [
  { id: 'tree' as const, i18nKey: 'chapters_family-tree' },
  { id: 'history' as const, i18nKey: 'chapters_history' },
  { id: 'photos' as const, i18nKey: 'chapters_photos' },
  { id: 'persons' as const, i18nKey: 'chapters_persons' },
] as const;

export function isSectionId(value: string): value is SectionId {
  return SECTION_IDS.includes(value as SectionId);
}
