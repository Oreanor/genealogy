/**
 * Сборка `src/lib/data/podvigNaroda.json` из пагинированных ответов API «Подвиг народа» (`docs/podvig/1.json` … `4.json`).
 * Для каждой записи с известным годом рождения добавляет `derived`: год и `mapGeoPlaceLabel` для карты (без повторного разбора на клиенте).
 *
 *   node scripts/podvig-naroda-build.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const PODVIG_DIR = path.join(root, 'docs', 'podvig');
const OUT = path.join(root, 'src', 'lib', 'data', 'podvigNaroda.json');

const FILES = ['1.json', '2.json', '3.json', '4.json'];

/** @param {string|undefined|null} v */
function emptyToUndef(v) {
  if (v == null) return undefined;
  const s = String(v).trim();
  return s === '' ? undefined : s;
}

/** @param {Record<string, unknown>} raw */
function mapEntityToType(raw) {
  const e = String(raw.entity ?? '');
  if (e === 'Человек Награждение') return 'award';
  if (e === 'Человек Картотека') return 'card_index';
  if (e === 'Человек Юбилейная Картотека') return 'jubilee_card';
  if (e === 'Человек Представление') return 'recommendation';
  return 'unknown';
}

/** @param {Record<string, unknown>} raw */
function collectScans(raw) {
  const paths = [raw.f27, raw.f28, raw.f29].map((x) => emptyToUndef(x)).filter(Boolean);
  return paths.length ? paths : undefined;
}

/** @param {Record<string, unknown>} raw */
function normalizePerson(raw) {
  return {
    lastName: String(raw.f2 ?? '').trim(),
    firstName: String(raw.f3 ?? '').trim(),
    patronymic: String(raw.f4 ?? '').trim(),
    birthDateRaw: emptyToUndef(raw.f5),
    rank: emptyToUndef(raw.f6),
    /** Дата/период в источнике (призыв, гибель и т.п. — как в выгрузке). */
    eventDateRaw: emptyToUndef(raw.f7),
  };
}

/** @param {Record<string, unknown>} raw */
function normalizeAward(raw) {
  return {
    title: String(raw.f9 ?? '').trim() || undefined,
    decreeDateRaw: emptyToUndef(raw.f15),
    militaryUnit: emptyToUndef(raw.f22),
    draftOffice: emptyToUndef(raw.f8),
    draftPlaceId: emptyToUndef(raw.draftPlaceId),
    draftPlaceLabel: emptyToUndef(raw.draftPlace),
    /** Доп. дата в карточке награждения (напр. бой). */
    secondaryDateRaw: emptyToUndef(raw.f24),
    registry: {
      fond: emptyToUndef(raw.f11),
      opus: emptyToUndef(raw.f12),
      case: emptyToUndef(raw.f13),
    },
    archive: emptyToUndef(raw.f34),
    externalRef: emptyToUndef(raw.f32),
    externalFlag: emptyToUndef(raw.f33),
    scans: collectScans(raw),
  };
}

/** @param {Record<string, unknown>} raw */
function normalizeCardIndex(raw) {
  return {
    seriesTitle: emptyToUndef(raw.f11),
    storageLocation: emptyToUndef(raw.f13),
    residenceOrLocality: emptyToUndef(raw.f23),
    archive: emptyToUndef(raw.f34),
    externalRef: emptyToUndef(raw.f32),
    externalFlag: emptyToUndef(raw.f33),
  };
}

/** @param {Record<string, unknown>} raw */
function normalizeJubileeCard(raw) {
  return {
    orderOrMedal: emptyToUndef(raw.f9),
    registrationNumber: emptyToUndef(raw.f10),
    seriesTitle: emptyToUndef(raw.f11),
    storageLocation: emptyToUndef(raw.f13),
    sheetOrList: emptyToUndef(raw.f14),
    decreeDateRaw: emptyToUndef(raw.f15),
    issuer: emptyToUndef(raw.f19),
    locality: emptyToUndef(raw.f23),
    archive: emptyToUndef(raw.f34),
    externalFlag: emptyToUndef(raw.f33),
  };
}

/** @param {Record<string, unknown>} raw */
function normalizeRecommendation(raw) {
  return {
    title: String(raw.f9 ?? '').trim() || undefined,
    militaryUnitOrBody: emptyToUndef(raw.f22),
    registry: {
      fond: emptyToUndef(raw.f11),
      opus: emptyToUndef(raw.f12),
      case: emptyToUndef(raw.f13),
    },
    archive: emptyToUndef(raw.f34),
    externalFlag: emptyToUndef(raw.f33),
  };
}

/** @param {Record<string, unknown>} raw */
function normalizeRecord(raw) {
  const recordType = mapEntityToType(raw);
  const base = {
    id: String(raw.id),
    recordNumber: emptyToUndef(raw.recordNumber),
    numChildItems:
      raw.numchilditems != null && String(raw.numchilditems).trim() !== ''
        ? Number.parseInt(String(raw.numchilditems), 10)
        : undefined,
    recordType,
    person: normalizePerson(raw),
    source: {
      entityLabelRu: String(raw.entity ?? ''),
      /** Полная строка ответа API (f-поля, priznak, draftPlace…). */
      api: raw,
    },
  };

  if (recordType === 'award') {
    return { ...base, award: normalizeAward(raw) };
  }
  if (recordType === 'card_index') {
    return { ...base, cardIndex: normalizeCardIndex(raw) };
  }
  if (recordType === 'jubilee_card') {
    return { ...base, jubileeCard: normalizeJubileeCard(raw) };
  }
  if (recordType === 'recommendation') {
    return { ...base, recommendation: normalizeRecommendation(raw) };
  }

  return { ...base, unmapped: { hint: 'unknown entity type' } };
}

function parsePodvigBirthYear(birthDateRaw) {
  if (birthDateRaw == null || String(birthDateRaw).trim() === '') return null;
  const m = String(birthDateRaw).match(/\b(1[0-9]{3}|20[0-9]{2})\b/);
  return m ? Number.parseInt(m[0], 10) : null;
}

/** Как `podvigGeoPlaceLabel` в `src/lib/data/podvigNarodaMap.ts` — одна точка правды по смыслу. */
function geoPlaceFromRecord(rec) {
  if (rec.recordType === 'award' && rec.award?.draftOffice?.trim()) {
    return rec.award.draftOffice.trim().split('|')[0].trim();
  }
  if (rec.recordType === 'card_index' && rec.cardIndex?.residenceOrLocality?.trim()) {
    return rec.cardIndex.residenceOrLocality.trim().split('|')[0].trim();
  }
  if (rec.recordType === 'jubilee_card' && rec.jubileeCard?.locality?.trim()) {
    return rec.jubileeCard.locality.trim().split('|')[0].trim();
  }
  if (rec.recordType === 'recommendation' && rec.recommendation?.militaryUnitOrBody?.trim()) {
    return rec.recommendation.militaryUnitOrBody.trim();
  }
  return null;
}

function withMapDerived(rec) {
  const birthYear = parsePodvigBirthYear(rec.person?.birthDateRaw);
  if (birthYear == null) return rec;
  return {
    ...rec,
    derived: {
      birthYear,
      mapGeoPlaceLabel: geoPlaceFromRecord(rec),
    },
  };
}

function main() {
  const byId = new Map();
  const sources = [];

  for (const name of FILES) {
    const fp = path.join(PODVIG_DIR, name);
    if (!fs.existsSync(fp)) {
      console.warn('skip missing', fp);
      continue;
    }
    const j = JSON.parse(fs.readFileSync(fp, 'utf8'));
    sources.push(`docs/podvig/${name}`);
    for (const r of j.records ?? []) {
      const id = String(r.id);
      if (!byId.has(id)) byId.set(id, r);
    }
  }

  const records = [...byId.values()].map((raw) => withMapDerived(normalizeRecord(raw)));

  records.sort((a, b) => {
    const na = Number.parseInt(a.recordNumber ?? '0', 10);
    const nb = Number.parseInt(b.recordNumber ?? '0', 10);
    return na - nb;
  });

  const out = {
    meta: {
      about: 'Объединённые карточки «Подвиг народа» (ЦАМО): награждения, картотеки, представления.',
      mergedFrom: sources,
      recordCount: records.length,
      builtAt: new Date().toISOString(),
    },
    records,
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, `${JSON.stringify(out, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${records.length} records → ${path.relative(root, OUT)}`);
}

main();
