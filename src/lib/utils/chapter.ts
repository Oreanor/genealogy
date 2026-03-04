import { CHAPTERS } from '@/lib/constants/chapters';
import type { ChapterId } from '@/lib/constants/chapters';

export function getChapterBySlug(slug: string): { id: ChapterId; title: string } | null {
  const chapter = CHAPTERS.find((ch) => ch.id === slug);
  return chapter ? { id: chapter.id, title: chapter.title } : null;
}
