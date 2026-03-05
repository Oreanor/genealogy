export interface Person {
  id: string;
  firstName: string;
  patronymic?: string;
  lastName?: string;
  /** Approximate date (year, range): "1925", "ca. 1895", "1925–1926" */
  birthDate?: string;
  /** Approximate death date */
  deathDate?: string;
  birthPlace?: string;
  occupation?: string;
  /** Preferred photo src for avatar (from photos where person is in people). */
  avatarPhotoSrc?: string;
  /** Father's person id (tree slot 0). */
  fatherId?: string;
  /** Mother's person id (tree slot 1). */
  motherId?: string;
  /** For tree and card roles: son/daughter, father/mother */
  gender?: 'm' | 'f';
}
