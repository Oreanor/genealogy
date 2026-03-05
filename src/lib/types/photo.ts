export type PhotoCategory =
  | 'personal' /** персональное фото персоны */
  | 'group' /** присутствие на групповом */
  | 'related'; /** прочее: дом, книга, документ */

export type PhotoPersonShape = 'point' | 'circle' | 'rect' | 'polygon';

export interface PhotoPerson {
  personId: string;
  /**
   * point: [x%, y%]
   * circle: [cx%, cy%, r%] — область лица/аватара
   * rect: [left%, top%, right%, bottom%]
   * polygon: [x1,y1, x2,y2, ...]
   */
  coords?: number[];
  shape?: PhotoPersonShape;
}

export interface PhotoEntry {
  id: string;
  src: string;
  /** Оборотная сторона */
  backSrc?: string;
  caption?: string;
  backCaption?: string;
  /** Категория для выборки по типу. По умолчанию related при загрузке. */
  category?: PhotoCategory;
  /** Для personal: чьё фото. Для related: к кому относится. */
  personId?: string;
  /** Для group: кто на фото с зонами. Для personal — опционально */
  people?: PhotoPerson[];
}
