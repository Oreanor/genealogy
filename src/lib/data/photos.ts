import type { PhotoEntry, PhotoCategory } from '@/lib/types/photo';
import type { Person } from '@/lib/types/person';
import appData from '@/data/data.json';

/** Face rect + name parts for overlay (Ф, И, О from admin). */
export type LightboxFace = {
  coords: [number, number, number, number];
  /** Fallback when no person (custom label). */
  displayName?: string;
  lastName?: string;
  firstName?: string;
  patronymic?: string;
};

/** Build lightbox faces from photo.people (only entries with valid coords). */
export function getLightboxFacesFromPhoto(photo: PhotoEntry | null, persons: Person[]): LightboxFace[] {
  if (!photo?.people?.length) return [];
  return photo.people
    .filter((p): p is typeof p & { coords: [number, number, number, number] } =>
      Array.isArray(p.coords) && p.coords.length >= 4
    )
    .map((p) => {
      if (p.personId) {
        const person = persons.find((x) => x.id === p.personId) ?? null;
        return {
          coords: p.coords,
          lastName: person?.lastName?.trim() || undefined,
          firstName: person?.firstName?.trim() || undefined,
          patronymic: person?.patronymic?.trim() || undefined,
        };
      }
      return {
        coords: p.coords,
        displayName: p.label?.trim() || '—',
      };
    });
}

const raw = (appData as { photos: PhotoEntry[] }).photos;

const BACK_SUFFIX_RE = /_back\.(jpg|jpeg|png|gif|webp)$/i;

function isBackSrc(src: string): boolean {
  return BACK_SUFFIX_RE.test(src);
}

function getFrontSrcForBack(src: string): string {
  return src.replace(/_back\./, '.');
}

/**
 * Build final photos list:
 * - front images (without `_back` suffix) are primary entries;
 * - matching `_back` images are attached to `backSrc` / `backCaption`;
 * - orphan `_back` images (no front found) are kept as normal photos.
 */
const photosMap = new Map<string, PhotoEntry>();

// First pass: put all front photos
for (const p of raw) {
  if (isBackSrc(p.src)) continue;
  photosMap.set(p.src, {
    ...p,
    category: p.category ?? 'related',
  });
}

// Second pass: attach backs to fronts when possible
for (const p of raw) {
  if (!isBackSrc(p.src)) continue;

  const frontSrc = getFrontSrcForBack(p.src);
  const front = photosMap.get(frontSrc);

  if (front) {
    if (!front.backSrc) {
      front.backSrc = p.src;
    }
    if (p.caption && !front.backCaption) {
      front.backCaption = p.caption;
    }
  } else {
    // No matching front found — keep as a standalone photo
    photosMap.set(p.src, {
      ...p,
      category: p.category ?? 'related',
    });
  }
}

const photos: PhotoEntry[] = Array.from(photosMap.values());

const visible: PhotoEntry[] = photos.filter((p) => !p.hidden);

const CATEGORY_ORDER: Record<PhotoCategory, number> = {
  personal: 0,
  group: 1,
  related: 2,
};

function sortPhotosForDisplay(list: PhotoEntry[]): PhotoEntry[] {
  return [...list].sort((a, b) => {
    const aOrder = CATEGORY_ORDER[a.category ?? 'related'] ?? 2;
    const bOrder = CATEGORY_ORDER[b.category ?? 'related'] ?? 2;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return 0;
  });
}

export function getPhotos({ includeHidden = false } = {}): PhotoEntry[] {
  const base = includeHidden ? photos : visible;
  return sortPhotosForDisplay(base);
}

export function getPhotoById(id: string): PhotoEntry | null {
  return photos.find((p) => p.id === id || p.src === id) ?? null;
}

export function getPhotosByCategory(category: PhotoCategory): PhotoEntry[] {
  return sortPhotosForDisplay(visible.filter((p) => p.category === category));
}

/** Photos linked to a person (in people array). */
export function getPhotosByPerson(personId: string): PhotoEntry[] {
  return sortPhotosForDisplay(
    visible.filter((p) => (p.people ?? []).some((pp) => pp.personId === personId))
  );
}

/** Preferred panel photo: personal first, then group (with this person marked), else null. */
export function getPreferredPanelPhoto(personId: string): PhotoEntry | null {
  const personPhotos = getPhotosByPerson(personId);
  const personal = personPhotos.find((p) => p.category === 'personal');
  if (personal) return personal;
  const group = personPhotos.find((p) => p.category === 'group');
  return group ?? null;
}

/** Split person photos for panel carousels: no-series (personal → group → related) and by series. */
export function splitPersonPhotosForCarousels(photos: PhotoEntry[]): {
  noSeries: PhotoEntry[];
  bySeries: { seriesName: string; photos: PhotoEntry[] }[];
} {
  const noSeries = sortPhotosForDisplay(
    photos.filter((p) => !(p.series ?? '').trim())
  );
  const withSeries = photos.filter((p) => (p.series ?? '').trim());
  const seriesMap = new Map<string, PhotoEntry[]>();
  for (const p of withSeries) {
    const name = (p.series ?? '').trim();
    if (!seriesMap.has(name)) seriesMap.set(name, []);
    seriesMap.get(name)!.push(p);
  }
  const bySeries = [...seriesMap.entries()].map(([seriesName, list]) => ({
    seriesName,
    photos: sortPhotosForDisplay(list),
  }));
  return { noSeries, bySeries };
}

/** Split all photos for section carousels: personal, group, related (each no-series), then by series. */
export function splitAllPhotosForCarousels(photos: PhotoEntry[]): {
  personal: PhotoEntry[];
  group: PhotoEntry[];
  related: PhotoEntry[];
  bySeries: { seriesName: string; photos: PhotoEntry[] }[];
} {
  const hasNoSeries = (p: PhotoEntry) => !(p.series ?? '').trim();
  const personal = sortPhotosForDisplay(photos.filter((p) => p.category === 'personal' && hasNoSeries(p)));
  const group = sortPhotosForDisplay(photos.filter((p) => p.category === 'group' && hasNoSeries(p)));
  const related = sortPhotosForDisplay(photos.filter((p) => (p.category === 'related' || !p.category) && hasNoSeries(p)));
  const withSeries = photos.filter((p) => (p.series ?? '').trim());
  const seriesMap = new Map<string, PhotoEntry[]>();
  for (const p of withSeries) {
    const name = (p.series ?? '').trim();
    if (!seriesMap.has(name)) seriesMap.set(name, []);
    seriesMap.get(name)!.push(p);
  }
  const bySeries = [...seriesMap.entries()].map(([seriesName, list]) => ({
    seriesName,
    photos: sortPhotosForDisplay(list),
  }));
  return { personal, group, related, bySeries };
}

/** Image URLs by category: front (src) and back (backSrc) if present. */
export function getImageLinksByCategory(category: PhotoCategory): string[] {
  return getPhotosByCategory(category).flatMap((p) =>
    [p.src, p.backSrc].filter((s): s is string => Boolean(s))
  );
}

/** Photo by src (for avatar lookup). */
export function getPhotoBySrc(src: string): PhotoEntry | null {
  return visible.find((p) => p.src === src) ?? null;
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
  const encoded = encodeURI(src);
  if (w < MIN_RECT_SIZE || h < MIN_RECT_SIZE) {
    return {
      backgroundImage: `url(${encoded})`,
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
    backgroundImage: `url(${encoded})`,
    backgroundRepeat: 'no-repeat',
    // Use uniform horizontal scale and auto height to avoid stretching.
    backgroundSize: `${size}% auto`,
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
  const personPhotos = getPhotosByPerson(personId);
  const first =
    personPhotos.find((p) => p.category === 'personal') ??
    personPhotos.find((p) => p.category === 'group') ??
    personPhotos[0];
  if (!first) return null;
  return {
    src: first.src,
    faceRect: getPersonFaceRect(first, personId),
  };
}

/** All avatar options for a person (each photo cropped by face rect). */
export function getAvatarOptionsForPerson(personId: string): AvatarSource[] {
  return getAvatarOptionsForPersonFromList(visible, personId);
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
