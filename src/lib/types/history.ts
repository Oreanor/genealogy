/** One history entry: title, HTML rich text (TipTap; may include images from `/photos/…`), person links */
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
