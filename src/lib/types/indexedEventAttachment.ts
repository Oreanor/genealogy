/**
 * Ручные дополнения к записям архива (FamilySearch): точное место из книги и снимки страниц.
 * Хранятся в `indexedEventAttachments.json`, ключ — `hitId` из indexed events.
 */
export type IndexedEventAttachment = {
  /** Как в метрической / на скане (хутор, село, волость). */
  precisePlace?: string;
  /** Id фото из `data.json` (категория «документ/книга» и т.п.). */
  photoIds?: string[];
  /** Прямые пути под `public`, напр. `/photos/related/metric-p123.jpg`. */
  imageSrcs?: string[];
};

export type IndexedEventAttachmentsFile = {
  byHitId: Record<string, IndexedEventAttachment>;
};
