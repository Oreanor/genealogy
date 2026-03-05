export type PhotoCategory =
  | 'personal' /** person's personal photo */
  | 'group' /** presence in group photo */
  | 'related'; /** other: house, book, document */

export type PhotoPersonShape = 'point' | 'circle' | 'rect' | 'polygon';

export interface PhotoPerson {
  personId: string;
  /**
   * point: [x%, y%]
   * circle: [cx%, cy%, r%] — face/avatar area
   * rect: [left%, top%, right%, bottom%]
   * polygon: [x1,y1, x2,y2, ...]
   */
  coords?: number[];
  shape?: PhotoPersonShape;
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
  /** For personal: whose photo. For related: who it relates to. */
  personId?: string;
  /** For group: who is on the photo with zones. Optional for personal. */
  people?: PhotoPerson[];
}
