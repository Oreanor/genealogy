import type { ChapterId } from '@/lib/constants/chapters';
import type { Page } from '@/lib/types/spread';
import appData from '@/data/data.json';

const pages = (appData as { pages: Page[] }).pages;

export function getPages(): Page[] {
  return pages;
}

export function getPagesByChapter(chapterId: ChapterId): Page[] {
  return pages
    .filter((p) => p.chapter === chapterId)
    .sort((a, b) => a.spreadIndex - b.spreadIndex);
}

export function getSpreadByChapterAndIndex(
  chapterId: ChapterId,
  spreadIndex: number
): Page | null {
  const page = pages.find(
    (p) => p.chapter === chapterId && p.spreadIndex === spreadIndex
  );
  return page ?? null;
}
