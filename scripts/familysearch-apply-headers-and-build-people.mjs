import fs from "node:fs";
import path from "node:path";
import { __fsMediaRoot, DEFAULT_FS_JSON } from "./fs-media-lib.mjs";

const TEMP_DIR = path.join(__fsMediaRoot, "src", "data", "temp");
const DEFAULT_HEADERS_JSON = path.join(TEMP_DIR, "familysearch-viewer-headers (4).json");

function parseArgs(argv) {
  let recordsJson = DEFAULT_FS_JSON;
  let headersJson = DEFAULT_HEADERS_JSON;
  let outDir = TEMP_DIR;

  const rest = [...argv];
  while (rest.length) {
    const a = rest.shift();
    if (a === "--records" && rest.length) recordsJson = path.resolve(rest.shift());
    else if (a === "--headers" && rest.length) headersJson = path.resolve(rest.shift());
    else if (a === "--out-dir" && rest.length) outDir = path.resolve(rest.shift());
  }

  return { recordsJson, headersJson, outDir };
}

function normalizeName(v) {
  return String(v || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function addFreq(map, value) {
  const v = String(value || "").trim();
  if (!v) return;
  map.set(v, (map.get(v) ?? 0) + 1);
}

function topValue(map) {
  let best = "";
  let bestCount = -1;
  for (const [k, c] of map.entries()) {
    if (c > bestCount) {
      best = k;
      bestCount = c;
    }
  }
  return best;
}

function personKey(person) {
  if (person?.personArk) return `ark:${person.personArk}`;
  return `name:${normalizeName(person?.name)}|${person?.gender ?? ""}`;
}

function mergedPrincipalKey(record) {
  const p = record?.principal;
  const name = normalizeName(p?.name);
  const gender = String(p?.gender ?? "").trim().toLowerCase();
  const father = normalizeName(
    (record?.otherPersons ?? []).find((x) => x?.role === "Father")?.name,
  );
  const mother = normalizeName(
    (record?.otherPersons ?? []).find((x) => x?.role === "Mother")?.name,
  );
  // Если родителей нет — ключ станет слабее (возможно склеит однофамильцев), но это лучше,
  // чем не объединять события одного человека вообще.
  return `p:${name}|g:${gender}|f:${father}|m:${mother}`;
}

function uniqBy(arr, keyFn) {
  const seen = new Set();
  const out = [];
  for (const x of arr) {
    const k = keyFn(x);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(x);
  }
  return out;
}

function main() {
  const { recordsJson, headersJson, outDir } = parseArgs(process.argv.slice(2));

  if (!fs.existsSync(recordsJson)) {
    throw new Error(`Records JSON not found: ${recordsJson}`);
  }
  if (!fs.existsSync(headersJson)) {
    throw new Error(`Headers JSON not found: ${headersJson}`);
  }

  fs.mkdirSync(outDir, { recursive: true });

  const recordsRoot = JSON.parse(fs.readFileSync(recordsJson, "utf8"));
  const headersRoot = JSON.parse(fs.readFileSync(headersJson, "utf8"));

  const records = recordsRoot.records ?? [];
  const items = headersRoot.items ?? [];

  const headerByFilm = new Map();
  for (const it of items) {
    const film = String(it.digitalFilm ?? "").trim();
    if (!film) continue;
    headerByFilm.set(film, String(it.viewerHeader ?? "").trim());
  }

  const enrichedRecords = records.map((r) => {
    const film = String(r.indexing?.digitalFilm ?? "").trim();
    const viewerHeader = film ? (headerByFilm.get(film) ?? null) : null;
    return {
      ...r,
      viewerHeader,
    };
  });

  let mappedCount = 0;
  for (const r of enrichedRecords) {
    if (r.viewerHeader) mappedCount += 1;
  }

  const people = new Map();

  function upsertPerson(person, role, record) {
    if (!person?.name) return;
    const key = personKey(person);
    if (!people.has(key)) {
      people.set(key, {
        personKey: key,
        primaryName: person.name,
        allNames: new Set(),
        gender: person.gender ?? null,
        personArk: person.personArk ?? null,
        roles: new Set(),
        hitIds: new Set(),
        films: new Set(),
        viewerHeaderFreq: new Map(),
        placeFreq: new Map(),
        sourceCount: 0,
      });
    }

    const agg = people.get(key);
    agg.allNames.add(person.name);
    if (!agg.gender && person.gender) agg.gender = person.gender;
    if (!agg.personArk && person.personArk) agg.personArk = person.personArk;
    agg.roles.add(role || "Unknown");
    agg.sourceCount += 1;

    if (record.hitId) agg.hitIds.add(record.hitId);
    const film = String(record.indexing?.digitalFilm ?? "").trim();
    if (film) agg.films.add(film);
    addFreq(agg.viewerHeaderFreq, record.viewerHeader);
    addFreq(agg.placeFreq, record.indexing?.locality);

    for (const f of person.facts ?? []) {
      addFreq(agg.placeFreq, f.placeOriginal);
      addFreq(agg.placeFreq, f.placeNormalized);
    }
  }

  for (const record of enrichedRecords) {
    upsertPerson(record.principal, record.principal?.role ?? "Principal", record);
    for (const p of record.otherPersons ?? []) {
      upsertPerson(p, p.role ?? "Related", record);
    }
  }

  const peopleOut = [...people.values()]
    .map((p) => {
      const preferredHeader = topValue(p.viewerHeaderFreq);
      const preferredPlace = preferredHeader || topValue(p.placeFreq) || null;
      return {
        personKey: p.personKey,
        primaryName: p.primaryName,
        allNames: [...p.allNames].sort(),
        gender: p.gender,
        personArk: p.personArk,
        roles: [...p.roles].sort(),
        preferredPlace,
        preferredViewerHeader: preferredHeader || null,
        placeCandidates: [...p.placeFreq.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([place, count]) => ({ place, count })),
        viewerHeaderCandidates: [...p.viewerHeaderFreq.entries()]
          .sort((a, b) => b[1] - a[1])
          .map(([viewerHeader, count]) => ({ viewerHeader, count })),
        recordCount: p.hitIds.size,
        filmCount: p.films.size,
        sourceMentions: p.sourceCount,
        hitIds: [...p.hitIds],
      };
    })
    .sort((a, b) => a.primaryName.localeCompare(b.primaryName, "ru"));

  const principalMap = new Map();
  for (const r of enrichedRecords) {
    const p = r.principal;
    if (!p?.name) continue;
    const key = personKey(p);
    if (!principalMap.has(key)) {
      principalMap.set(key, {
        personKey: key,
        primaryName: p.name,
        allNames: new Set(),
        gender: p.gender ?? null,
        personArk: p.personArk ?? null,
        viewerHeaderFreq: new Map(),
        placeFreq: new Map(),
        hitIds: new Set(),
      });
    }
    const agg = principalMap.get(key);
    agg.allNames.add(p.name);
    if (!agg.gender && p.gender) agg.gender = p.gender;
    if (!agg.personArk && p.personArk) agg.personArk = p.personArk;
    if (r.hitId) agg.hitIds.add(r.hitId);
    addFreq(agg.viewerHeaderFreq, r.viewerHeader);
    addFreq(agg.placeFreq, r.indexing?.locality);
    for (const f of p.facts ?? []) {
      addFreq(agg.placeFreq, f.placeOriginal);
      addFreq(agg.placeFreq, f.placeNormalized);
    }
  }

  const principalsOut = [...principalMap.values()]
    .map((p) => {
      const preferredHeader = topValue(p.viewerHeaderFreq);
      const preferredPlace = preferredHeader || topValue(p.placeFreq) || null;
      return {
        personKey: p.personKey,
        primaryName: p.primaryName,
        allNames: [...p.allNames].sort(),
        gender: p.gender,
        personArk: p.personArk,
        preferredPlace,
        preferredViewerHeader: preferredHeader || null,
        placeCandidates: [...p.placeFreq.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([place, count]) => ({ place, count })),
        viewerHeaderCandidates: [...p.viewerHeaderFreq.entries()]
          .sort((a, b) => b[1] - a[1])
          .map(([viewerHeader, count]) => ({ viewerHeader, count })),
        recordCount: p.hitIds.size,
        hitIds: [...p.hitIds],
      };
    })
    .sort((a, b) => a.primaryName.localeCompare(b.primaryName, "ru"));

  // Более «человеческий» дедуп principals: один человек может иметь несколько событий (birth/marriage/death)
  // и несколько записей в выборке. Склеиваем по: principal + (если есть) отец/мать.
  const mergedPrincipals = new Map();
  for (const r of enrichedRecords) {
    if (!r?.principal?.name) continue;
    const key = mergedPrincipalKey(r);
    if (!mergedPrincipals.has(key)) {
      mergedPrincipals.set(key, {
        principalKey: key,
        primaryName: r.principal.name,
        allNames: new Set(),
        gender: r.principal.gender ?? null,
        fatherName: (r.otherPersons ?? []).find((x) => x?.role === "Father")?.name ?? null,
        motherName: (r.otherPersons ?? []).find((x) => x?.role === "Mother")?.name ?? null,
        personArk: r.principal.personArk ?? null,
        hitIds: new Set(),
        films: new Set(),
        viewerHeaderFreq: new Map(),
        placeFreq: new Map(),
        events: [],
      });
    }

    const agg = mergedPrincipals.get(key);
    agg.allNames.add(r.principal.name);
    if (!agg.gender && r.principal.gender) agg.gender = r.principal.gender;
    if (!agg.personArk && r.principal.personArk) agg.personArk = r.principal.personArk;
    if (r.hitId) agg.hitIds.add(r.hitId);
    const film = String(r.indexing?.digitalFilm ?? "").trim();
    if (film) agg.films.add(film);

    addFreq(agg.viewerHeaderFreq, r.viewerHeader);
    addFreq(agg.placeFreq, r.indexing?.locality);

    for (const f of r.principal.facts ?? []) {
      addFreq(agg.placeFreq, f.placeOriginal);
      addFreq(agg.placeFreq, f.placeNormalized);
      agg.events.push({
        type: f.type ?? null,
        dateOriginal: f.dateOriginal ?? null,
        dateFormal: f.dateFormal ?? null,
        placeOriginal: f.placeOriginal ?? null,
        placeNormalized: f.placeNormalized ?? null,
        viewerHeader: r.viewerHeader ?? null,
        digitalFilm: film || null,
        hitId: r.hitId ?? null,
      });
    }
  }

  const mergedPrincipalsOut = [...mergedPrincipals.values()]
    .map((p) => {
      const preferredHeader = topValue(p.viewerHeaderFreq);
      const preferredPlace = preferredHeader || topValue(p.placeFreq) || null;
      const events = uniqBy(
        p.events,
        (e) =>
          `${e.type ?? ""}|${e.dateFormal ?? e.dateOriginal ?? ""}|${e.viewerHeader ?? ""}|${
            e.digitalFilm ?? ""
          }`,
      );
      return {
        principalKey: p.principalKey,
        primaryName: p.primaryName,
        allNames: [...p.allNames].sort(),
        gender: p.gender,
        personArk: p.personArk,
        fatherName: p.fatherName,
        motherName: p.motherName,
        preferredPlace,
        preferredViewerHeader: preferredHeader || null,
        viewerHeaderCandidates: [...p.viewerHeaderFreq.entries()]
          .sort((a, b) => b[1] - a[1])
          .map(([viewerHeader, count]) => ({ viewerHeader, count })),
        recordCount: p.hitIds.size,
        filmCount: p.films.size,
        hitIds: [...p.hitIds],
        events,
      };
    })
    .sort((a, b) => a.primaryName.localeCompare(b.primaryName, "ru"));

  const enrichedOutPath = path.join(outDir, "familysearch-records-with-viewer-header.json");
  const peopleOutPath = path.join(outDir, "familysearch-unique-people-for-map.json");
  const principalsOutPath = path.join(outDir, "familysearch-principals-unique-for-map.json");
  const principalsMergedOutPath = path.join(outDir, "familysearch-principals-merged-for-map.json");

  fs.writeFileSync(
    enrichedOutPath,
    JSON.stringify(
      {
        meta: {
          sourceRecords: path.basename(recordsJson),
          sourceHeaders: path.basename(headersJson),
          recordCount: enrichedRecords.length,
          mappedViewerHeaderCount: mappedCount,
          missingViewerHeaderCount: enrichedRecords.length - mappedCount,
          generatedAt: new Date().toISOString(),
        },
        records: enrichedRecords,
      },
      null,
      2,
    ),
    "utf8",
  );

  fs.writeFileSync(
    peopleOutPath,
    JSON.stringify(
      {
        meta: {
          sourceRecords: path.basename(recordsJson),
          sourceHeaders: path.basename(headersJson),
          uniquePeopleCount: peopleOut.length,
          generatedAt: new Date().toISOString(),
          note: "preferredPlace сначала берется из viewerHeader (по digitalFilm), затем из place* полей.",
        },
        people: peopleOut,
      },
      null,
      2,
    ),
    "utf8",
  );

  fs.writeFileSync(
    principalsOutPath,
    JSON.stringify(
      {
        meta: {
          sourceRecords: path.basename(recordsJson),
          sourceHeaders: path.basename(headersJson),
          uniquePrincipalsCount: principalsOut.length,
          generatedAt: new Date().toISOString(),
          note: "Только principal из каждой записи; useful для первичной карты без родственников.",
        },
        people: principalsOut,
      },
      null,
      2,
    ),
    "utf8",
  );

  fs.writeFileSync(
    principalsMergedOutPath,
    JSON.stringify(
      {
        meta: {
          sourceRecords: path.basename(recordsJson),
          sourceHeaders: path.basename(headersJson),
          uniquePrincipalsMergedCount: mergedPrincipalsOut.length,
          generatedAt: new Date().toISOString(),
          note: "Principals, склеенные по имени+полу+родителям (если есть). Внутри events — набор фактов (Birth/Marriage/Death и т.п.) по всем записям этого человека.",
        },
        people: mergedPrincipalsOut,
      },
      null,
      2,
    ),
    "utf8",
  );

  console.log(`records: ${enrichedRecords.length}`);
  console.log(`records with viewerHeader: ${mappedCount}`);
  console.log(`unique people: ${peopleOut.length}`);
  console.log(`unique principals: ${principalsOut.length}`);
  console.log(`unique principals (merged events): ${mergedPrincipalsOut.length}`);
  console.log(`-> ${enrichedOutPath}`);
  console.log(`-> ${peopleOutPath}`);
  console.log(`-> ${principalsOutPath}`);
  console.log(`-> ${principalsMergedOutPath}`);
}

main();
