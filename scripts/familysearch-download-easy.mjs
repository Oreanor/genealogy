/**
 * Проще, чем CDP: скрипт сам открывает браузер с отдельным профилем (логин сохраняется).
 *
 * 1) npm run fs-download-easy
 * 2) Войди в FamilySearch в открывшемся окне.
 * 3) Нажми Enter в терминале — начнётся скачивание.
 *
 * Профиль: playwright-fs-profile/ (в .gitignore). Повторные запуски часто без повторного логина.
 */
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { chromium } from "playwright";
import {
  __fsMediaRoot,
  DEFAULT_FS_JSON,
  loadTasksFromJson,
  parseKinds,
  runDownloadLoop,
} from "./fs-media-lib.mjs";

const PROFILE_DIR = path.join(__fsMediaRoot, "playwright-fs-profile");

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

function waitEnter() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question("", () => {
      rl.close();
      resolve();
    });
  });
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
  console.log(`Выход: ${outDir}\n`);

  fs.mkdirSync(PROFILE_DIR, { recursive: true });

  let context;
  try {
    context = await chromium.launchPersistentContext(PROFILE_DIR, {
      channel: "chrome",
      headless: false,
      viewport: { width: 1280, height: 800 },
    });
  } catch {
    console.log(
      "Chrome не найден — используем Chromium из Playwright (при ошибке: npx playwright install chromium)\n",
    );
    context = await chromium.launchPersistentContext(PROFILE_DIR, {
      headless: false,
      viewport: { width: 1280, height: 800 },
    });
  }

  const page = context.pages()[0] ?? (await context.newPage());
  await page.goto("https://www.familysearch.org/", { timeout: 120000 });

  console.log(">>> Войди в аккаунт FamilySearch в открытом окне, затем нажми Enter здесь...\n");
  await waitEnter();

  const { ok, fail } = await runDownloadLoop(context, tasks, outDir, delayMs);

  await context.close();

  console.log(`\nГотово. ok=${ok} fail=${fail}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
