/**
 * Статистика по familysearch-search-flat.json: дубликаты, событий на personArk.
 * node scripts/analyze-familysearch-flat.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(__dirname, "..", "src", "data", "temp", "familysearch-search-flat.json");

function norm(s) {
  if (s == null || s === "") return "";
  return String(s).trim().replace(/\s+/g, " ").toLowerCase();
}

function firstFactFormal(person, type) {
  const f = person?.facts?.find((x) => x.type === type);
  return f?.dateFormal ?? "";
}

function firstFactPlaceNorm(person, type) {
  const f = person?.facts?.find((x) => x.type === type);
  return norm(f?.placeNormalized || f?.placeOriginal || "");
}

const { records } = JSON.parse(fs.readFileSync(FILE, "utf8"));

const byArk = new Map();
const byStrictKey = new Map();
const byLooseKey = new Map();
const byLooseNoPlace = new Map();

for (const r of records) {
  const p = r.principal;
  if (!p) continue;
  const ark = p.personArk || "";
  const name = norm(p.name);
  const b = firstFactFormal(p, "Birth");
  const d = firstFactFormal(p, "Death");
  const m = firstFactFormal(p, "Marriage");
  const bp = firstFactPlaceNorm(p, "Birth");
  const dp = firstFactPlaceNorm(p, "Death");

  const inc = (map, key, id) => {
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(id);
  };

  const hit = r.hitId;
  inc(byArk, ark || "(no-ark)", hit);

  const strictKey = [ark, name, b, d, m].join("\t");
  inc(byStrictKey, strictKey, hit);

  const looseKey = [name, b, d, m, bp, dp].join("\t");
  inc(byLooseKey, looseKey, hit);

  const looseNP = [name, b, d, m].join("\t");
  inc(byLooseNoPlace, looseNP, hit);
}

function stats(map) {
  const groups = [...map.entries()];
  const multi = groups.filter(([, ids]) => ids.length > 1);
  const dupHits = multi.reduce((s, [, ids]) => s + ids.length, 0);
  const redundantCopies = multi.reduce((s, [, ids]) => s + (ids.length - 1), 0);
  return {
    totalGroups: groups.length,
    groupsWithDuplicates: multi.length,
    recordsThatSitInSomeDuplicateGroup: dupHits,
    redundantCopies,
  };
}

function hist(map) {
  const counts = {};
  for (const [, ids] of map) {
    const n = ids.length;
    counts[n] = (counts[n] || 0) + 1;
  }
  return counts;
}

const arkHist = hist(byArk);
const noArk = byArk.get("(no-ark)")?.length || 0;
const nArkKeys = byArk.size - (byArk.has("(no-ark)") ? 1 : 0);
const meanPerArk = records.length / (nArkKeys || 1);

console.log("=== Записей (хитов поиска / индексных событий) ===", records.length);
console.log("=== Уникальных principal.personArk ===", nArkKeys, noArk ? `(без ARK записей: ${noArk})` : "");
console.log("\n=== Сколько хитов приходится на один personArk (гистограмма) ===");
Object.keys(arkHist)
  .map(Number)
  .sort((a, b) => a - b)
  .forEach((k) => console.log(`  ${k} хит(ов) на ARK: у ${arkHist[k]} уникальных ARK`));
console.log("Среднее хитов на уникальный personArk:", meanPerArk.toFixed(4));

const arkDups = [...byArk.entries()].filter(([k, ids]) => k !== "(no-ark)" && ids.length > 1);
console.log("\n=== Один и тот же personArk встречается в нескольких hitId ===");
console.log("Таких ARK:", arkDups.length);
if (arkDups.length) {
  console.log("Примеры (до 8):");
  arkDups.slice(0, 8).forEach(([k, ids]) => console.log(" ", ids.length, k, "->", ids.join(", ")));
}

console.log("\n=== Строго: ARK + норм.имя + formal Birth/Death/Marriage ===");
console.log(stats(byStrictKey));

console.log(
  "\n=== «Почти тот же человек» без сравнения ARK: имя + даты + норм.места рожд/смерти ===",
);
const looseSt = stats(byLooseKey);
console.log(looseSt);
const looseMulti = [...byLooseKey.entries()].filter(([, ids]) => ids.length > 1);
console.log("Групп с повторами:", looseMulti.length);
if (looseMulti.length) {
  console.log("Примеры (до 5):");
  for (const [key, ids] of looseMulti.slice(0, 5)) {
    const [n, bb, dd, mm, bpl, dpl] = key.split("\t");
    console.log(`  ${ids.length} записей:`, ids.join(", "));
    console.log(`    имя=${n} birth=${bb} death=${dd} marriage=${mm} birthPl=${bpl} deathPl=${dpl}`);
  }
}

console.log("\n=== Шире: только имя + formal Birth/Death/Marriage (места игнор) ===");
console.log(stats(byLooseNoPlace));

console.log("\nУникальных «персон» по широкому ключу (имя+даты+2 места):", byLooseKey.size);
