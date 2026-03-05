import type { PhotoEntry, PhotoCategory } from '@/lib/types/photo';
import appData from '@/data/data.json';

const raw = (appData as { photos: PhotoEntry[] }).photos;
const photos: PhotoEntry[] = raw.map((p) => ({
  ...p,
  category: p.category ?? 'related',
}));

export function getPhotos(): PhotoEntry[] {
  return photos;
}

export function getPhotoById(id: string): PhotoEntry | null {
  return photos.find((p) => p.id === id || p.src === id) ?? null;
}

export function getPhotosByCategory(category: PhotoCategory): PhotoEntry[] {
  return photos.filter((p) => p.category === category);
}

/** Фото, связанные с персоной: персональные, участие в групповых, прочие (дом, книга). */
export function getPhotosByPerson(personId: string): PhotoEntry[] {
  return photos.filter(
    (p) =>
      p.personId === personId ||
      (p.people ?? []).some((pp) => pp.personId === personId)
  );
}

/** Ссылки на изображения по категории: лицевая (src) и оборот (backSrc) если есть. */
export function getImageLinksByCategory(category: PhotoCategory): string[] {
  return getPhotosByCategory(category).flatMap((p) =>
    [p.src, p.backSrc].filter((s): s is string => Boolean(s))
  );
}
