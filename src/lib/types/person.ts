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
  photoUrl?: string;
  parentIds: string[];
  /** For tree and card roles: son/daughter, father/mother */
  gender?: 'm' | 'f';
}
