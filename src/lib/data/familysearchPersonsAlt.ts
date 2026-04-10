import type { FamilySearchPersonsFile } from '@/lib/types/familysearchPersons';
import bundle from '@/lib/data/kanivetsFamilysearchPersons.json';

/** Второй набор персон FamilySearch (JSON-файл подключается здесь). */
export function getFamilysearchPersonsAlt(): FamilySearchPersonsFile {
  return bundle as FamilySearchPersonsFile;
}
