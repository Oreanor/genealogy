/**
 * Собирает JSON из ответов FamilySearch (src/data/temp/1.json … 6.json).
 * Только данные для таймлайна / карты / родства; без поисковой и внутренней «шелухи».
 * Запуск: node scripts/flatten-familysearch-temp.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const TEMP_DIR = path.join(ROOT, "src", "data", "temp");
const OUT_FILE = path.join(TEMP_DIR, "familysearch-search-flat.json");

/** Полный URL сайта; пути к записям в JSON — относительные от этого корня. */
const FAMILYSEARCH_BASE_URL = "https://www.familysearch.org";

/**
 * @param {string | null | undefined} absolute
 * @returns {string | null}
 */
function fsPathFromUrl(absolute) {
  if (!absolute || typeof absolute !== "string") return null;
  if (absolute.startsWith(FAMILYSEARCH_BASE_URL)) {
    const rest = absolute.slice(FAMILYSEARCH_BASE_URL.length);
    return rest.startsWith("/") ? rest : `/${rest}`;
  }
  const m = absolute.match(/(\/ark:\/61903\/.+)/);
  if (m) return m[1];
  return absolute;
}

function tailType(uri) {
  if (!uri || typeof uri !== "string") return null;
  const i = uri.lastIndexOf("/");
  return i >= 0 ? uri.slice(i + 1) : uri;
}

function genderFromGedcomx(g) {
  if (!g?.type) return null;
  const t = g.type;
  if (t.includes("Male") && !t.includes("Female")) return "Male";
  if (t.includes("Female")) return "Female";
  return tailType(t);
}

function fullName(person) {
  const forms = person.names?.[0]?.nameForms;
  const ft = forms?.[0]?.fullText;
  if (ft) return ft;
  const parts = forms?.[0]?.parts;
  if (!parts?.length) return null;
  const given = parts.find((p) => p.type?.includes("Given"))?.value;
  const sur = parts.find((p) => p.type?.includes("Surname"))?.value;
  return [given, sur].filter(Boolean).join(" ") || null;
}

function persistentArks(entity) {
  const list = entity?.identifiers?.["http://gedcomx.org/Persistent"];
  return Array.isArray(list) ? [...list] : [];
}

function simplifyFact(f) {
  const row = {
    type: tailType(f.type),
    dateOriginal: f.date?.original ?? null,
    dateFormal: f.date?.formal ?? null,
    placeOriginal: f.place?.original ?? null,
    placeNormalized: f.place?.normalized?.[0]?.value ?? null,
  };
  if (f.primary === true) row.primary = true;
  return row;
}

function simplifyPerson(p) {
  const ageRaw = p.fields
    ?.find((x) => x.type?.includes("/Age"))
    ?.values?.map((v) => v.text)
    .filter(Boolean);
  const ark = persistentArks(p)[0] ?? null;
  const row = {
    name: fullName(p),
    gender: genderFromGedcomx(p.gender),
    role: p.display?.role ?? null,
    personArk: fsPathFromUrl(ark),
    facts: (p.facts ?? []).map(simplifyFact),
  };
  if (ageRaw?.length) row.ageAtEvent = ageRaw;
  return row;
}

function pickBatchLocality(gedcomx) {
  const fields = gedcomx.fields;
  if (!Array.isArray(fields)) return null;
  const v = fields
    .flatMap((f) => f.values ?? [])
    .find((x) => x.labelId === "FS_BATCH_LOCALITY");
  return v?.text ?? null;
}

function pickDigitalFilm(gedcomx) {
  const fields = gedcomx.fields;
  if (!Array.isArray(fields)) return null;
  const v = fields
    .flatMap((f) => f.values ?? [])
    .find((x) => x.labelId === "FS_DIGITAL_FILM_NBR");
  return v?.text ?? null;
}

/** Человекочитаемая ссылка на источник без HTML. */
function firstCitationPlain(sourceDescriptions) {
  for (const sd of sourceDescriptions ?? []) {
    for (const c of sd.citations ?? []) {
      const v = c.value;
      if (typeof v !== "string" || !v.trim()) continue;
      return v
        .replace(/<[^>]*>/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 2500);
    }
  }
  return null;
}

function collectionLabels(sourceDescriptions) {
  const out = [];
  const seen = new Set();
  for (const sd of sourceDescriptions ?? []) {
    if (tailType(sd.resourceType) !== "Collection") continue;
    const ru = (sd.titles ?? []).find((t) => t.lang === "ru")?.value;
    const en = (sd.titles ?? []).find((t) => t.lang === "en")?.value;
    const title = ru || en || (sd.titles ?? [])[0]?.value;
    if (!title) continue;
    const t = sd.coverage?.[0]?.temporal;
    const years = t?.original ?? null;
    const key = `${title}::${years}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const row = { title };
    if (years) row.yearRange = years;
    if (ru && en && ru !== en) row.titleEn = en;
    out.push(row);
  }
  return out.length ? out : null;
}

/**
 * Только публичные ARK (страница записи 1:2 и скан 3:1). Без recapi-дескрипторов — там тот же ark в query.
 */
function collectMedia(sourceDescriptions) {
  const list = [];
  const seen = new Set();

  for (const sd of sourceDescriptions ?? []) {
    const rt = tailType(sd.resourceType);
    if (rt === "Person" || rt === "Collection") continue;

    const kind =
      rt === "DigitalArtifact"
        ? "microfilm"
        : rt === "Record"
          ? "record"
          : "other";

    const push = (href) => {
      const path = fsPathFromUrl(href);
      if (!path || !path.includes("/ark:/61903/") || seen.has(path)) return;
      seen.add(path);
      list.push({ kind, href: path });
    };

    const about = typeof sd.about === "string" ? sd.about : "";
    if (about) push(about);

    for (const u of persistentArks(sd)) {
      push(u);
    }
  }

  return list.length ? list : null;
}

function simplifyRelationships(relationships, personById) {
  if (!Array.isArray(relationships)) return [];
  return relationships.map((r) => {
    const id1 = r.person1?.resourceId ?? r.person1?.resource?.replace(/^#/, "") ?? null;
    const id2 = r.person2?.resourceId ?? r.person2?.resource?.replace(/^#/, "") ?? null;
    return {
      type: tailType(r.type),
      person1Name: id1 ? personById[id1]?.name ?? null : null,
      person2Name: id2 ? personById[id2]?.name ?? null : null,
    };
  });
}

function flattenEntry(entry) {
  const gx = entry.content?.gedcomx;
  if (!gx) {
    return {
      hitId: entry.id ?? null,
      error: "missing content.gedcomx",
    };
  }

  const personsRaw = gx.persons ?? [];
  const personById = Object.fromEntries(personsRaw.map((p) => [p.id, simplifyPerson(p)]));

  const principal = personsRaw.find((p) => p.principal);
  const others = personsRaw.filter((p) => !p.principal).map(simplifyPerson);

  const sourceDescriptions = gx.sourceDescriptions ?? [];

  const row = {
    hitId: entry.id ?? null,
    recordUrl: fsPathFromUrl(gx.links?.self?.href) ?? null,
    principal: principal ? simplifyPerson(principal) : null,
    otherPersons: others.length ? others : null,
    relationships: simplifyRelationships(gx.relationships, personById),
  };

  const loc = pickBatchLocality(gx);
  const film = pickDigitalFilm(gx);
  if (loc || film) {
    row.indexing = {};
    if (loc) row.indexing.locality = loc;
    if (film) row.indexing.digitalFilm = film;
  }

  const cols = collectionLabels(sourceDescriptions);
  if (cols) row.collections = cols;

  const cite = firstCitationPlain(sourceDescriptions);
  if (cite) row.sourceCitation = cite;

  const media = collectMedia(sourceDescriptions);
  if (media) row.media = media;

  return row;
}

function main() {
  const files = [1, 2, 3, 4, 5, 6].map((n) => path.join(TEMP_DIR, `${n}.json`));
  for (const f of files) {
    if (!fs.existsSync(f)) {
      console.error("Нет файла:", f);
      process.exit(1);
    }
  }

  const records = [];
  let expectedResults = null;

  for (const f of files) {
    const raw = JSON.parse(fs.readFileSync(f, "utf8"));
    if (expectedResults == null) expectedResults = raw.results;
    const entries = raw.entries ?? [];
    for (const e of entries) {
      records.push(flattenEntry(e));
    }
  }

  if (expectedResults != null && records.length !== expectedResults) {
    console.warn(
      `Предупреждение: ожидалось results=${expectedResults}, собрано записей=${records.length}`,
    );
  }

  const out = {
    meta: {
      source: "FamilySearch",
      baseUrl: FAMILYSEARCH_BASE_URL,
      recordCount: records.length,
      generatedAt: new Date().toISOString(),
    },
    records,
  };

  fs.writeFileSync(OUT_FILE, JSON.stringify(out, null, 2), "utf8");
  console.log("Записано:", OUT_FILE);
  console.log("Записей:", records.length);
}

main();
