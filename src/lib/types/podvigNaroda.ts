/** Типы для `podvigNaroda.json` (выгрузка «Подвиг народа» / ЦАМО). */

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
  /** Как в API (f7): призыв, гибель и т.д. */
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

/** Сырой объект строки как в ответе сайта (поля f2…, priznak, draftPlace…). */
export type PodvigNarodaSourceApi = Record<string, string | undefined>;

/** Заполняется `scripts/podvig-naroda-build.mjs`, чтобы рантайм карты не разбирал даты и типы карточек заново. */
export type PodvigNarodaDerived = {
  birthYear: number;
  /** Место для геокодинга (как `podvigGeoPlaceLabel` в рантайме). */
  mapGeoPlaceLabel: string | null;
};

export type PodvigNarodaRecordBase = {
  id: string;
  recordNumber?: string;
  numChildItems?: number;
  recordType: PodvigNarodaRecordType;
  person: PodvigNarodaPerson;
  /** Исходная сущность и полный ответ API — для полей вне основной схемы. */
  source: {
    entityLabelRu: string;
    api: PodvigNarodaSourceApi;
  };
  /** Есть у записей из сборки; тесты и ручные фрагменты могут обходиться без него. */
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
