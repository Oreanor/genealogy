/**
 * Общая логика для скачивания media FamilySearch из familysearch-search-flat.json
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const __fsMediaRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
export const DEFAULT_FS_JSON = path.join(
  __fsMediaRoot,
  "src",
  "data",
  "temp",
  "familysearch-search-flat.json",
);
export const MIN_IMAGE_BYTES = 800;

export function fsOrigin() {
  return "https://www.familysearch.org";
}

export function toAbsoluteFsHref(href) {
  if (!href || typeof href !== "string") return null;
  const h = href.trim();
  if (h.startsWith("http://") || h.startsWith("https://")) return h;
  return `${fsOrigin()}${h.startsWith("/") ? h : `/${h}`}`;
}

export function slugFromHref(href) {
  const abs = toAbsoluteFsHref(href);
  try {
    const u = new URL(abs);
    const tail = u.pathname.split("/").filter(Boolean).slice(-3).join("_");
    return tail.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 100) || "image";
  } catch {
    return "image";
  }
}

export function extFromContentType(ct) {
  if (!ct) return ".bin";
  const m = ct.match(/image\/(jpeg|jpg|pjpeg|png|gif|webp|tiff?)/i);
  if (!m) return ".bin";
  const k = m[1].toLowerCase();
  if (k === "jpeg" || k === "jpg" || k === "pjpeg") return ".jpg";
  if (k === "tif" || k === "tiff") return ".tif";
  return `.${k}`;
}

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export function parseKinds(argv) {
  const kinds = new Set(["record"]);
  const rest = [...argv];
  while (rest.length) {
    const a = rest.shift();
    if (a === "--kinds" && rest.length) {
      kinds.clear();
      rest
        .shift()
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((k) => kinds.add(k));
    }
  }
  return kinds;
}

export function loadTasksFromJson(jsonPath, kinds) {
  const raw = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const records = raw.records ?? [];
  const byHref = new Map();

  for (const r of records) {
    const hitId = r.hitId;
    if (!hitId) continue;
    for (const m of r.media ?? []) {
      if (!kinds.has(m.kind)) continue;
      const href = m.href;
      if (!href) continue;
      const abs = toAbsoluteFsHref(href);
      if (!byHref.has(abs)) {
        byHref.set(abs, { hitId, href });
      }
    }
  }

  return { records, tasks: [...byHref.entries()] };
}

export async function captureFromPage(page, fullUrl, outBasePath) {
  const captured = [];

  const onResponse = async (response) => {
    try {
      const ct = (response.headers()["content-type"] || "").split(";")[0].trim();
      if (!ct.startsWith("image/")) return;
      if (response.status() < 200 || response.status() >= 400) return;
      const buf = Buffer.from(await response.body());
      if (buf.length < MIN_IMAGE_BYTES) return;
      captured.push({ buf, ct, url: response.url(), size: buf.length });
    } catch {
      /* ignore */
    }
  };

  page.on("response", onResponse);
  try {
    await page.goto(fullUrl, { waitUntil: "domcontentloaded", timeout: 120000 });
    await sleep(10000);
  } finally {
    page.off("response", onResponse);
  }

  if (captured.length > 0) {
    captured.sort((a, b) => b.size - a.size);
    const best = captured[0];
    const ext = extFromContentType(best.ct);
    const out = ext === ".bin" ? `${outBasePath}.jpg` : `${outBasePath}${ext}`;
    fs.writeFileSync(out, best.buf);
    return { ok: true, path: out, bytes: best.size, via: "response" };
  }

  const shot = `${outBasePath}.png`;
  await page.screenshot({ path: shot, fullPage: true });
  const st = fs.statSync(shot);
  return { ok: true, path: shot, bytes: st.size, via: "screenshot" };
}

export async function runDownloadLoop(ctx, tasks, outDir, delayMs) {
  fs.mkdirSync(outDir, { recursive: true });

  let ok = 0;
  let fail = 0;
  let i = 0;

  for (const [absUrl, { hitId, href }] of tasks) {
    i += 1;
    const slug = slugFromHref(href);
    const outBase = path.join(outDir, `${hitId}__${slug}`);

    const page = await ctx.newPage();
    try {
      console.log(`[${i}/${tasks.length}] ${absUrl}`);
      const result = await captureFromPage(page, absUrl, outBase);
      console.log(`  → ${result.via} ${result.path} (${result.bytes} B)`);
      ok += 1;
    } catch (e) {
      console.error(`  ✗`, e.message || e);
      fail += 1;
    } finally {
      await page.close().catch(() => {});
    }

    if (delayMs > 0 && i < tasks.length) await sleep(delayMs);
  }

  return { ok, fail };
}
