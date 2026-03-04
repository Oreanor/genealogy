export interface Person {
  id: string;
  name: string;
  birthYears?: string;
  birthPlace?: string;
  occupation?: string;
  photoUrl?: string;
  parentIds: string[];
}
