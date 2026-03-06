'use client';

import { CHAPTERS, COVER_IMAGE } from '@/lib/constants/chapters';
import { getFamilySurname } from '@/lib/data/owner';
import { CONTENT_LINK_CLASS } from '@/lib/constants/theme';
import { useLocaleRoutes } from '@/lib/i18n/context';
import Image from 'next/image';
import Link from 'next/link';
import { BookPage } from './BookPage';
import { BookSpread } from './BookSpread';

export function TitleSpread() {
  const { t, routes } = useLocaleRoutes();
  const bookTitle = t('bookTitleTemplate', { surname: getFamilySurname() });

  return (
    <BookSpread
      left={
        <BookPage>
          <h1 className="text-2xl font-semibold text-(--ink) md:text-3xl">
            {bookTitle}
          </h1>
          <div className="mt-8 flex flex-1 items-center justify-center">
            {COVER_IMAGE ? (
              <div className="relative aspect-[3/4] w-full max-w-xs overflow-hidden rounded">
                <Image
                  src={COVER_IMAGE}
                  alt={bookTitle}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="aspect-[3/4] w-full max-w-xs rounded border border-(--border-subtle) bg-(--paper-light)" />
            )}
          </div>
        </BookPage>
      }
      right={
        <BookPage>
          <div className="flex flex-1 flex-col items-center justify-start">
            <h2 className="mb-6 text-lg font-medium text-(--ink)">
              {t('tocTitle')}
            </h2>
            <nav className="flex flex-col items-center gap-3 text-center">
              {CHAPTERS.map((ch) => (
                <Link
                  key={ch.id}
                  href={routes.chapter(ch.id)}
                  className={CONTENT_LINK_CLASS}
                >
                  {t(`chapters_${ch.id}`)}
                </Link>
              ))}
            </nav>
          </div>
        </BookPage>
      }
    />
  );
}
