import manifest from '@/lib/data/familySearchPersonDatasets.json';
import { getFamilySearchPersons } from '@/lib/data/familysearchPersons';
import { getFamilysearchPersonsAlt } from '@/lib/data/familysearchPersonsAlt';
import type { FamilySearchPersonsFile } from '@/lib/types/familysearchPersons';

const LOADERS: Record<string, () => FamilySearchPersonsFile> = {
  default: () => getFamilySearchPersons(),
  alt: () => getFamilysearchPersonsAlt(),
};

export type FamilySearchPersonDatasetRow = {
  id: string;
  i18nLabelKey: string;
  getBundle: () => FamilySearchPersonsFile;
};

/** Порядок и подписи — в `familySearchPersonDatasets.json`; загрузчики — только здесь. */
export function getFamilySearchPersonDatasets(): FamilySearchPersonDatasetRow[] {
  const { datasets } = manifest as {
    datasets: { id: string; bundle: string; i18nLabelKey: string }[];
  };
  return datasets.map((d) => {
    const load = LOADERS[d.bundle];
    if (!load) {
      throw new Error(`familySearchPersonDatasets.json: unknown bundle "${d.bundle}"`);
    }
    return { id: d.id, i18nLabelKey: d.i18nLabelKey, getBundle: load };
  });
}
