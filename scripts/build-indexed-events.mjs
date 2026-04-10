/**
 * Собирает события с местом и годом из familysearch-search-flat.json → lib/data/indexedEvents.json.
 * Запуск: node scripts/build-indexed-events.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "src", "data", "temp", "familysearch-search-flat.json");
const OUT = path.join(ROOT, "src", "lib", "data", "indexedEvents.json");

function placeKeyFromFact(fact, record) {
  if (fact.placeNormalized) return fact.placeNormalized;
  if (fact.placeOriginal) return fact.placeOriginal;
  if (record.indexing?.locality) return record.indexing.locality;
  return null;
}

function yearFromFact(fact) {
  const formal = fact.dateFormal;
  if (typeof formal === "string") {
    const m = formal.match(/\+(\d{4})/);
    if (m) return parseInt(m[1], 10);
  }
  const orig = fact.dateOriginal;
  if (typeof orig === "string") {
    const m2 = orig.match(/\b(1[4-9]\d{2}|20[0-2]\d)\b/);
    if (m2) return parseInt(m2[1], 10);
  }
  return null;
}

function main() {
  const raw = JSON.parse(fs.readFileSync(SRC, "utf8"));
  const records = raw.records ?? [];
  const events = [];
  let skippedNoPlace = 0;
  let skippedNoYear = 0;

  for (const r of records) {
    const p = r.principal;
    if (!p?.facts?.length) continue;
    for (let fi = 0; fi < p.facts.length; fi += 1) {
      const fact = p.facts[fi];
      const pk = placeKeyFromFact(fact, r);
      const y = yearFromFact(fact);
      if (!pk) {
        skippedNoPlace += 1;
        continue;
      }
      if (y == null || !Number.isFinite(y)) {
        skippedNoYear += 1;
        continue;
      }
      events.push({
        hitId: r.hitId,
        recordUrl: r.recordUrl ?? null,
        principalName: p.name ?? "",
        factType: fact.type ?? "Event",
        placeLabel: fact.placeOriginal || fact.placeNormalized || pk,
        placeKey: pk,
        year: y,
        dateOriginal: fact.dateOriginal ?? null,
      });
    }
  }

  events.sort((a, b) => a.year - b.year || a.hitId.localeCompare(b.hitId));

  fs.writeFileSync(OUT, JSON.stringify({ events, skippedNoPlace, skippedNoYear }, null, 2), "utf8");
  console.log("Written", OUT, "events:", events.length);
}

main();
