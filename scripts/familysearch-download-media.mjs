/**
 * Скачивание изображений из familysearch-search-flat.json через уже открытый Chrome с CDP.
 *
 * 1) Закрой все окна Chrome.
 * 2) Запусти: chrome.exe --remote-debugging-port=9222
 * 3) Войди в FamilySearch в этом окне.
 * 4) npm run fs-download-media
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import {
  __fsMediaRoot,
  DEFAULT_FS_JSON,
  loadTasksFromJson,
  parseKinds,
  runDownloadLoop,
} from "./fs-media-lib.mjs";

function parseArgs(argv) {
  let jsonPath = DEFAULT_FS_JSON;
  let outDir = path.join(__fsMediaRoot, "public", "photos", "fs-registry");
  let delayMs = 1500;
  const kinds = parseKinds(argv);

  const rest = [...argv];
  while (rest.length) {
    const a = rest.shift();
    if (a === "--json" && rest.length) jsonPath = path.resolve(rest.shift());
    else if (a === "--out" && rest.length) outDir = path.resolve(rest.shift());
    else if (a === "--delay-ms" && rest.length) delayMs = Number(rest.shift()) || 1500;
    else if (a === "--kinds" && rest.length) rest.shift();
  }

  return { jsonPath, outDir, delayMs, kinds };
}

async function main() {
  const { jsonPath, outDir, delayMs, kinds } = parseArgs(process.argv.slice(2));

  if (!fs.existsSync(jsonPath)) {
    console.error(`Нет файла: ${jsonPath}`);
    process.exit(1);
  }

  const { records, tasks } = loadTasksFromJson(jsonPath, kinds);
  console.log(`Записей: ${records.length}`);
  console.log(`Уникальных media (kinds=${[...kinds].join(",")}): ${tasks.length}`);
  console.log(`Выход: ${outDir}`);
  console.log(`CDP: http://127.0.0.1:9222\n`);

  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0] ?? (await browser.newContext());

  const { ok, fail } = await runDownloadLoop(ctx, tasks, outDir, delayMs);

  await browser.close();

  console.log(`\nГотово. ok=${ok} fail=${fail}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
