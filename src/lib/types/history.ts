/** One history entry: title, rich text, person links (no images in rich text) */
export interface HistoryEntry {
  /** Title (heading) */
  title: string;
  /** HTML content */
  richText: string;
  /** Person IDs */
  personIds: string[];
  /** Hidden from book, search, PDF export. */
  hidden?: boolean;
}
