export interface Person {
  id: string;
  firstName: string;
  patronymic?: string;
  lastName?: string;
  /** Неточная дата (год, период): "1925", "ок. 1895", "1925–1926" */
  birthDate?: string;
  /** Неточная дата смерти */
  deathDate?: string;
  birthPlace?: string;
  occupation?: string;
  photoUrl?: string;
  parentIds: string[];
  /** Для ролей в древе и карточке: сын/дочь, отец/мать */
  gender?: 'm' | 'f';
}
