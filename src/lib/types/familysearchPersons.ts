export type FamilySearchPersonEntry = {
  id: string;
  /** Record principal with Birth/Death; otherwise only an anchor's parent. */
  kind?: 'anchor' | 'parentOnly';
  firstName: string;
  lastName?: string;
  patronymic?: string;
  gender?: 'm' | 'f';
  birthDate?: string;
  deathDate?: string;
  birthPlace?: string;
  /** Refined place from indexedEvents.json (filled in by the fs-export-persons script). */
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
