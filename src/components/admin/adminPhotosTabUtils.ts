'use client';

import { splitAllPhotosForCarousels } from '@/lib/data/photos';
import type { PhotoEntry } from '@/lib/types/photo';

export type PhotoItem = { photo: PhotoEntry; idx: number };
export type TranslationFn = (key: string, params?: Record<string, string | number>) => string;
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

export function isNew(photo: PhotoEntry): boolean {
  const hasCaption = Boolean(photo.caption?.trim());
  const hasPeople = Boolean(photo.people?.length);
  if (hasCaption || hasPeople) return false;
  return true;
}

export function isBackSrc(src: string): boolean {
  return BACK_SUFFIX_RE.test(src);
}

export function getFrontSrcForBack(src: string): string {
  return src.replace(/_back\./, '.');
}

export function buildPhotoIndexMaps(photos: PhotoEntry[]) {
  const photoIdxBySrc = new Map(photos.map((p, idx) => [p.src, idx] as const));
  const backIdxByFrontSrc = new Map<string, number>();

  photos.forEach((p, idx) => {
    if (!isBackSrc(p.src)) return;
    const frontSrc = getFrontSrcForBack(p.src);
    if (!backIdxByFrontSrc.has(frontSrc)) backIdxByFrontSrc.set(frontSrc, idx);
  });

  return { photoIdxBySrc, backIdxByFrontSrc };
}

export function toPhotoItems(
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
