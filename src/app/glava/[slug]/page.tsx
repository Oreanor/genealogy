import { BookLayout, SpreadNavigation } from '@/components/book';
import { CHAPTERS } from '@/lib/constants/chapters';
import { getSpreadsForChapter } from '@/lib/data/spreads';
import { getChapterBySlug } from '@/lib/utils/chapter';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

export function generateStaticParams() {
  return CHAPTERS.map((ch) => ({ slug: ch.id }));
}

interface ChapterPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ChapterPage({ params }: ChapterPageProps) {
  const { slug } = await params;
  const chapter = getChapterBySlug(slug);

  if (!chapter) {
    notFound();
  }

  const spreads = getSpreadsForChapter(chapter.id);

  return (
    <BookLayout showTocBookmark>
      <Suspense fallback={<div className="h-[85vh] animate-pulse bg-amber-100" />}>
        <SpreadNavigation
          chapterSlug={slug}
          chapterTitle={chapter.title}
          spreads={spreads}
        />
      </Suspense>
    </BookLayout>
  );
}
