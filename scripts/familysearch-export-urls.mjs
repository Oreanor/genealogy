/**
 * Выгрузка полных URL записей FamilySearch из familysearch-search-flat.json
 * для ручного открытия в браузере (без автоматизации).
 *
 * npm run fs-export-urls
 *
 * Создаёт в src/data/temp/:
 *   familysearch-record-urls.txt  — по одной ссылке на строку
 *   familysearch-record-urls.tsv  — hitId<TAB>url (удобно для имён файлов)
 *   familysearch-record-urls.html — страница со списком ссылок (опционально: --no-html)
 */
import fs from "node:fs";
import path from "node:path";
import {
  __fsMediaRoot,
  DEFAULT_FS_JSON,
  loadTasksFromJson,
  parseKinds,
} from "./fs-media-lib.mjs";

const DEFAULT_DIR = path.join(__fsMediaRoot, "src", "data", "temp");

function parseArgs(argv) {
  let jsonPath = DEFAULT_FS_JSON;
  let outDir = DEFAULT_DIR;
  let baseName = "familysearch-record-urls";
  let html = true;
  const kinds = parseKinds(argv);

  const rest = [...argv];
  while (rest.length) {
    const a = rest.shift();
    if (a === "--json" && rest.length) jsonPath = path.resolve(rest.shift());
    else if (a === "--out-dir" && rest.length) outDir = path.resolve(rest.shift());
    else if (a === "--name" && rest.length) baseName = rest.shift().replace(/\.[^/.]+$/, "");
    else if (a === "--no-html") html = false;
    else if (a === "--kinds" && rest.length) rest.shift();
  }

  return { jsonPath, outDir, baseName, html, kinds };
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function main() {
  const { jsonPath, outDir, baseName, html, kinds } = parseArgs(process.argv.slice(2));

  if (!fs.existsSync(jsonPath)) {
    console.error(`Нет файла: ${jsonPath}`);
    process.exit(1);
  }

  fs.mkdirSync(outDir, { recursive: true });

  const { records, tasks } = loadTasksFromJson(jsonPath, kinds);
  const linesTxt = [];
  const linesTsv = [];
  const rowsHtml = [];

  let n = 0;
  for (const [absUrl, { hitId, href }] of tasks) {
    n += 1;
    linesTxt.push(absUrl);
    linesTsv.push(`${hitId}\t${absUrl}`);
    rowsHtml.push(
      `<li value="${n}"><code>${escapeHtml(hitId)}</code> — <a href="${escapeHtml(absUrl)}" target="_blank" rel="noopener">${escapeHtml(absUrl)}</a></li>`,
    );
  }

  const pTxt = path.join(outDir, `${baseName}.txt`);
  const pTsv = path.join(outDir, `${baseName}.tsv`);
  const pHtml = path.join(outDir, `${baseName}.html`);

  fs.writeFileSync(pTxt, linesTxt.join("\n") + (linesTxt.length ? "\n" : ""), "utf8");
  fs.writeFileSync(pTsv, linesTsv.join("\n") + (linesTsv.length ? "\n" : ""), "utf8");

  if (html) {
    const doc = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>FamilySearch — ${tasks.length} ссылок</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 56rem; margin: 1rem auto; padding: 0 1rem; }
    ol { padding-left: 1.25rem; }
    li { margin: 0.5rem 0; word-break: break-all; }
    code { font-size: 0.85em; background: #f4f4f4; padding: 0.1em 0.35em; border-radius: 4px; }
  </style>
</head>
<body>
  <p>Записей в JSON: ${records.length}. Уникальных ссылок (kinds=${[...kinds].join(",")}): <strong>${tasks.length}</strong></p>
  <ol>
${rowsHtml.join("\n")}
  </ol>
</body>
</html>
`;
    fs.writeFileSync(pHtml, doc, "utf8");
  }

  console.log(`Записей в JSON: ${records.length}`);
  console.log(`Уникальных URL: ${tasks.length}`);
  console.log(`→ ${pTxt}`);
  console.log(`→ ${pTsv}`);
  if (html) console.log(`→ ${pHtml}`);
}

main();
