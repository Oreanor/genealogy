/**
 * Ручные дополнения к записям архива (FamilySearch): снимки страниц.
 * Уточнённое место и координаты — в `indexedEvents.json` (поля precisePlace, lat, lon).
 */
export type IndexedEventAttachment = {
  /** Id фото из `data.json` (категория «документ/книга» и т.п.). */
  photoIds?: string[];
  /** Прямые пути под `public`, напр. `/photos/related/metric-p123.jpg`. */
  imageSrcs?: string[];
};

export type IndexedEventAttachmentsFile = {
  byHitId: Record<string, IndexedEventAttachment>;
};
