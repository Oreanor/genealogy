import {
  BOOK_TITLE,
  CHAPTERS,
  COVER_IMAGE,
} from '@/lib/constants/chapters';
import { ROUTES } from '@/lib/constants/routes';
import Image from 'next/image';
import Link from 'next/link';
import { BookPage } from './BookPage';
import { BookSpread } from './BookSpread';

export function TitleSpread() {
  return (
    <BookSpread
      left={
        <BookPage>
          <h1 className="text-2xl font-semibold text-[var(--ink)] md:text-3xl">
            {BOOK_TITLE}
          </h1>
          <div className="mt-8 flex flex-1 items-center justify-center">
            {COVER_IMAGE ? (
              <div className="relative aspect-[3/4] w-full max-w-xs overflow-hidden rounded">
                <Image
                  src={COVER_IMAGE}
                  alt={BOOK_TITLE}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="aspect-[3/4] w-full max-w-xs rounded border border-amber-300/50 bg-amber-50/50" />
            )}
          </div>
        </BookPage>
      }
      right={
        <BookPage>
          <div className="flex flex-1 flex-col items-center justify-start">
            <h2 className="mb-6 text-lg font-medium text-[var(--ink)]">
              Оглавление
            </h2>
            <nav className="flex flex-col items-center gap-3 text-center">
              {CHAPTERS.map((ch) => (
                <Link
                  key={ch.id}
                  href={ROUTES.chapter(ch.id)}
                  className="text-[var(--ink)] hover:underline"
                >
                  {ch.title}
                </Link>
              ))}
            </nav>
          </div>
        </BookPage>
      }
    />
  );
}
