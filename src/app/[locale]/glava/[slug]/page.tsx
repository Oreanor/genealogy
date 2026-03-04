import { BookLayout, SpreadNavigation } from '@/components/book';
import { CHAPTERS } from '@/lib/constants/chapters';
import { getSpreadsForChapter } from '@/lib/data/spreads';
import { getChapterBySlug } from '@/lib/utils/chapter';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { getMessages } from '@/lib/i18n/messages';
import { isLocale } from '@/lib/i18n/config';

export function generateStaticParams() {
  const locales = ['ru', 'en', 'de', 'fr', 'es', 'it', 'pt', 'nl', 'uk', 'pl'] as const;
  return locales.flatMap((locale) =>
    CHAPTERS.map((ch) => ({ locale, slug: ch.id }))
  );
}

interface ChapterPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function ChapterPage({ params }: ChapterPageProps) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const chapter = getChapterBySlug(slug);

  if (!chapter) {
    notFound();
  }

  const messages = getMessages(locale);
  const chapterTitle = messages[`chapters_${chapter.id}`] ?? chapter.id;

  const spreads = getSpreadsForChapter(chapter.id);

  return (
    <BookLayout showTocBookmark>
      <Suspense fallback={<div className="h-[85vh] animate-pulse bg-[var(--paper)]" />}>
        <SpreadNavigation
          chapterSlug={slug}
          chapterTitle={chapterTitle}
          spreads={spreads}
        />
      </Suspense>
    </BookLayout>
  );
}
