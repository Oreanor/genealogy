/**
 * Сборка плоского search-flat + indexed events из выгрузок FamilySearch «personas»
 * (docs/fs_kanivets2/*.json или fs_kanivets2.zip с теми же N.json внутри: entries[].content.gedcomx).
 *
 * npm run fs-kanivets-build
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const __root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const KANIVETS_DIR = path.join(__root, "docs", "fs_kanivets2");
const SEARCH_FLAT_OUT = path.join(KANIVETS_DIR, "kanivets-search-flat.json");
const INDEXED_OUT = path.join(__root, "src", "lib", "data", "kanivetsIndexedEvents.json");
const PERSONS_OUT = path.join(__root, "src", "lib", "data", "kanivetsFamilysearchPersons.json");
const EXPORT_SCRIPT = path.join(__root, "scripts", "familysearch-export-persons.mjs");

const FACT_URI_TO_SHORT = {
  "http://gedcomx.org/Birth": "Birth",
  "http://gedcomx.org/Death": "Death",
  "http://gedcomx.org/Marriage": "Marriage",
  "http://gedcomx.org/Burial": "Burial",
  "http://gedcomx.org/Christening": "Christening",
  "http://gedcomx.org/Baptism": "Christening",
};

function normArkKey(ark) {
  const s = String(ark ?? "").trim();
  const m = s.match(/1:1:([A-Z0-9-]+)/i);
  return m ? m[1].toUpperCase() : "";
}

function persistentArk(person) {
  const ids = person?.identifiers?.["http://gedcomx.org/Persistent"];
  if (!Array.isArray(ids) || ids.length === 0) return "";
  return normArkKey(ids[0]) ? String(ids[0]).trim() : "";
}

function gedcomGenderToLabel(person) {
  const t = person?.gender?.type;
  if (t === "http://gedcomx.org/Male") return "Male";
  if (t === "http://gedcomx.org/Female") return "Female";
  return undefined;
}

function personDisplayName(person) {
  const d = person?.display?.name?.trim();
  if (d) return d;
  const forms = person?.names?.[0]?.nameForms;
  const ft = forms?.[0]?.fullText?.trim();
  return ft || "";
}

function mapFactForRecord(fact) {
  const uri = fact?.type;
  const short = FACT_URI_TO_SHORT[uri];
  if (!short) return null;
  const norm = fact?.place?.normalized;
  const placeNormalized = Array.isArray(norm) && norm[0]?.value ? String(norm[0].value) : undefined;
  return {
    type: short,
    dateOriginal: fact?.date?.original ? String(fact.date.original) : undefined,
    dateFormal: fact?.date?.formal ? String(fact.date.formal) : undefined,
    placeOriginal: fact?.place?.original ? String(fact.place.original) : undefined,
    placeNormalized,
    primary: fact?.primary === true,
  };
}

function yearFromGedcomFact(fact) {
  const formal = fact?.date?.formal;
  if (formal) {
    const m = String(formal).match(/(\d{3,4})/);
    if (m) return Number(m[1]);
  }
  const orig = fact?.date?.original;
  if (orig) {
    const m2 = String(orig).match(/\b(1[0-9]{3}|20[0-9]{2})\b/);
    if (m2) return Number(m2[1]);
  }
  return null;
}

function extractZipToDir(zipPath, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  execFileSync("tar", ["-xf", zipPath, "-C", destDir], { stdio: "inherit" });
}

/** Каталог, где лежат 1.json, 2.json, … (учитывает вложенность после распаковки zip). */
function findNumberedJsonDirectory(root) {
  const names = fs.readdirSync(root);
  if (names.some((n) => /^\d+\.json$/i.test(n))) return root;
  for (const n of names) {
    const p = path.join(root, n);
    if (fs.statSync(p).isDirectory()) {
      const found = findNumberedJsonDirectory(p);
      if (found) return found;
    }
  }
  return null;
}

/**
 * @returns {{ files: string[], cleanup: (() => void) | null, metaFiles: string[] }}
 */
function resolveKanivetsSourceFiles() {
  const zipPath = path.join(KANIVETS_DIR, "fs_kanivets2.zip");
  const names = fs.existsSync(KANIVETS_DIR) ? fs.readdirSync(KANIVETS_DIR) : [];
  const loose = names
    .filter((n) => /^\d+\.json$/i.test(n))
    .sort((a, b) => Number(path.basename(a, ".json")) - Number(path.basename(b, ".json")));

  if (loose.length > 0) {
    const files = loose.map((n) => path.join(KANIVETS_DIR, n));
    return {
      files,
      cleanup: null,
      metaFiles: files.map((f) => path.relative(__root, f).replace(/\\/g, "/")),
    };
  }

  if (!fs.existsSync(zipPath)) {
    throw new Error(`Нет файлов N.json в ${KANIVETS_DIR} и нет архива ${zipPath}`);
  }

  const tmpRoot = fs.mkdtempSync(path.join(tmpdir(), "fs-kanivets2-"));
  try {
    extractZipToDir(zipPath, tmpRoot);
  } catch (e) {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
    throw e;
  }

  const workDir = findNumberedJsonDirectory(tmpRoot);
  if (!workDir) {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
    throw new Error(`В ${zipPath} не найдены файлы N.json`);
  }

  const inner = fs
    .readdirSync(workDir)
    .filter((n) => /^\d+\.json$/i.test(n))
    .sort((a, b) => Number(path.basename(a, ".json")) - Number(path.basename(b, ".json")));
  const files = inner.map((n) => path.join(workDir, n));
  const archiveRel = path.relative(__root, zipPath).replace(/\\/g, "/");

  return {
    files,
    cleanup: () => fs.rmSync(tmpRoot, { recursive: true, force: true }),
    metaFiles: [archiveRel],
  };
}

function processGedcomEntry(gx, sourceFile) {
  const persons = gx?.persons;
  if (!Array.isArray(persons)) return { record: null, indexed: [] };

  const principal = persons.find((p) => p.principal === true);
  if (!principal) return { record: null, indexed: [] };

  const principalArkUrl = persistentArk(principal);
  const hitId = normArkKey(principalArkUrl);
  if (!hitId) return { record: null, indexed: [] };

  const recordUrl = `/ark:/61903/1:1:${hitId}`;
  const principalName = personDisplayName(principal);
  const role = principal?.display?.role?.trim() || "Principal";

  const factObjs = (principal.facts ?? [])
    .map(mapFactForRecord)
    .filter(Boolean);

  const otherPersons = [];
  for (const p of persons) {
    if (p.principal) continue;
    const url = persistentArk(p);
    const pk = normArkKey(url);
    if (!pk) continue;
    const name = personDisplayName(p);
    if (!name) continue;
    const r = (p.display?.role ?? "").trim() || "Other";
    otherPersons.push({
      personArk: url,
      name,
      gender: gedcomGenderToLabel(p),
      role: r,
    });
  }

  const record = {
    hitId,
    recordUrl,
    principal: {
      personArk: principalArkUrl,
      name: principalName,
      gender: gedcomGenderToLabel(principal),
      role,
      facts: factObjs,
    },
    otherPersons,
  };

  const indexed = [];
  for (const f of principal.facts ?? []) {
    const uri = f?.type;
    const short = FACT_URI_TO_SHORT[uri];
    if (!short) continue;
    const y = yearFromGedcomFact(f);
    if (y == null || !Number.isFinite(y)) continue;
    const placeOriginal = f?.place?.original ? String(f.place.original) : "";
    const norm = f?.place?.normalized;
    const placeKey =
      Array.isArray(norm) && norm[0]?.value ? String(norm[0].value) : placeOriginal || "";
    const dateOriginal = f?.date?.original ? String(f.date.original) : null;
    indexed.push({
      hitId,
      recordUrl,
      principalName,
      factType: short,
      placeLabel: placeOriginal || placeKey,
      placeKey,
      year: y,
      dateOriginal,
    });
  }

  return { record, indexed };
}

function main() {
  let cleanup = null;
  let files = [];
  let metaFiles = [];
  try {
    const resolved = resolveKanivetsSourceFiles();
    files = resolved.files;
    metaFiles = resolved.metaFiles;
    cleanup = resolved.cleanup;
  } catch (e) {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  }

  if (files.length === 0) {
    console.error(`Нет файлов N.json в ${KANIVETS_DIR}`);
    if (cleanup) cleanup();
    process.exit(1);
  }

  const records = [];
  const indexedEvents = [];
  const seenHit = new Set();

  try {
  for (const fp of files) {
    const raw = JSON.parse(fs.readFileSync(fp, "utf8"));
    const entries = raw.entries ?? [];
    for (const ent of entries) {
      const gx = ent?.content?.gedcomx;
      if (!gx) continue;
      const { record, indexed } = processGedcomEntry(gx, path.basename(fp));
      if (!record) continue;
      if (seenHit.has(record.hitId)) continue;
      seenHit.add(record.hitId);
      records.push(record);
      indexedEvents.push(...indexed);
    }
  }

  const searchFlatDoc = {
    meta: {
      kind: "search-flat",
      source: "gedcomx-personas",
      kanivetsSourceFiles: metaFiles,
      recordCount: records.length,
      generatedAt: new Date().toISOString(),
    },
    records,
  };

  fs.mkdirSync(path.dirname(SEARCH_FLAT_OUT), { recursive: true });
  fs.writeFileSync(SEARCH_FLAT_OUT, JSON.stringify(searchFlatDoc, null, 2) + "\n", "utf8");
  console.log(`search-flat: ${records.length} записей -> ${SEARCH_FLAT_OUT}`);

  const indexedDoc = {
    meta: {
      source: "kanivets gedcomx-personas",
      eventCount: indexedEvents.length,
      note: "Без precisePlace; на карте — приближённые координаты (mapPlaceGeoOverlays.json «extended» + placeFallbacks).",
      generatedAt: new Date().toISOString(),
    },
    events: indexedEvents,
  };
  fs.mkdirSync(path.dirname(INDEXED_OUT), { recursive: true });
  fs.writeFileSync(INDEXED_OUT, JSON.stringify(indexedDoc, null, 2) + "\n", "utf8");
  console.log(`indexed events: ${indexedEvents.length} -> ${INDEXED_OUT}`);

  execFileSync(
    process.execPath,
    [
      EXPORT_SCRIPT,
      "--json",
      SEARCH_FLAT_OUT,
      "--out-persons",
      PERSONS_OUT,
      "--indexed-events",
      INDEXED_OUT,
    ],
    { stdio: "inherit", cwd: __root },
  );
  } finally {
    if (cleanup) cleanup();
  }
}

main();
