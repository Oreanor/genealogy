import type { FamilySearchPersonsFile } from '@/lib/types/familysearchPersons';
import bundle from '@/lib/data/familysearchPersons.json';

export function getFamilySearchPersons(): FamilySearchPersonsFile {
  return bundle as FamilySearchPersonsFile;
}
