export type FamilySearchPersonEntry = {
  id: string;
  /** principal с Birth/Death в записи; иначе только родитель якоря. */
  kind?: 'anchor' | 'parentOnly';
  firstName: string;
  lastName?: string;
  patronymic?: string;
  gender?: 'm' | 'f';
  birthDate?: string;
  deathDate?: string;
  birthPlace?: string;
  /** Уточнённое место из indexedEvents.json (подставляется скриптом fs-export-persons). */
  precisePlace?: string;
  fatherId?: string;
  motherId?: string;
  comment?: string;
};

export type FamilySearchPersonsFile = {
  meta: {
    sourceJson?: string;
    recordCount?: number;
    uniquePersonArks?: number;
    rawPersonArks?: number;
    afterDedupeArks?: number;
    outputRows?: number;
    anchorRows?: number;
    generatedAt?: string;
    note?: string;
  };
  persons: FamilySearchPersonEntry[];
};
