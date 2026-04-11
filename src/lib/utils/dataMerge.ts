import type { Person } from '@/lib/types/person';
import type { PhotoEntry } from '@/lib/types/photo';
import type { HistoryEntry } from '@/lib/types/history';
import type { GeocodedPoint } from '@/lib/constants/map';
import type { LineDynamicsDataset } from '@/lib/types/lineDynamics';
import { EMPTY_LINE_DYNAMICS } from '@/lib/types/lineDynamics';

export interface AdminDataSections {
  rootPersonId: string;
  persons: Person[];
  photos: PhotoEntry[];
  history: HistoryEntry[];
  placeFallbacks: Record<string, GeocodedPoint>;
  lineDynamics: LineDynamicsDataset;
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
  lineDynamicsConflict: boolean;
  incomingLineDynamics: LineDynamicsDataset;
}

export type ConflictResolution = 'keep' | 'take';

/** Per-record resolutions: one entry per conflict, same order as MergeResult arrays. */
export interface MergeResolutions {
  persons: ConflictResolution[];
  photos: ConflictResolution[];
  history: ConflictResolution[];
  rootPersonId: ConflictResolution;
  placeFallbacks: ConflictResolution;
  lineDynamics: ConflictResolution;
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
    lineDynamicsConflict: !eq(
      current.lineDynamics,
      incoming.lineDynamics
    ),
    incomingLineDynamics: incoming.lineDynamics,
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
    m.placeFallbacksConflict ||
    m.lineDynamicsConflict
  );
}

export function mergeHasConflicts(m: MergeResult): boolean {
  return (
    m.persons.conflicts.length > 0 ||
    m.photos.conflicts.length > 0 ||
    m.history.conflicts.length > 0 ||
    m.rootConflict ||
    m.placeFallbacksConflict ||
    m.lineDynamicsConflict
  );
}

export function buildDefaultResolutions(m: MergeResult): MergeResolutions {
  return {
    persons: m.persons.conflicts.map(() => 'keep' as ConflictResolution),
    photos: m.photos.conflicts.map(() => 'keep' as ConflictResolution),
    history: m.history.conflicts.map(() => 'keep' as ConflictResolution),
    rootPersonId: 'keep',
    placeFallbacks: 'keep',
    lineDynamics: 'keep',
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
    lineDynamics:
      resolutions.lineDynamics === 'take' && merge.lineDynamicsConflict
        ? merge.incomingLineDynamics
        : current.lineDynamics,
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

/** Legacy imports may omit `lineDynamics`; use `parseAdminImportData`. */
const IMPORT_BASE_KEYS = [
  'rootPersonId',
  'persons',
  'photos',
  'history',
  'placeFallbacks',
] as const;

export function validateImportData(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  return IMPORT_BASE_KEYS.every((key) => key in obj);
}

function isLineDynamicsDataset(v: unknown): v is LineDynamicsDataset {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.title === 'string' &&
    typeof o.description === 'string' &&
    Array.isArray(o.data)
  );
}

function pickLineDynamics(obj: Record<string, unknown>): LineDynamicsDataset {
  if (isLineDynamicsDataset(obj.lineDynamics)) return obj.lineDynamics;
  if (isLineDynamicsDataset(obj.nikonetsLineDynamics)) {
    return obj.nikonetsLineDynamics;
  }
  return EMPTY_LINE_DYNAMICS;
}

/** Normalizes optional `lineDynamics`; legacy imports may use `nikonetsLineDynamics`. */
export function parseAdminImportData(raw: unknown): AdminDataSections | null {
  if (!validateImportData(raw)) return null;
  const obj = raw as Record<string, unknown>;
  return {
    rootPersonId: obj.rootPersonId as string,
    persons: obj.persons as Person[],
    photos: obj.photos as PhotoEntry[],
    history: obj.history as HistoryEntry[],
    placeFallbacks: obj.placeFallbacks as Record<string, GeocodedPoint>,
    lineDynamics: pickLineDynamics(obj),
  };
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
