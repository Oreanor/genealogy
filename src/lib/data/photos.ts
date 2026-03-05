import type { PhotoEntry, PhotoCategory } from '@/lib/types/photo';
import type { Person } from '@/lib/types/person';
import { getFullName } from '@/lib/utils/person';
import appData from '@/data/data.json';

/** Face rect + display name for lightbox overlay. */
export type LightboxFace = {
  coords: [number, number, number, number];
  displayName: string;
};

/** Build lightbox faces from photo.people (only entries with valid coords). */
export function getLightboxFacesFromPhoto(photo: PhotoEntry | null, persons: Person[]): LightboxFace[] {
  if (!photo?.people?.length) return [];
  return photo.people
    .filter((p): p is typeof p & { coords: [number, number, number, number] } =>
      Array.isArray(p.coords) && p.coords.length >= 4
    )
    .map((p) => ({
      coords: p.coords,
      displayName: p.personId
        ? (getFullName(persons.find((x) => x.id === p.personId) ?? null) || p.personId)
        : (p.label ?? '—'),
    }));
}

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

/** Photos linked to a person (in people array). */
export function getPhotosByPerson(personId: string): PhotoEntry[] {
  return photos.filter((p) => (p.people ?? []).some((pp) => pp.personId === personId));
}

/** Image URLs by category: front (src) and back (backSrc) if present. */
export function getImageLinksByCategory(category: PhotoCategory): string[] {
  return getPhotosByCategory(category).flatMap((p) =>
    [p.src, p.backSrc].filter((s): s is string => Boolean(s))
  );
}

/** Photo by src (for avatar lookup). */
export function getPhotoBySrc(src: string): PhotoEntry | null {
  return photos.find((p) => p.src === src) ?? null;
}

/** Photos eligible for avatar: personal (this person) or group (this person in people). */
export function getPhotosEligibleForAvatar(personId: string): PhotoEntry[] {
  return getPhotosEligibleForAvatarFromList(photos, personId);
}

/** Same but from a given list (e.g. admin state). */
export function getPhotosEligibleForAvatarFromList(photoList: PhotoEntry[], personId: string): PhotoEntry[] {
  return photoList.filter((p) => (p.people ?? []).some((pp) => pp.personId === personId));
}

/** Face rect [left%, top%, right%, bottom%] for avatar crop, or null. */
export function getPersonFaceRect(photo: PhotoEntry, personId: string): [number, number, number, number] | null {
  const entry = (photo.people ?? []).find((pp) => pp.personId === personId);
  if (!entry || !entry.coords || entry.coords.length < 4) return null;
  return [entry.coords[0]!, entry.coords[1]!, entry.coords[2]!, entry.coords[3]!];
}

export type AvatarSource = { src: string; faceRect: [number, number, number, number] | null };

const MIN_RECT_SIZE = 0.5;

/**
 * CSS styles to show only the face rect [l, t, r, b] (0–100%) filling the container.
 * Scale is uniform (no stretch): one scale by the larger side so the rect fills the container.
 * Use on a div with fixed size and overflow hidden; set backgroundImage from src.
 */
export function getAvatarCropStyles(
  faceRect: [number, number, number, number],
  src: string
): { backgroundImage: string; backgroundRepeat: string; backgroundSize: string; backgroundPosition: string } {
  const [l, t, r, b] = faceRect;
  const w = r - l;
  const h = b - t;
  if (w < MIN_RECT_SIZE || h < MIN_RECT_SIZE) {
    return {
      backgroundImage: `url(${src})`,
      backgroundRepeat: 'no-repeat',
      backgroundSize: 'cover',
      backgroundPosition: '50% 50%',
    };
  }
  const scaleX = 100 / w;
  const scaleY = 100 / h;
  const scale = Math.max(scaleX, scaleY);
  const size = scale * 100;
  const posX = (l / (l - r + 100)) * 100;
  const posY = (t / (t - b + 100)) * 100;
  return {
    backgroundImage: `url(${src})`,
    backgroundRepeat: 'no-repeat',
    backgroundSize: `${size}% ${size}%`,
    backgroundPosition: `${posX}% ${posY}%`,
  };
}

/** Avatar for tree/card: preferred photo if set and valid, else first eligible. */
export function getAvatarForPerson(personId: string, preferredPhotoSrc?: string): AvatarSource | null {
  if (preferredPhotoSrc) {
    const photo = getPhotoBySrc(preferredPhotoSrc);
    if (photo && (photo.people ?? []).some((pp) => pp.personId === personId)) {
      return { src: preferredPhotoSrc, faceRect: getPersonFaceRect(photo, personId) };
    }
  }
  const eligible = getPhotosEligibleForAvatar(personId);
  const first = eligible[0];
  if (!first) return null;
  return {
    src: first.src,
    faceRect: getPersonFaceRect(first, personId),
  };
}

/** All avatar options for a person (each photo cropped by face rect). */
export function getAvatarOptionsForPerson(personId: string): AvatarSource[] {
  return getAvatarOptionsForPersonFromList(photos, personId);
}

/** Same from a given list (e.g. admin state). */
export function getAvatarOptionsForPersonFromList(
  photoList: PhotoEntry[],
  personId: string
): AvatarSource[] {
  return getPhotosEligibleForAvatarFromList(photoList, personId).map((photo) => ({
    src: photo.src,
    faceRect: getPersonFaceRect(photo, personId),
  }));
}
