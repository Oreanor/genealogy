'use client';

import { splitAllPhotosForCarousels } from '@/lib/data/photos';
import type { TranslationFn } from '@/lib/i18n/types';
import type { PhotoCategory, PhotoEntry } from '@/lib/types/photo';

export type PhotoItem = { photo: PhotoEntry; idx: number };
export type AdminPhotoGroupSection = {
  key: string;
  title: string;
  items: PhotoItem[];
};

const BACK_SUFFIX_RE = /_back\.(jpg|jpeg|png|gif|webp)$/i;

export function slugFromSrc(src: string): string {
  return (
    src
      .replace(/^\/photos\//, '')
      .replace(/\//g, '-')
      .replace(/\.(jpg|jpeg|png|gif|webp)$/i, '') || 'photo'
  );
}

/** Состояние «только что из скана», без любых правок (подпись, лица, серия, категория, …). */
function isPristineUneditedPhoto(photo: PhotoEntry): boolean {
  if (photo.caption?.trim()) return false;
  if (photo.backCaption?.trim()) return false;
  if (photo.people?.length) return false;
  if (photo.series?.trim()) return false;
  if (photo.hidden) return false;
  if (photo.backSrc?.trim()) return false;
  const category: PhotoCategory = photo.category ?? 'related';
  if (category !== 'related') return false;
  return true;
}

export function isNew(photo: PhotoEntry): boolean {
  return isPristineUneditedPhoto(photo);
}

export function isBackSrc(src: string): boolean {
  return BACK_SUFFIX_RE.test(src);
}

function getFrontSrcForBack(src: string): string {
  return src.replace(/_back\./, '.');
}

export function buildPhotoIndexMaps(photos: PhotoEntry[]) {
  const photoIdxBySrc = new Map(photos.map((p, idx): [string, number] => [p.src, idx]));
  const backIdxByFrontSrc = new Map<string, number>();

  photos.forEach((p, idx) => {
    if (!isBackSrc(p.src)) return;
    const frontSrc = getFrontSrcForBack(p.src);
    if (!backIdxByFrontSrc.has(frontSrc)) backIdxByFrontSrc.set(frontSrc, idx);
  });

  return { photoIdxBySrc, backIdxByFrontSrc };
}

function toPhotoItems(
  list: PhotoEntry[],
  photoIdxBySrc: Map<string, number>
): PhotoItem[] {
  return list
    .map((photo) => {
      const idx = photoIdxBySrc.get(photo.src);
      return idx === undefined ? null : { photo, idx };
    })
    .filter((x): x is PhotoItem => x !== null);
}

export function buildAdminPhotoGroups(
  photos: PhotoEntry[],
  photoIdxBySrc: Map<string, number>,
  t: TranslationFn
): AdminPhotoGroupSection[] {
  const items: PhotoItem[] = photos.map((photo, idx) => ({ photo, idx }));
  const frontItems = items.filter(({ photo }) => !isBackSrc(photo.src));
  const newItems = frontItems.filter(({ photo }) => isNew(photo));
  const restPhotos = frontItems.map((i) => i.photo).filter((photo) => !isNew(photo));
  const split = splitAllPhotosForCarousels(restPhotos);

  return [
    { key: 'adminNew', title: t('adminNew'), items: newItems },
    {
      key: 'adminPhotoPersonal',
      title: t('adminPhotoPersonal'),
      items: toPhotoItems(split.personal, photoIdxBySrc),
    },
    {
      key: 'adminPhotoGroup',
      title: t('adminPhotoGroup'),
      items: toPhotoItems(split.group, photoIdxBySrc),
    },
    {
      key: 'adminPhotoRelated',
      title: t('adminPhotoRelated'),
      items: toPhotoItems(split.related, photoIdxBySrc),
    },
    ...split.bySeries.map(({ seriesName, photos: seriesPhotos }) => ({
      key: seriesName,
      title: t('photoSeriesTitle', { name: seriesName }),
      items: toPhotoItems(seriesPhotos, photoIdxBySrc),
    })),
  ];
}
