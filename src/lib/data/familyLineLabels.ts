import type { Locale } from '@/lib/i18n/config';
import manifest from '@/lib/data/familyLineLabels.json';

export type FamilyLineId = 'main' | 'alt';

export type FamilyLineLabelKind = 'familySearch' | 'mapLayer';

type LocaleBlock = { familySearch: string; mapLayer: string };

type LinesFile = {
  lines: Record<FamilyLineId, Partial<Record<Locale, LocaleBlock>> & { en: LocaleBlock }>;
};

const data = manifest as LinesFile;

export function getFamilyLineUiLabel(
  lineId: FamilyLineId,
  locale: Locale,
  kind: FamilyLineLabelKind
): string {
  const line = data.lines[lineId];
  if (!line) return lineId;
  const block = line[locale] ?? line.en;
  return block[kind];
}
