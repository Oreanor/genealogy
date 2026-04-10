/**
 * Скачивает картинки по списку URL в папку на диск.
 *
 * Использование:
 *   node scripts/download-images.mjs path/to/urls.json
 *   node scripts/download-images.mjs path/to/urls.json --out public/photos/related
 *   node scripts/download-images.mjs path/to/urls.json --delay 400
 *
 * Переменные окружения (опционально):
 *   DOWNLOAD_COOKIE  — строка Cookie для запросов (например после входа на сайт в браузере).
 *                      Скопировать из DevTools → Network → заголовок Cookie у запроса к картинке.
 *
 * Формат JSON (любой из вариантов):
 *   [ "https://example.com/a.jpg", "https://example.com/b.png" ]
 *   { "items": [ { "url": "https://...", "basename": "page-12.jpg" } ] }
 *
 * FamilySearch и другие архивы: автоматический массовый обход страниц может нарушать правила сайта.
 * Надёжный путь — открыть запись вручную, в DevTools найти прямой URL файла изображения (или экспорт
 * через официальные средства), занести URL в JSON и запустить этот скрипт.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

function parseArgs(argv) {
  const out = { file: null, outDir: path.join(ROOT, "public", "photos", "downloaded"), delayMs: 300 };
  const rest = [...argv];
  while (rest.length) {
    const a = rest.shift();
    if (a === "--out" && rest.length) {
      out.outDir = path.resolve(rest.shift());
    } else if (a === "--delay" && rest.length) {
      out.delayMs = Math.max(0, parseInt(rest.shift(), 10) || 0);
    } else if (!a.startsWith("-") && !out.file) {
      out.file = path.resolve(a);
    }
  }
  return out;
}

function normalizeList(raw) {
  if (Array.isArray(raw)) {
    return raw.map((u, i) =>
      typeof u === "string" ? { url: u, basename: null } : { url: u.url, basename: u.basename ?? null },
    );
  }
  const items = raw.items ?? raw.urls;
  if (!Array.isArray(items)) {
    throw new Error("JSON: ожидается массив или поле items / urls");
  }
  return items.map((entry) => {
    if (typeof entry === "string") return { url: entry, basename: null };
    if (entry && typeof entry.url === "string") {
      return { url: entry.url, basename: entry.basename ?? null };
    }
    throw new Error("Некорректный элемент списка");
  });
}

function safeBasename(name) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").replace(/^\.+/, "") || "image";
}

function guessExtFromContentType(ct) {
  if (!ct) return ".bin";
  const m = ct.match(/image\/(jpeg|jpg|png|gif|webp)/i);
  if (!m) return ".bin";
  const k = m[1].toLowerCase();
  if (k === "jpeg") return ".jpg";
  return `.${k}`;
}

function defaultNameFromUrl(urlStr, index) {
  try {
    const u = new URL(urlStr);
    const base = path.basename(u.pathname);
    if (base && base !== "/" && !base.includes("?")) return safeBasename(base);
  } catch {
    /* ignore */
  }
  return `image-${String(index).padStart(4, "0")}.bin`;
}

async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms));
}

function guessExtContentTypeOrUrl(ct, urlStr) {
  const fromCt = guessExtFromContentType(ct);
  if (fromCt !== ".bin") return fromCt;
  try {
    const p = new URL(urlStr).pathname;
    const ext = path.extname(p).toLowerCase();
    if ([".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext)) return ext === ".jpeg" ? ".jpg" : ext;
  } catch {
    /* ignore */
  }
  return ".bin";
}

function buildOutputFilename(basenameSafe, contentType, targetUrl, index) {
  if (basenameSafe) {
    if (path.extname(basenameSafe)) return basenameSafe;
    return `${basenameSafe}${guessExtContentTypeOrUrl(contentType, targetUrl)}`;
  }
  const def = defaultNameFromUrl(targetUrl, index);
  if (path.extname(def) && path.extname(def) !== ".bin") return def;
  const stem = path.parse(def).name;
  return `${stem}${guessExtContentTypeOrUrl(contentType, targetUrl)}`;
}

async function main() {
  const { file, outDir, delayMs } = parseArgs(process.argv.slice(2));
  if (!file || !fs.existsSync(file)) {
    console.error("Укажите существующий JSON со списком URL:");
    console.error("  node scripts/download-images.mjs ./scripts/image-download-urls.example.json");
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  const list = normalizeList(raw);

  fs.mkdirSync(outDir, { recursive: true });

  const cookie = process.env.DOWNLOAD_COOKIE?.trim();
  const headers = {
    "User-Agent": "genealogy-download-images/1.0 (local; +https://example.invalid)",
    ...(cookie ? { Cookie: cookie } : {}),
  };

  let ok = 0;
  let fail = 0;

  for (let i = 0; i < list.length; i += 1) {
    const { url, basename } = list[i];
    let targetUrl;
    try {
      const u = new URL(url);
      if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("only http(s)");
      targetUrl = u.toString();
    } catch (e) {
      console.error(`[${i + 1}/${list.length}] Пропуск (некорректный URL):`, url);
      fail += 1;
      continue;
    }

    const basenameSafe = basename ? safeBasename(basename) : null;

    try {
      const res = await fetch(targetUrl, { redirect: "follow", headers });
      if (!res.ok) {
        console.error(`[${i + 1}/${list.length}] HTTP ${res.status}: ${targetUrl}`);
        fail += 1;
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      const outFile = buildOutputFilename(
        basenameSafe,
        res.headers.get("content-type"),
        targetUrl,
        i,
      );
      const outPath = path.join(outDir, outFile);
      fs.writeFileSync(outPath, buf);
      console.log(`[${i + 1}/${list.length}] OK`, outPath, `(${buf.length} B)`);
      ok += 1;
    } catch (e) {
      console.error(`[${i + 1}/${list.length}] Ошибка:`, targetUrl, e.message ?? e);
      fail += 1;
    }

    if (delayMs > 0 && i < list.length - 1) await sleep(delayMs);
  }

  console.log(`Готово: успешно ${ok}, ошибок ${fail}, папка: ${outDir}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
