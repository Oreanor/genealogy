import type { FamilySearchPersonsFile } from '@/lib/types/familysearchPersons';
import bundle from '@/lib/data/kanivetsFamilysearchPersons.json';

/** Second FamilySearch persons dataset (the JSON file is imported here). */
export function getFamilysearchPersonsAlt(): FamilySearchPersonsFile {
  return bundle as FamilySearchPersonsFile;
}
