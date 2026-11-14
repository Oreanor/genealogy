/** Types for `podvigNaroda.json` ("Podvig Naroda" / TsAMO export). */

export type PodvigNarodaRecordType =
  | 'award'
  | 'card_index'
  | 'jubilee_card'
  | 'recommendation'
  | 'unknown';

export type PodvigNarodaPerson = {
  lastName: string;
  firstName: string;
  patronymic: string;
  birthDateRaw?: string;
  rank?: string;
  /** As in the API (f7): enlistment, death, etc. */
  eventDateRaw?: string;
};

export type PodvigNarodaRegistryRef = {
  fond?: string;
  opus?: string;
  case?: string;
};

export type PodvigNarodaAwardDetails = {
  title?: string;
  decreeDateRaw?: string;
  militaryUnit?: string;
  draftOffice?: string;
  draftPlaceId?: string;
  draftPlaceLabel?: string;
  secondaryDateRaw?: string;
  registry: PodvigNarodaRegistryRef;
  archive?: string;
  externalRef?: string;
  externalFlag?: string;
  scans?: string[];
};

export type PodvigNarodaCardIndexDetails = {
  seriesTitle?: string;
  storageLocation?: string;
  residenceOrLocality?: string;
  archive?: string;
  externalRef?: string;
  externalFlag?: string;
};

export type PodvigNarodaJubileeCardDetails = {
  orderOrMedal?: string;
  registrationNumber?: string;
  seriesTitle?: string;
  storageLocation?: string;
  sheetOrList?: string;
  decreeDateRaw?: string;
  issuer?: string;
  locality?: string;
  archive?: string;
  externalFlag?: string;
};

export type PodvigNarodaRecommendationDetails = {
  title?: string;
  militaryUnitOrBody?: string;
  registry: PodvigNarodaRegistryRef;
  archive?: string;
  externalFlag?: string;
};

/** Raw row object as returned by the site (f2… fields, priznak, draftPlace…). */
export type PodvigNarodaSourceApi = Record<string, string | undefined>;

/** Filled in by `scripts/podvig-naroda-build.mjs` so the map doesn't re-parse dates and record types at runtime. */
export type PodvigNarodaDerived = {
  birthYear: number;
  /** Place to geocode (same as `podvigGeoPlaceLabel` at runtime). */
  mapGeoPlaceLabel: string | null;
};

export type PodvigNarodaRecordBase = {
  id: string;
  recordNumber?: string;
  numChildItems?: number;
  recordType: PodvigNarodaRecordType;
  person: PodvigNarodaPerson;
  /** Source entity and full API response, for fields outside the main schema. */
  source: {
    entityLabelRu: string;
    api: PodvigNarodaSourceApi;
  };
  /** Present on built records; tests and hand-written fixtures may omit it. */
  derived?: PodvigNarodaDerived;
};

export type PodvigNarodaAwardRecord = PodvigNarodaRecordBase & {
  recordType: 'award';
  award: PodvigNarodaAwardDetails;
};

export type PodvigNarodaCardIndexRecord = PodvigNarodaRecordBase & {
  recordType: 'card_index';
  cardIndex: PodvigNarodaCardIndexDetails;
};

export type PodvigNarodaJubileeCardRecord = PodvigNarodaRecordBase & {
  recordType: 'jubilee_card';
  jubileeCard: PodvigNarodaJubileeCardDetails;
};

export type PodvigNarodaRecommendationRecord = PodvigNarodaRecordBase & {
  recordType: 'recommendation';
  recommendation: PodvigNarodaRecommendationDetails;
};

export type PodvigNarodaUnknownRecord = PodvigNarodaRecordBase & {
  recordType: 'unknown';
  unmapped?: { hint?: string };
};

export type PodvigNarodaRecord =
  | PodvigNarodaAwardRecord
  | PodvigNarodaCardIndexRecord
  | PodvigNarodaJubileeCardRecord
  | PodvigNarodaRecommendationRecord
  | PodvigNarodaUnknownRecord;

export type PodvigNarodaFile = {
  meta: {
    about: string;
    mergedFrom: string[];
    recordCount: number;
    builtAt: string;
  };
  records: PodvigNarodaRecord[];
};
