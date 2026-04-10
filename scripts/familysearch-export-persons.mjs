/**
 * Список людей из JSON выгрузки FamilySearch (search-flat: records[], principal, otherPersons) в формате,
 * близком к data.json (Person). Родители — из otherPersons (Father/Mother).
 *
 * npm run fs-export-persons -- --json path/to/export.json
 */
import fs from "node:fs";
import path from "node:path";
import { __fsMediaRoot, fsOrigin } from "./fs-media-lib.mjs";

const DEFAULT_OUT_PATH = path.join(__fsMediaRoot, "src", "lib", "data", "familysearchPersons.json");
const DEFAULT_INDEXED_EVENTS_PATH = path.join(__fsMediaRoot, "src", "lib", "data", "indexedEvents.json");

/** hitId → precisePlace из indexedEvents*.json (один раз при сборке, без работы на клиенте). */
function loadPrecisePlaceByHitId(indexedEventsPath) {
  const map = new Map();
  if (!fs.existsSync(indexedEventsPath)) return map;
  const raw = JSON.parse(fs.readFileSync(indexedEventsPath, "utf8"));
  for (const e of raw.events ?? []) {
    const hid = String(e.hitId ?? "").trim().toUpperCase();
    const pp = String(e.precisePlace ?? "").trim();
    if (!hid || !pp) continue;
    if (!map.has(hid)) map.set(hid, pp);
  }
  return map;
}

function pickPrecisePlaceForProfile(p, preciseByHitId) {
  for (const hid of p.principalHitIds ?? []) {
    const key = String(hid).trim().toUpperCase();
    const pp = preciseByHitId.get(key);
    if (pp) return pp;
  }
  const selfKey = String(p.personKey ?? "").trim().toUpperCase();
  return (selfKey && preciseByHitId.get(selfKey)) || "";
}

function parseArgs(argv) {
  let jsonPath = null;
  let outPersons = null;
  let indexedEvents = null;
  const rest = [...argv];
  while (rest.length) {
    const a = rest.shift();
    if (a === "--json" && rest.length) jsonPath = path.resolve(rest.shift());
    else if (a === "--out-persons" && rest.length) outPersons = path.resolve(rest.shift());
    else if (a === "--indexed-events" && rest.length) indexedEvents = path.resolve(rest.shift());
  }
  return { jsonPath, outPersons, indexedEvents };
}

function normArkKey(ark) {
  const s = String(ark ?? "").trim();
  const m = s.match(/1:1:([A-Z0-9-]+)/i);
  return m ? m[1].toUpperCase() : "";
}

function parseNameParts(full) {
  const parts = String(full ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return { firstName: "", patronymic: undefined, lastName: undefined };
  if (parts.length === 1) return { firstName: parts[0] };
  if (parts.length === 2) return { firstName: parts[0], lastName: parts[1] };
  return { firstName: parts[0], patronymic: parts[1], lastName: parts.slice(2).join(" ") };
}

function genderToMf(g) {
  if (g === "Male") return "m";
  if (g === "Female") return "f";
  return undefined;
}

function pickBestFact(facts, type) {
  const list = (facts ?? []).filter((f) => f.type === type);
  if (list.length === 0) return null;
  const primary = list.find((f) => f.primary);
  const pool = primary ? [primary, ...list.filter((x) => x !== primary)] : list;
  pool.sort((a, b) => {
    const la = String(a.dateOriginal ?? a.dateFormal ?? "").length;
    const lb = String(b.dateOriginal ?? b.dateFormal ?? "").length;
    return lb - la;
  });
  return pool[0];
}

function yearFromFact(f) {
  if (!f?.dateFormal) return null;
  const m = String(f.dateFormal).match(/(\d{3,4})/);
  return m ? Number(m[1]) : null;
}

function normNameKey(name) {
  return String(name ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function longestName(names) {
  return [...names].sort((a, b) => b.length - a.length)[0] || "";
}

function scorePerson(p) {
  let s = 0;
  if (p.fatherKeys.size >= 1 && p.motherKeys.size >= 1) s += 60;
  else if (p.fatherKeys.size || p.motherKeys.size) s += 25;
  const bf = pickBestFact(p.birthFacts, "Birth");
  const df = pickBestFact(p.deathFacts, "Death");
  if (bf) {
    s += 20;
    const yo = String(bf.dateOriginal ?? "");
    if (/\d{1,2}\s+\w+\s+\d{4}/.test(yo) || /\d{4}-\d{2}-\d{2}/.test(String(bf.dateFormal))) s += 15;
  }
  if (df) s += 15;
  if (p.gender) s += 5;
  s += Math.min(25, p.principalHitIds.size * 5);
  s += Math.min(10, p.names.size * 2);
  return s;
}

/** Ключ слияния: одно ФИО + один год (рожд. или смерти); иначе отдельная строка. */
function mergeClusterKey(p) {
  const nk = normNameKey(longestName(p.names));
  if (!nk) return `empty|${p.personKey}`;
  const by = yearFromFact(pickBestFact(p.birthFacts, "Birth"));
  if (by != null) return `${nk}|b:${by}`;
  const dy = yearFromFact(pickBestFact(p.deathFacts, "Death"));
  if (dy != null) return `${nk}|d:${dy}`;
  return `${nk}|id:${p.personKey}`;
}

function mergeInto(winner, loser) {
  for (const n of loser.names) winner.names.add(n);
  winner.birthFacts.push(...loser.birthFacts);
  winner.deathFacts.push(...loser.deathFacts);
  for (const x of loser.fatherKeys) winner.fatherKeys.add(x);
  for (const x of loser.motherKeys) winner.motherKeys.add(x);
  for (const x of loser.principalHitIds) winner.principalHitIds.add(x);
  for (const x of loser.recordHitIds) winner.recordHitIds.add(x);
  for (const x of loser.roles) winner.roles.add(x);
  if (!winner.gender && loser.gender) winner.gender = loser.gender;
  if (!winner.mergedFrom) winner.mergedFrom = [];
  winner.mergedFrom.push(loser.personKey);
}

function main() {
  const { jsonPath, outPersons, indexedEvents } = parseArgs(process.argv.slice(2));
  if (!jsonPath) {
    console.error(
      "Укажите входной JSON: npm run fs-export-persons -- --json path/to/familysearch-export.json\n" +
        "Опции: --out-persons path.json --indexed-events path.json (для precisePlace по hitId)",
    );
    process.exit(1);
  }
  if (!fs.existsSync(jsonPath)) {
    console.error(`Нет файла: ${jsonPath}`);
    process.exit(1);
  }

  const outPath = outPersons ?? DEFAULT_OUT_PATH;
  const indexedEventsPath = indexedEvents ?? DEFAULT_INDEXED_EVENTS_PATH;

  const raw = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const records = raw.records ?? [];
  const preciseByHitId = loadPrecisePlaceByHitId(indexedEventsPath);

  /** @type {Map<string, any>} */
  const byKey = new Map();

  function ensure(ark) {
    const k = normArkKey(ark);
    if (!k) return null;
    let p = byKey.get(k);
    if (!p) {
      p = {
        personKey: k,
        id: `fs-${k}`,
        names: new Set(),
        gender: null,
        birthFacts: [],
        deathFacts: [],
        fatherKeys: new Set(),
        motherKeys: new Set(),
        principalHitIds: new Set(),
        recordHitIds: new Set(),
        roles: new Set(),
      };
      byKey.set(k, p);
    }
    return p;
  }

  for (const r of records) {
    const phit = r.hitId;
    if (phit) {
      const pr = r.principal;
      if (pr?.personArk) {
        const p = ensure(pr.personArk);
        if (p) {
          p.names.add(pr.name);
          p.roles.add(pr.role || "Principal");
          const g = genderToMf(pr.gender);
          if (g) p.gender = g;
          for (const f of pr.facts ?? []) {
            if (f.type === "Birth") p.birthFacts.push({ ...f, _recordHitId: phit });
            if (f.type === "Death") p.deathFacts.push({ ...f, _recordHitId: phit });
          }
          p.principalHitIds.add(phit);
          p.recordHitIds.add(phit);
        }
      }
    }

    for (const op of r.otherPersons ?? []) {
      if (!op?.personArk) continue;
      const p = ensure(op.personArk);
      if (!p) continue;
      p.names.add(op.name);
      p.roles.add(op.role || "Other");
      const g = genderToMf(op.gender);
      if (g) p.gender = g;
      if (phit) p.recordHitIds.add(phit);
    }

    if (r.principal?.personArk) {
      const child = ensure(r.principal.personArk);
      if (child) {
        for (const op of r.otherPersons ?? []) {
          const k = normArkKey(op.personArk);
          if (!k) continue;
          if (op.role === "Father") child.fatherKeys.add(k);
          if (op.role === "Mother") child.motherKeys.add(k);
        }
      }
    }
  }

  const rawCount = byKey.size;

  /** Слияние дубликатов по mergeClusterKey. */
  const clusters = new Map();
  for (const p of byKey.values()) {
    const ck = mergeClusterKey(p);
    if (!clusters.has(ck)) clusters.set(ck, []);
    clusters.get(ck).push(p);
  }

  /** @type {Map<string, string>} старый personKey -> канонический personKey */
  const canonicalOf = new Map();
  /** @type {Map<string, any>} только канонические профили */
  const merged = new Map();

  for (const [, group] of clusters) {
    group.sort((a, b) => scorePerson(b) - scorePerson(a));
    const winner = group[0];
    merged.set(winner.personKey, winner);
    canonicalOf.set(winner.personKey, winner.personKey);
    for (let i = 1; i < group.length; i += 1) {
      mergeInto(winner, group[i]);
      canonicalOf.set(group[i].personKey, winner.personKey);
    }
  }

  /** Переписать fatherKeys/motherKeys на канонические ключи и сжать множества. */
  function canonKeySet(set) {
    const out = new Set();
    for (const k of set) {
      const c = canonicalOf.get(k) ?? k;
      out.add(c);
    }
    return out;
  }

  for (const p of merged.values()) {
    p.fatherKeys = canonKeySet(p.fatherKeys);
    p.motherKeys = canonKeySet(p.motherKeys);
    if (p.fatherKeys.has(p.personKey)) p.fatherKeys.delete(p.personKey);
    if (p.motherKeys.has(p.personKey)) p.motherKeys.delete(p.personKey);
  }

  const afterDedupe = merged.size;

  /** Якорь: был principal и есть Birth или Death в фактах. */
  function isAnchor(p) {
    if (p.principalHitIds.size === 0) return false;
    return p.birthFacts.length > 0 || p.deathFacts.length > 0;
  }

  const keepKeys = new Set();
  for (const p of merged.values()) {
    if (isAnchor(p)) keepKeys.add(p.personKey);
  }

  /** + родители якорей (один уровень). */
  const closure = new Set(keepKeys);
  for (const k of keepKeys) {
    const p = merged.get(k);
    if (!p) continue;
    for (const fk of p.fatherKeys) closure.add(fk);
    for (const mk of p.motherKeys) closure.add(mk);
  }

  /** fatherId/motherId только если родитель тоже в closure. */
  function fatherMotherIds(p) {
    const fc = [...p.fatherKeys].filter((k) => closure.has(k));
    const mc = [...p.motherKeys].filter((k) => closure.has(k));
    let fatherId;
    let motherId;
    if (fc.length === 1) fatherId = `fs-${fc[0]}`;
    if (mc.length === 1) motherId = `fs-${mc[0]}`;
    return { fatherId, motherId, fc, mc };
  }

  const base = fsOrigin();

  const persons = [...merged.values()]
    .filter((p) => closure.has(p.personKey))
    .map((p) => {
      const primaryName = longestName(p.names);
      const { firstName, patronymic, lastName } = parseNameParts(primaryName);
      const bf = pickBestFact(p.birthFacts, "Birth");
      const df = pickBestFact(p.deathFacts, "Death");
      const birthDate = bf?.dateOriginal || (bf?.dateFormal ? String(bf.dateFormal).replace(/^\+/, "") : undefined);
      const deathDate = df?.dateOriginal || (df?.dateFormal ? String(df.dateFormal).replace(/^\+/, "") : undefined);
      const birthPlace = bf?.placeOriginal || bf?.placeNormalized || "";
      const precisePlace = pickPrecisePlaceForProfile(p, preciseByHitId);

      const { fatherId, motherId, fc, mc } = fatherMotherIds(p);

      const parts = [];
      parts.push("FamilySearch (search-flat, прорежено)");
      if (p.mergedFrom?.length)
        parts.push(`объединены personArk: ${p.mergedFrom.map((x) => `fs-${x}`).join(", ")}`);
      if (p.principalHitIds.size) parts.push(`principal: ${p.principalHitIds.size} записей`);
      if (fc.length > 1) parts.push(`несколько отцов: ${fc.map((x) => `fs-${x}`).join(", ")}`);
      if (mc.length > 1) parts.push(`несколько матерей: ${mc.map((x) => `fs-${x}`).join(", ")}`);

      const sampleHit = [...p.principalHitIds][0];
      const sampleRec = records.find((r) => r.hitId === sampleHit);
      if (sampleRec?.recordUrl) parts.push(`${base}${sampleRec.recordUrl}`);

      const out = {
        id: p.id,
        kind: isAnchor(p) ? "anchor" : "parentOnly",
        firstName,
        lastName: lastName || undefined,
        patronymic: patronymic || undefined,
        gender: p.gender || undefined,
        birthDate: birthDate || undefined,
        deathDate: deathDate || undefined,
        birthPlace: birthPlace || undefined,
        precisePlace: precisePlace || undefined,
        fatherId,
        motherId,
        comment: parts.join(" · "),
      };
      Object.keys(out).forEach((k) => out[k] === undefined && delete out[k]);
      return { _score: scorePerson(p), ...out };
    });

  persons.sort((a, b) => b._score - a._score);
  const anchorRows = persons.filter((x) => x.kind === "anchor").length;
  for (const p of persons) delete p._score;

  const outDoc = {
    meta: {
      sourceJson: path.relative(__fsMediaRoot, jsonPath).replace(/\\/g, "/"),
      recordCount: records.length,
      rawPersonArks: rawCount,
      afterDedupeArks: afterDedupe,
      outputRows: persons.length,
      anchorRows,
      generatedAt: new Date().toISOString(),
      note:
        "Прореживание: дубликаты по имени+году (рожд./смерт.) слиты; precisePlace подставляется из indexedEvents.json по principal hitId. id fs-* не смешивать с p* из data.json.",
    },
    persons,
  };

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(outDoc, null, 2) + "\n", "utf8");
  console.log(
    `personArk: ${rawCount} → ${afterDedupe} после слияния; строк: ${persons.length} (якорей ${anchorRows}, только родители: ${persons.length - anchorRows})`,
  );
  console.log(`-> ${outPath}`);
}

main();
