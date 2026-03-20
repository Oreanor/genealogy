import type { Person } from '@/lib/types/person';
import type { PhotoEntry } from '@/lib/types/photo';
import type { HistoryEntry } from '@/lib/types/history';
import type { GeocodedPoint } from '@/lib/constants/map';

export interface AdminDataSections {
  rootPersonId: string;
  persons: Person[];
  photos: PhotoEntry[];
  history: HistoryEntry[];
  placeFallbacks: Record<string, GeocodedPoint>;
}

export interface MergeConflict<T> {
  existing: T;
  incoming: T;
}

export interface SectionMerge<T> {
  toAdd: T[];
  conflicts: MergeConflict<T>[];
}

export interface MergeResult {
  persons: SectionMerge<Person>;
  photos: SectionMerge<PhotoEntry>;
  history: SectionMerge<HistoryEntry>;
  rootConflict: boolean;
  incomingRootPersonId: string;
  placeFallbacksConflict: boolean;
  incomingPlaceFallbacks: Record<string, GeocodedPoint>;
}

export type ConflictResolution = 'keep' | 'take';

/** Per-record resolutions: one entry per conflict, same order as MergeResult arrays. */
export interface MergeResolutions {
  persons: ConflictResolution[];
  photos: ConflictResolution[];
  history: ConflictResolution[];
  rootPersonId: ConflictResolution;
  placeFallbacks: ConflictResolution;
}

function eq(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function diffById<T extends { id: string }>(
  current: T[],
  incoming: T[]
): SectionMerge<T> {
  const map = new Map(current.map((item) => [item.id, item]));
  const toAdd: T[] = [];
  const conflicts: MergeConflict<T>[] = [];

  for (const item of incoming) {
    const existing = map.get(item.id);
    if (!existing) {
      toAdd.push(item);
    } else if (!eq(existing, item)) {
      conflicts.push({ existing, incoming: item });
    }
  }
  return { toAdd, conflicts };
}

function diffByTitle(
  current: HistoryEntry[],
  incoming: HistoryEntry[]
): SectionMerge<HistoryEntry> {
  const map = new Map(current.map((h) => [h.title, h]));
  const toAdd: HistoryEntry[] = [];
  const conflicts: MergeConflict<HistoryEntry>[] = [];

  for (const item of incoming) {
    const existing = map.get(item.title);
    if (!existing) {
      toAdd.push(item);
    } else if (!eq(existing, item)) {
      conflicts.push({ existing, incoming: item });
    }
  }
  return { toAdd, conflicts };
}

export function computeMerge(
  current: AdminDataSections,
  incoming: AdminDataSections
): MergeResult {
  return {
    persons: diffById(current.persons, incoming.persons),
    photos: diffById(current.photos, incoming.photos),
    history: diffByTitle(current.history, incoming.history),
    rootConflict: current.rootPersonId !== incoming.rootPersonId,
    incomingRootPersonId: incoming.rootPersonId,
    placeFallbacksConflict: !eq(current.placeFallbacks, incoming.placeFallbacks),
    incomingPlaceFallbacks: incoming.placeFallbacks,
  };
}

export function mergeHasChanges(m: MergeResult): boolean {
  return (
    m.persons.toAdd.length > 0 ||
    m.persons.conflicts.length > 0 ||
    m.photos.toAdd.length > 0 ||
    m.photos.conflicts.length > 0 ||
    m.history.toAdd.length > 0 ||
    m.history.conflicts.length > 0 ||
    m.rootConflict ||
    m.placeFallbacksConflict
  );
}

export function mergeHasConflicts(m: MergeResult): boolean {
  return (
    m.persons.conflicts.length > 0 ||
    m.photos.conflicts.length > 0 ||
    m.history.conflicts.length > 0 ||
    m.rootConflict ||
    m.placeFallbacksConflict
  );
}

export function buildDefaultResolutions(m: MergeResult): MergeResolutions {
  return {
    persons: m.persons.conflicts.map(() => 'keep' as ConflictResolution),
    photos: m.photos.conflicts.map(() => 'keep' as ConflictResolution),
    history: m.history.conflicts.map(() => 'keep' as ConflictResolution),
    rootPersonId: 'keep',
    placeFallbacks: 'keep',
  };
}

function applySectionPerRecord<T extends { id: string }>(
  current: T[],
  section: SectionMerge<T>,
  resolutions: ConflictResolution[]
): T[] {
  const result = [...current, ...section.toAdd];
  for (let i = 0; i < section.conflicts.length; i++) {
    if (resolutions[i] === 'take') {
      const c = section.conflicts[i];
      const idx = result.findIndex((item) => item.id === c.incoming.id);
      if (idx >= 0) result[idx] = c.incoming;
    }
  }
  return result;
}

function applyHistoryPerRecord(
  current: HistoryEntry[],
  section: SectionMerge<HistoryEntry>,
  resolutions: ConflictResolution[]
): HistoryEntry[] {
  const result = [...current, ...section.toAdd];
  for (let i = 0; i < section.conflicts.length; i++) {
    if (resolutions[i] === 'take') {
      const c = section.conflicts[i];
      const idx = result.findIndex((h) => h.title === c.incoming.title);
      if (idx >= 0) result[idx] = c.incoming;
    }
  }
  return result;
}

export function applyMerge(
  current: AdminDataSections,
  merge: MergeResult,
  resolutions: MergeResolutions
): AdminDataSections {
  return {
    rootPersonId:
      resolutions.rootPersonId === 'take' && merge.rootConflict
        ? merge.incomingRootPersonId
        : current.rootPersonId,
    placeFallbacks:
      resolutions.placeFallbacks === 'take' && merge.placeFallbacksConflict
        ? merge.incomingPlaceFallbacks
        : current.placeFallbacks,
    persons: applySectionPerRecord(
      current.persons,
      merge.persons,
      resolutions.persons
    ),
    photos: applySectionPerRecord(
      current.photos,
      merge.photos,
      resolutions.photos
    ),
    history: applyHistoryPerRecord(
      current.history,
      merge.history,
      resolutions.history
    ),
  };
}

/** Returns keys of obj where values differ between a and b. */
export function changedKeys<T extends Record<string, unknown>>(
  a: T,
  b: T
): string[] {
  const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const changed: string[] = [];
  for (const key of allKeys) {
    if (!eq(a[key], b[key])) changed.push(key);
  }
  return changed;
}

const REQUIRED_KEYS: (keyof AdminDataSections)[] = [
  'rootPersonId',
  'persons',
  'photos',
  'history',
  'placeFallbacks',
];

export function validateImportData(
  data: unknown
): data is AdminDataSections {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  return REQUIRED_KEYS.every((key) => key in obj);
}

/** djb2 hash — fast, sufficient for equality detection. */
export function hashData(data: AdminDataSections): string {
  const str = JSON.stringify(data);
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  }
  return h.toString(36);
}
