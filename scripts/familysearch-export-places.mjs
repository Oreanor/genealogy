/**
 * Выгрузка «мест» и метаданных из familysearch-search-flat.json без браузера.
 *
 * Важно: подпись в шапке просмотрщика (напр. «Томашівка» + тип книги) часто НЕ дублируется
 * в JSON — там может быть только область/губерния из индекса. Точная строка прихода
 * привязана к съёмке; её можно собрать только с сайта (вручную или Playwright у себя).
 *
 * npm run fs-export-places
 * npm run fs-export-places -- --films-only
 */
import fs from "node:fs";
import path from "node:path";
import {
  __fsMediaRoot,
  DEFAULT_FS_JSON,
  toAbsoluteFsHref,
} from "./fs-media-lib.mjs";

const DEFAULT_DIR = path.join(__fsMediaRoot, "src", "data", "temp");

function parseArgs(argv) {
  let jsonPath = DEFAULT_FS_JSON;
  let outDir = DEFAULT_DIR;
  let filmsOnly = false;

  const rest = [...argv];
  while (rest.length) {
    const a = rest.shift();
    if (a === "--json" && rest.length) jsonPath = path.resolve(rest.shift());
    else if (a === "--out-dir" && rest.length) outDir = path.resolve(rest.shift());
    else if (a === "--films-only") filmsOnly = true;
  }

  return { jsonPath, outDir, filmsOnly };
}

function escCell(s) {
  if (s == null) return "";
  const t = String(s);
  if (/[\t\n\r"]/.test(t)) return `"${t.replace(/"/g, '""')}"`;
  return t;
}

function pickBirthPlace(principal) {
  const facts = principal?.facts ?? [];
  const birth = facts.find((f) => f.type === "Birth" && f.primary);
  const fb = birth ?? facts.find((f) => f.type === "Birth");
  return {
    birthPlaceOriginal: fb?.placeOriginal ?? "",
    birthPlaceNormalized: fb?.placeNormalized ?? "",
  };
}

function firstMediaHref(record, kind) {
  const m = (record.media ?? []).find((x) => x.kind === kind && x.href);
  return m ? toAbsoluteFsHref(m.href) : "";
}

function main() {
  const { jsonPath, outDir, filmsOnly } = parseArgs(process.argv.slice(2));

  if (!fs.existsSync(jsonPath)) {
    console.error(`Нет файла: ${jsonPath}`);
    process.exit(1);
  }

  fs.mkdirSync(outDir, { recursive: true });

  const raw = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const records = raw.records ?? [];

  if (filmsOnly) {
    /** @type {Map<string, { count: number, sample: object }>} */
    const byFilm = new Map();
    for (const r of records) {
      const film = r.indexing?.digitalFilm?.trim();
      if (!film) continue;
      const cur = byFilm.get(film);
      if (!cur) {
        byFilm.set(film, { count: 1, sample: r });
      } else {
        cur.count += 1;
      }
    }

    const rows = [
      [
        "digitalFilm",
        "recordCount",
        "collectionTitle",
        "sampleHitId",
        "sampleRecordMediaUrl",
        "sampleMicrofilmUrl",
      ].join("\t"),
    ];

    for (const [film, { count, sample }] of [...byFilm.entries()].sort((a, b) =>
      a[0].localeCompare(b[0]),
    )) {
      const col = sample.collections?.[0];
      rows.push(
        [
          escCell(film),
          count,
          escCell(col?.title ?? ""),
          escCell(sample.hitId ?? ""),
          escCell(firstMediaHref(sample, "record")),
          escCell(firstMediaHref(sample, "microfilm")),
        ].join("\t"),
      );
    }

    const p = path.join(outDir, "familysearch-films-unique.tsv");
    fs.writeFileSync(p, rows.join("\n") + "\n", "utf8");
    console.log(`Уникальных digitalFilm: ${byFilm.size} (из ${records.length} записей)`);
    console.log(`→ ${p}`);
    console.log(
      "\nОткрой sampleRecordMediaUrl или sampleMicrofilmUrl по одному на строку плёнки — в шапке будет приход/описание книги; потом можно сопоставить всем hitId с той же digitalFilm.",
    );
    return;
  }

  const header = [
    "hitId",
    "principalName",
    "recordUrl",
    "recordMediaUrl",
    "microfilmUrl",
    "birthPlaceOriginal",
    "birthPlaceNormalized",
    "collectionTitle",
    "collectionYearRange",
    "indexingLocality",
    "digitalFilm",
  ];

  const rows = [header.join("\t")];

  for (const r of records) {
    const col = r.collections?.[0];
    const bp = pickBirthPlace(r.principal);
    rows.push(
      [
        escCell(r.hitId ?? ""),
        escCell(r.principal?.name ?? ""),
        escCell(toAbsoluteFsHref(r.recordUrl)),
        escCell(firstMediaHref(r, "record")),
        escCell(firstMediaHref(r, "microfilm")),
        escCell(bp.birthPlaceOriginal),
        escCell(bp.birthPlaceNormalized),
        escCell(col?.title ?? ""),
        escCell(col?.yearRange ?? ""),
        escCell(r.indexing?.locality ?? ""),
        escCell(r.indexing?.digitalFilm ?? ""),
      ].join("\t"),
    );
  }

  const p = path.join(outDir, "familysearch-record-places.tsv");
  fs.writeFileSync(p, rows.join("\n") + "\n", "utf8");
  console.log(`Записей: ${records.length}`);
  console.log(`→ ${p}`);
}

main();
