'use client';

import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useLocaleRoutes } from '@/lib/i18n/context';
import { BookSpread } from './BookSpread';
import { BookPage } from './BookPage';
import { getPhotos } from '@/lib/data/photos';
import Image from 'next/image';
import { NavButton } from '@/components/ui/NavButton';
import { SECTION_HEADING_CLASS } from '@/lib/constants/theme';
import type { PhotoEntry } from '@/lib/types/photo';

const PHOTOS_PER_PAGE = 9;
const PHOTOS_PER_SPREAD = PHOTOS_PER_PAGE * 2;

export function PhotosSection() {
  const searchParams = useSearchParams();
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const { t } = useLocaleRoutes();

  const photos = getPhotos();
  const spreadParam = searchParams.get('spread');
  const spread = spreadParam !== null ? Math.max(0, parseInt(spreadParam, 10) || 0) : 0;

  const leftPhotos = photos.slice(spread * PHOTOS_PER_SPREAD, spread * PHOTOS_PER_SPREAD + PHOTOS_PER_PAGE);
  const rightPhotos = photos.slice(
    spread * PHOTOS_PER_SPREAD + PHOTOS_PER_PAGE,
    spread * PHOTOS_PER_SPREAD + PHOTOS_PER_SPREAD
  );
  const totalSpreads = Math.ceil(photos.length / PHOTOS_PER_SPREAD);
  const hasPrev = spread > 0;
  const hasNext = spread < totalSpreads - 1;

  const initialSelected =
    leftPhotos[0] ?? rightPhotos[0] ?? photos[0] ?? null;
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoEntry | null>(
    initialSelected
  );

  const photoGrid = (list: PhotoEntry[]) => (
    <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
      {list.map((photo) => (
        <button
          key={photo.id}
          type="button"
          onClick={() => setSelectedPhoto(photo)}
          className="relative block aspect-[3/4] w-full overflow-hidden rounded bg-(--paper-light) transition-opacity hover:opacity-90 focus:outline-none"
        >
          <Image
            src={photo.src}
            alt={photo.caption ?? photo.id}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 33vw, 20vw"
          />
        </button>
      ))}
    </div>
  );

  return (
    <div className="relative w-full">
      <BookSpread
        left={
          <BookPage>
            <h1 className={SECTION_HEADING_CLASS}>
              {t('chapters_photos')}
            </h1>
            <div className="flex-1 min-h-0 overflow-y-auto">
              {photoGrid(leftPhotos)}
            </div>
          </BookPage>
        }
        right={
          <BookPage className="flex flex-col overflow-hidden">
            <div className={SECTION_HEADING_CLASS} aria-hidden>&nbsp;</div>
            <div className="flex-1 min-h-0 overflow-hidden">
              {selectedPhoto ? (
                <div className="relative h-full w-full">
                  <Image
                    src={selectedPhoto.src}
                    alt={selectedPhoto.caption ?? selectedPhoto.id}
                    fill
                    className="object-contain"
                    sizes="(max-width: 600px) 100vw, 50vw"
                  />
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-(--ink-muted)">
                  {t('noPhotosYet')}
                </div>
              )}
            </div>
            {selectedPhoto?.caption && (
              <p className="mt-2 text-center text-sm text-(--ink)">
                {selectedPhoto.caption}
              </p>
            )}
          </BookPage>
        }
      />
      {totalSpreads > 1 && (
        <>
          <div className="pointer-events-auto absolute -left-7 top-1/2 z-20 -translate-y-1/2 md:-left-8">
            <NavButton
              onClick={() => router.push(`${pathname}?section=photos&spread=${spread - 1}`)}
              disabled={!hasPrev}
              direction="prev"
            />
          </div>
          <div className="pointer-events-auto absolute -right-7 top-1/2 z-20 -translate-y-1/2 md:-right-8">
            <NavButton
              onClick={() => router.push(`${pathname}?section=photos&spread=${spread + 1}`)}
              disabled={!hasNext}
              direction="next"
            />
          </div>
        </>
      )}
    </div>
  );
}
