import type { FamilySearchPersonsFile } from '@/lib/types/familysearchPersons';
import bundle from '@/lib/data/kanivetsFamilysearchPersons.json';

export function getKanivetsFamilySearchPersons(): FamilySearchPersonsFile {
  return bundle as FamilySearchPersonsFile;
}
