import { describe, expect, it } from 'vitest';
import type { PhotoEntry } from '@/lib/types/photo';
import {
  buildAdminPhotoGroups,
  buildPhotoIndexMaps,
  isBackSrc,
  isNew,
  slugFromSrc,
} from './adminPhotosTabUtils';

function makePhoto(overrides: Partial<PhotoEntry>): PhotoEntry {
  return {
    id: 'photo',
    src: '/photos/default.jpg',
    category: 'related',
    ...overrides,
  };
}

describe('adminPhotosTabUtils', () => {
  it('detects new and back photos and generates slug from src', () => {
    expect(isNew(makePhoto({ caption: '', people: [] }))).toBe(true);
    expect(isNew(makePhoto({ caption: 'Caption' }))).toBe(false);
    expect(isNew(makePhoto({ caption: '', people: [], series: 'Album' }))).toBe(false);
    expect(isNew(makePhoto({ caption: '', people: [], category: 'personal' }))).toBe(false);
    expect(isNew(makePhoto({ caption: '', people: [], hidden: true }))).toBe(false);
    expect(isBackSrc('/photos/family_back.jpg')).toBe(true);
    expect(slugFromSrc('/photos/family/portrait.jpg')).toBe('family-portrait');
  });

  it('builds src indexes and keeps the first back match', () => {
    const photos: PhotoEntry[] = [
      makePhoto({ id: 'front', src: '/photos/a.jpg' }),
      makePhoto({ id: 'back-1', src: '/photos/a_back.jpg' }),
      makePhoto({ id: 'back-2', src: '/photos/a_back.jpg' }),
    ];

    const { photoIdxBySrc, backIdxByFrontSrc } = buildPhotoIndexMaps(photos);

    expect(photoIdxBySrc.get('/photos/a.jpg')).toBe(0);
    expect(photoIdxBySrc.get('/photos/a_back.jpg')).toBe(2);
    expect(backIdxByFrontSrc.get('/photos/a.jpg')).toBe(1);
  });

  it('builds admin photo groups and excludes back images from visible groups', () => {
    const photos: PhotoEntry[] = [
      makePhoto({ id: 'new', src: '/photos/new.jpg', caption: '', people: [] }),
      makePhoto({ id: 'personal', src: '/photos/personal.jpg', category: 'personal', caption: 'P' }),
      makePhoto({ id: 'group', src: '/photos/group.jpg', category: 'group', caption: 'G' }),
      makePhoto({
        id: 'series',
        src: '/photos/series.jpg',
        category: 'related',
        caption: '',
        people: [],
        series: 'Trip',
      }),
      makePhoto({ id: 'back', src: '/photos/personal_back.jpg', category: 'related', caption: 'Back' }),
    ];
    const { photoIdxBySrc } = buildPhotoIndexMaps(photos);
    const t = (key: string, params?: Record<string, string | number>) =>
      key === 'photoSeriesTitle' ? `series:${params?.name}` : key;

    const groups = buildAdminPhotoGroups(photos, photoIdxBySrc, t);

    expect(groups.find((group) => group.key === 'adminNew')?.items.map((item) => item.photo.id)).toEqual(['new']);
    expect(groups.find((group) => group.key === 'adminPhotoPersonal')?.items.map((item) => item.photo.id)).toEqual(['personal']);
    expect(groups.find((group) => group.key === 'adminPhotoGroup')?.items.map((item) => item.photo.id)).toEqual(['group']);
    expect(groups.find((group) => group.key === 'Trip')?.title).toBe('series:Trip');
    expect(groups.flatMap((group) => group.items.map((item) => item.photo.id))).not.toContain('back');
  });
});
