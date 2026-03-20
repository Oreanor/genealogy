import React from 'react';
import { Page, Text, Image } from '@react-pdf/renderer';
import type { PhotoEntry } from '@/lib/types/photo';
import type { Person } from '@/lib/types/person';
import { getPhotos, getPhotosByPerson } from '@/lib/data/photos';
import { getRootPersonId } from '@/lib/data/root';
import { buildTreeMatrix } from '@/lib/utils/tree';
import { s, COLORS } from './styles';

export interface PhotosLabels {
  chapterPhotos: string;
}

/**
 * Build ordered photo list:
 * 1. Personal + group photos of root person
 * 2. Personal + group photos of parents (level 1)
 * 3. Personal + group photos of grandparents+ (levels 2+)
 * 4. Remaining photos grouped by series (series title before group)
 * 5. Photos without series at the end
 */
function getOrderedPhotos(): { photo: PhotoEntry; seriesHeader?: string }[] {
  const rootId = getRootPersonId();
  const matrix = buildTreeMatrix(rootId);
  const allPhotos = getPhotos();
  const usedSrcs = new Set<string>();
  const result: { photo: PhotoEntry; seriesHeader?: string }[] = [];

  const addPersonPhotos = (person: Person | null) => {
    if (!person) return;
    const photos = getPhotosByPerson(person.id).filter(
      (p) => (p.category === 'personal' || p.category === 'group') && !usedSrcs.has(p.src)
    );
    for (const photo of photos) {
      result.push({ photo });
      usedSrcs.add(photo.src);
    }
  };

  for (const row of matrix) {
    for (const person of row) {
      addPersonPhotos(person);
    }
  }

  const remaining = allPhotos.filter((p) => !usedSrcs.has(p.src));

  const seriesMap = new Map<string, PhotoEntry[]>();
  const noSeries: PhotoEntry[] = [];

  for (const photo of remaining) {
    if (photo.series?.trim()) {
      const key = photo.series.trim();
      if (!seriesMap.has(key)) seriesMap.set(key, []);
      seriesMap.get(key)!.push(photo);
    } else {
      noSeries.push(photo);
    }
  }

  for (const [seriesName, photos] of seriesMap) {
    let first = true;
    for (const photo of photos) {
      result.push({ photo, seriesHeader: first ? seriesName : undefined });
      first = false;
    }
  }

  for (const photo of noSeries) {
    result.push({ photo });
  }

  return result;
}

export function PhotosChapter({ labels }: { labels: PhotosLabels }) {
  const items = getOrderedPhotos();

  return (
    <>
      <Page size="A5" style={[s.pageA5, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={s.chapterTitle}>{labels.chapterPhotos}</Text>
      </Page>

      {items.map(({ photo, seriesHeader }, idx) => (
        <Page key={`photo-${idx}`} size="A5" style={[s.pageA5, { justifyContent: 'center', alignItems: 'center' }]}>
          {seriesHeader && (
            <Text
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: COLORS.accent,
                marginBottom: 12,
                textAlign: 'center',
              }}
            >
              {seriesHeader}
            </Text>
          )}
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image
            src={photo.src}
            style={{ maxWidth: '100%', maxHeight: seriesHeader ? '78%' : '85%', objectFit: 'contain' }}
          />
          {photo.caption && (
            <Text style={[s.caption, { marginTop: 8 }]}>{photo.caption}</Text>
          )}
          <Text style={s.pageNumber} render={({ pageNumber }) => `${pageNumber}`} fixed />
        </Page>
      ))}
    </>
  );
}
