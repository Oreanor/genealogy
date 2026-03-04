import { CHAPTER_IDS } from '@/lib/constants/chapters';
import type { ChapterId } from '@/lib/constants/chapters';
import type { Spread } from '@/lib/types/spread';
import { getPersons } from './persons';
import { getPagesByChapter } from './pages';

/** Преобразует Page[] в Spread[] для совместимости с SpreadNavigation */
function pageToSpread(page: { spreadIndex: number; left: unknown; right: unknown }): Spread {
  return {
    spreadIndex: page.spreadIndex,
    left: page.left as Spread['left'],
    right: page.right as Spread['right'],
  };
}

export function getSpreadsForChapter(chapterId: ChapterId): Spread[] {
  if (chapterId === CHAPTER_IDS.PERSONS) {
    const persons = getPersons();
    return persons.map((p, i) => ({
      spreadIndex: i,
      left: { personId: p.id },
      right: {},
    }));
  }
  const pages = getPagesByChapter(chapterId);
  return pages.map(pageToSpread);
}
