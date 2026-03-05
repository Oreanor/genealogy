import { CHAPTER_IDS } from '@/lib/constants/chapters';
import type { ChapterId } from '@/lib/constants/chapters';
import type { Spread } from '@/lib/types/spread';
import { getPersons } from './persons';
import { getHistoryEntries } from './history';

export function getSpreadsForChapter(chapterId: ChapterId): Spread[] {
  if (chapterId === CHAPTER_IDS.PERSONS) {
    const persons = getPersons();
    return persons.map((p, i) => ({
      spreadIndex: i,
      left: { personId: p.id },
      right: {},
    }));
  }
  if (chapterId === CHAPTER_IDS.HISTORY) {
    return [{ spreadIndex: 0, left: { historyEntries: getHistoryEntries() }, right: {} }];
  }
  if (chapterId === CHAPTER_IDS.TREE) {
    return [{ spreadIndex: 0, left: { tree: true }, right: {} }];
  }
  return [];
}
