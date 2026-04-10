/**
 * Интерактивная HTML-таблица: ссылки (новая вкладка) + столбец для вставки заголовка
 * с просмотрщика FamilySearch; кнопка «Скопировать JSON».
 *
 * По умолчанию — одна строка на уникальный digitalFilm (~192), чтобы сопоставить со всеми
 * записями по полю indexing.digitalFilm в familysearch-search-flat.json.
 *
 * npm run fs-export-header-table
 * npm run fs-export-header-table -- --by-url   (режим: уникальный URL записи, как раньше)
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {
  __fsMediaRoot,
  DEFAULT_FS_JSON,
  loadTasksFromJson,
  parseKinds,
  toAbsoluteFsHref,
} from "./fs-media-lib.mjs";

const DEFAULT_DIR = path.join(__fsMediaRoot, "src", "data", "temp");

function parseArgs(argv) {
  let jsonPath = DEFAULT_FS_JSON;
  let outDir = DEFAULT_DIR;
  let byUrl = false;
  const kinds = parseKinds(argv);
  const rest = [...argv];
  while (rest.length) {
    const a = rest.shift();
    if (a === "--json" && rest.length) jsonPath = path.resolve(rest.shift());
    else if (a === "--out-dir" && rest.length) outDir = path.resolve(rest.shift());
    else if (a === "--by-url") byUrl = true;
    else if (a === "--kinds" && rest.length) rest.shift();
  }
  return { jsonPath, outDir, kinds, byUrl };
}

function escHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function firstMediaHref(record, kind) {
  const m = (record.media ?? []).find((x) => x.kind === kind && x.href);
  return m ? toAbsoluteFsHref(m.href) : "";
}

function buildFilmRows(records) {
  const byFilm = new Map();
  for (const r of records) {
    const film = r.indexing?.digitalFilm?.trim();
    if (!film) continue;
    if (!byFilm.has(film)) byFilm.set(film, []);
    byFilm.get(film).push(r);
  }

  const rows = [];
  for (const [digitalFilm, list] of [...byFilm.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const sample = list[0];
    const url =
      firstMediaHref(sample, "record") ||
      firstMediaHref(sample, "microfilm") ||
      toAbsoluteFsHref(sample.recordUrl) ||
      "";
    rows.push({
      key: digitalFilm,
      digitalFilm,
      recordCount: list.length,
      sampleHitId: sample.hitId ?? "",
      url,
    });
  }
  return rows;
}

function buildHtml(seed, meta) {
  const seedJson = JSON.stringify(seed);
  const dataId = crypto.createHash("sha256").update(seedJson).digest("hex").slice(0, 24);
  const isFilm = seed.mode === "byDigitalFilm";

  const thead = isFilm
    ? `<tr>
          <th class="num">#</th>
          <th>digitalFilm</th>
          <th class="cnt">Записей</th>
          <th>sample hitId</th>
          <th>Ссылка</th>
          <th>Заголовок с сайта</th>
        </tr>`
    : `<tr>
          <th class="num">#</th>
          <th>hitId</th>
          <th>Ссылка</th>
          <th>Заголовок с сайта</th>
        </tr>`;

  const metaLine = isFilm
    ? `Режим: <strong>по плёнке (digitalFilm)</strong> — <strong>${seed.rows.length}</strong> уникальных сегментов из <strong>${meta.recordCount}</strong> записей в источнике. Сопоставление: у каждой записи в JSON есть <code>indexing.digitalFilm</code> — совпадает с колонкой digitalFilm; заголовок из JSON экспорта копируешь на все такие записи.`
    : `Режим: <strong>по уникальному URL</strong> записи — <strong>${seed.rows.length}</strong> строк.`;

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>FamilySearch — заголовки (${seed.rows.length})</title>
  <style>
    :root { font-family: system-ui, sans-serif; }
    body { margin: 0; padding: 1rem 1.25rem 3rem; max-width: 80rem; margin-inline: auto; }
    h1 { font-size: 1.15rem; font-weight: 600; margin: 0 0 0.5rem; }
    .meta { color: #555; font-size: 0.85rem; margin-bottom: 1rem; line-height: 1.45; }
    .toolbar { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; margin-bottom: 1rem; }
    button {
      font: inherit; padding: 0.45rem 0.85rem; border-radius: 8px; border: 1px solid #333;
      background: #111; color: #fff; cursor: pointer;
    }
    button:hover { background: #333; }
    button.secondary { background: #fff; color: #111; }
    #status { font-size: 0.85rem; min-height: 1.2em; color: #0a0; }
    .wrap { overflow-x: auto; border: 1px solid #ddd; border-radius: 8px; }
    table { border-collapse: collapse; width: 100%; font-size: 0.85rem; }
    th, td { border-bottom: 1px solid #e8e8e8; padding: 0.4rem 0.5rem; vertical-align: top; text-align: left; }
    th { background: #f6f6f6; position: sticky; top: 0; z-index: 1; }
    th.num, td.num { width: 2.25rem; text-align: right; color: #666; }
    th.cnt, td.cnt { width: 4rem; text-align: right; color: #444; }
    td.film code { font-size: 0.78em; word-break: break-all; }
    td.link a { word-break: break-all; color: #0645ad; }
    input.header-field {
      width: 100%; min-width: 10rem; box-sizing: border-box; font: inherit; padding: 0.35rem 0.45rem;
      border: 1px solid #ccc; border-radius: 6px;
    }
    tr:hover td { background: #fafafa; }
  </style>
</head>
<body data-capture-id="${dataId}">
  <h1>Съём заголовков FamilySearch</h1>
  <p class="meta">Источник: <code>${escHtml(meta.sourceJson)}</code> · ${metaLine}<br />
  Сгенерировано: ${escHtml(meta.generatedAt)}. Клик по ссылке — новая вкладка. Черновик в localStorage (при другом наборе строк пересобери HTML).</p>
  <div class="toolbar">
    <button type="button" id="btn-copy">Скопировать JSON в буфер</button>
    <button type="button" id="btn-download" class="secondary">Скачать .json</button>
    <span id="status"></span>
  </div>
  <div class="wrap">
    <table>
      <thead>${thead}</thead>
      <tbody id="tbody"></tbody>
    </table>
  </div>
  <script type="application/json" id="fs-seed">${seedJson.replace(/</g, "\\u003c")}</script>
  <script>
(function () {
  var SEED = JSON.parse(document.getElementById("fs-seed").textContent);
  var MODE = SEED.mode;
  var ROWS = SEED.rows;
  var SOURCE_RECORD_COUNT = SEED.sourceRecordCount;
  var captureId = document.body.getAttribute("data-capture-id");
  var LS_KEY = "genealogy-fs-header-capture:" + captureId;

  function loadSaved() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (!raw) return {};
      var o = JSON.parse(raw);
      return o && typeof o === "object" ? o.headersByKey || {} : {};
    } catch (e) { return {}; }
  }

  function save(headersByKey) {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ headersByKey: headersByKey, updatedAt: new Date().toISOString() }));
    } catch (e) { /* quota */ }
  }

  var headersByKey = loadSaved();
  var tbody = document.getElementById("tbody");
  var debounceTimer;

  function scheduleSave() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
      var map = {};
      tbody.querySelectorAll("tr[data-key]").forEach(function (tr) {
        var k = tr.getAttribute("data-key");
        var inp = tr.querySelector(".header-field");
        map[k] = inp ? inp.value : "";
      });
      headersByKey = map;
      save(headersByKey);
    }, 300);
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function escapeAttr(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;");
  }

  ROWS.forEach(function (row, i) {
    var tr = document.createElement("tr");
    tr.setAttribute("data-key", row.key);
    var h = headersByKey[row.key] || "";
    if (MODE === "byDigitalFilm") {
      tr.innerHTML =
        '<td class="num">' + (i + 1) + '</td>' +
        '<td class="film"><code>' + escapeHtml(row.digitalFilm) + '</code></td>' +
        '<td class="cnt">' + row.recordCount + '</td>' +
        '<td><code style="font-size:0.8em">' + escapeHtml(row.sampleHitId) + '</code></td>' +
        '<td class="link"><a href="' + escapeAttr(row.url) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(row.url) + '</a></td>' +
        '<td><input type="text" class="header-field" value="' + escapeAttr(h) + '" autocomplete="off" spellcheck="false" /></td>';
    } else {
      tr.innerHTML =
        '<td class="num">' + (i + 1) + '</td>' +
        '<td><code style="font-size:0.8em">' + escapeHtml(row.hitId) + '</code></td>' +
        '<td class="link"><a href="' + escapeAttr(row.url) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(row.url) + '</a></td>' +
        '<td><input type="text" class="header-field" value="' + escapeAttr(h) + '" autocomplete="off" spellcheck="false" /></td>';
    }
    tbody.appendChild(tr);
  });

  tbody.addEventListener("input", scheduleSave);

  function collectPayload() {
    var trs = tbody.querySelectorAll("tr[data-key]");
    if (MODE === "byDigitalFilm") {
      var items = ROWS.map(function (row, i) {
        var tr = trs[i];
        var inp = tr && tr.querySelector(".header-field");
        var header = inp ? inp.value.trim() : "";
        return {
          digitalFilm: row.digitalFilm,
          recordCount: row.recordCount,
          sampleHitId: row.sampleHitId,
          url: row.url,
          viewerHeader: header
        };
      });
      return {
        exportedAt: new Date().toISOString(),
        mode: "byDigitalFilm",
        joinHint: "Для каждой записи в familysearch-search-flat.json: возьми record.indexing.digitalFilm и найди item с тем же digitalFilm — поле viewerHeader относится ко всем таким записям (их число = recordCount).",
        sourceRecordCount: SOURCE_RECORD_COUNT,
        filmRowCount: items.length,
        items: items
      };
    }
    var itemsUrl = ROWS.map(function (row, i) {
      var tr = trs[i];
      var inp = tr && tr.querySelector(".header-field");
      var header = inp ? inp.value.trim() : "";
      return { hitId: row.hitId, url: row.url, viewerHeader: header };
    });
    return {
      exportedAt: new Date().toISOString(),
      mode: "byRecordUrl",
      sourceRecordCount: SOURCE_RECORD_COUNT,
      rowCount: itemsUrl.length,
      items: itemsUrl
    };
  }

  function setStatus(msg, ok) {
    var el = document.getElementById("status");
    el.textContent = msg;
    el.style.color = ok ? "#070" : "#a00";
  }

  document.getElementById("btn-copy").addEventListener("click", function () {
    var data = collectPayload();
    var text = JSON.stringify(data, null, 2);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        setStatus("Скопировано в буфер (" + data.items.length + " элементов).", true);
      }).catch(function () {
        fallbackDownload(text);
        setStatus("Буфер недоступен — скачан файл.", false);
      });
    } else {
      fallbackDownload(text);
      setStatus("Скачан файл (clipboard недоступен).", false);
    }
  });

  document.getElementById("btn-download").addEventListener("click", function () {
    var text = JSON.stringify(collectPayload(), null, 2);
    fallbackDownload(text);
    setStatus("Файл скачан.", true);
  });

  function fallbackDownload(text) {
    var blob = new Blob([text], { type: "application/json;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "familysearch-viewer-headers.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }
})();
  </script>
</body>
</html>
`;
}

function main() {
  const { jsonPath, outDir, kinds, byUrl } = parseArgs(process.argv.slice(2));

  if (!fs.existsSync(jsonPath)) {
    console.error(`Нет файла: ${jsonPath}`);
    process.exit(1);
  }

  fs.mkdirSync(outDir, { recursive: true });

  const raw = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const records = raw.records ?? [];

  let seed;
  if (byUrl) {
    const { tasks } = loadTasksFromJson(jsonPath, kinds);
    const rows = tasks.map(([url, { hitId }]) => ({ key: url, hitId, url }));
    seed = {
      mode: "byRecordUrl",
      sourceRecordCount: records.length,
      rows,
    };
  } else {
    const rows = buildFilmRows(records);
    seed = {
      mode: "byDigitalFilm",
      sourceRecordCount: records.length,
      rows,
    };
  }

  const meta = {
    sourceJson: path.basename(jsonPath),
    recordCount: records.length,
    generatedAt: new Date().toISOString(),
  };

  const html = buildHtml(seed, meta);
  const outPath = path.join(outDir, "familysearch-header-capture.html");
  fs.writeFileSync(outPath, html, "utf8");

  console.log(`Записей в источнике: ${records.length}`);
  if (byUrl) {
    console.log(`Строк в таблице (уникальных URL): ${seed.rows.length}`);
  } else {
    console.log(`Строк в таблице (уникальных digitalFilm): ${seed.rows.length}`);
    console.log(`Сопоставление со всеми записями: поле indexing.digitalFilm в JSON = digitalFilm в экспорте.`);
  }
  console.log(`→ ${outPath}`);
}

main();
