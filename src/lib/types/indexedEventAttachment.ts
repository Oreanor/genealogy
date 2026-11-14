/**
 * Manual additions to archive (FamilySearch) records: page scans.
 * Refined place and coordinates live in `indexedEvents.json` (precisePlace, lat, lon).
 */
export type IndexedEventAttachment = {
  /** Photo ids from `data.json` (e.g. document / book category). */
  photoIds?: string[];
  /** Direct paths under `public`, e.g. `/photos/related/metric-p123.jpg`. */
  imageSrcs?: string[];
};

export type IndexedEventAttachmentsFile = {
  byHitId: Record<string, IndexedEventAttachment>;
};
