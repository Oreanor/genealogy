export type PhotoCategory =
  | 'personal' /** person's personal photo */
  | 'group' /** presence in group photo */
  | 'related'; /** other: house, book, document */

/** One face/zone on photo: either a person from the list or a custom name (e.g. "друг"). */
export interface PhotoFace {
  /** Person id from persons list; omit if using label. */
  personId?: string;
  /** Custom name when person is not in the list (e.g. "друг", "сосед"). */
  label?: string;
  /** Face rect [left%, top%, right%, bottom%] for avatar crop. */
  coords?: number[];
}

export interface PhotoEntry {
  id: string;
  src: string;
  /** Back side image */
  backSrc?: string;
  caption?: string;
  backCaption?: string;
  /** Category for filtering. Default related on load. */
  category?: PhotoCategory;
  /** Series name for grouping related photos (e.g. "Свадьба 1965", "Дом на Орловской"). */
  series?: string;
  /** Who is on the photo: array of person id + face rect (for avatar crop). */
  people?: PhotoFace[];
  /** Hidden from book, search, PDF export. */
  hidden?: boolean;
}
