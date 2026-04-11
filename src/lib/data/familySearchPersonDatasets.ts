import manifest from '@/lib/data/familySearchPersonDatasets.json';
import type { FamilyLineId } from '@/lib/data/familyLineLabels';
import { getFamilySearchPersons } from '@/lib/data/familysearchPersons';
import { getFamilysearchPersonsAlt } from '@/lib/data/familysearchPersonsAlt';
import type { FamilySearchPersonsFile } from '@/lib/types/familysearchPersons';

const LOADERS: Record<string, () => FamilySearchPersonsFile> = {
  default: () => getFamilySearchPersons(),
  alt: () => getFamilysearchPersonsAlt(),
};

export type FamilySearchPersonDatasetRow = {
  id: string;
  lineId: FamilyLineId;
  getBundle: () => FamilySearchPersonsFile;
};

/** Порядок, lineId и загрузчики — в `familySearchPersonDatasets.json`; подписи — `familyLineLabels.json`. */
export function getFamilySearchPersonDatasets(): FamilySearchPersonDatasetRow[] {
  const { datasets } = manifest as {
    datasets: { id: string; bundle: string; lineId: FamilyLineId }[];
  };
  return datasets.map((d) => {
    const load = LOADERS[d.bundle];
    if (!load) {
      throw new Error(`familySearchPersonDatasets.json: unknown bundle "${d.bundle}"`);
    }
    return { id: d.id, lineId: d.lineId, getBundle: load };
  });
}
