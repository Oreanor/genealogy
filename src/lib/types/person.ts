export interface Person {
  id: string;
  name: string;
  birthYears?: string;
  birthPlace?: string;
  occupation?: string;
  photoUrl?: string;
  parentIds: string[];
  /** Для ролей в древе и карточке: сын/дочь, отец/мать */
  gender?: 'm' | 'f';
}
