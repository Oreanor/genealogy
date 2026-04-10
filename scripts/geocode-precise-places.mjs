import fs from "node:fs";
import path from "node:path";
import { __fsMediaRoot, sleep } from "./fs-media-lib.mjs";

const INDEXED_EVENTS_PATH = path.join(__fsMediaRoot, "src", "lib", "data", "indexedEvents.json");
const ATTACHMENTS_PATH = path.join(__fsMediaRoot, "src", "lib", "data", "indexedEventAttachments.json");
const COORDS_PATH = path.join(__fsMediaRoot, "src", "lib", "data", "precisePlaceCoords.json");

function parseArgs(argv) {
  let delayMs = 1100; // Nominatim: ~1 req/sec
  let overwrite = false;
  const rest = [...argv];
  while (rest.length) {
    const a = rest.shift();
    if (a === "--delay-ms" && rest.length) delayMs = Number(rest.shift()) || delayMs;
    else if (a === "--overwrite") overwrite = true;
  }
  return { delayMs, overwrite };
}

function buildQuery(precisePlace, placeKey) {
  const p = String(precisePlace || "").trim();
  const k = String(placeKey || "").trim();
  // placeKey часто содержит регион/страну, даже если историческое. Это помогает снять неоднозначность.
  // Добавляем "Ukraine" как общий якорь (почти все места из выгрузки оттуда), но не мешаем если уже есть.
  const anchor = /ukraine|росс|russian|empire/i.test(k) ? "Ukraine" : "Ukraine";
  return `${p}, ${k}, ${anchor}`;
}

async function nominatimSearch(q) {
  const url =
    "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&addressdetails=0&q=" +
    encodeURIComponent(q);
  const res = await fetch(url, {
    headers: {
      "User-Agent": "genealogy-local-script/1.0 (no-email)",
      Accept: "application/json",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  const best = data[0];
  const lat = Number(best.lat);
  const lon = Number(best.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { lat, lon, displayName: best.display_name ?? "" };
}

async function main() {
  const { delayMs, overwrite } = parseArgs(process.argv.slice(2));

  if (!fs.existsSync(INDEXED_EVENTS_PATH)) throw new Error(`Missing: ${INDEXED_EVENTS_PATH}`);
  if (!fs.existsSync(ATTACHMENTS_PATH)) throw new Error(`Missing: ${ATTACHMENTS_PATH}`);
  if (!fs.existsSync(COORDS_PATH)) throw new Error(`Missing: ${COORDS_PATH}`);

  const events = JSON.parse(fs.readFileSync(INDEXED_EVENTS_PATH, "utf8")).events ?? [];
  const byHitId = JSON.parse(fs.readFileSync(ATTACHMENTS_PATH, "utf8")).byHitId ?? {};
  const coords = JSON.parse(fs.readFileSync(COORDS_PATH, "utf8"));
  coords.byKey = coords.byKey ?? {};

  const wanted = new Map(); // key -> { precisePlace, placeKey, query }
  for (const e of events) {
    const p = byHitId[e.hitId]?.precisePlace;
    if (!p) continue;
    const key = `${String(p).trim()}@@${String(e.placeKey ?? "").trim()}`;
    if (!wanted.has(key)) {
      wanted.set(key, {
        precisePlace: String(p).trim(),
        placeKey: String(e.placeKey ?? "").trim(),
        query: buildQuery(p, e.placeKey),
      });
    }
  }

  const keys = [...wanted.keys()].sort((a, b) => a.localeCompare(b, "ru"));
  let need = 0;
  for (const k of keys) {
    if (!overwrite && coords.byKey[k]?.lat && coords.byKey[k]?.lon) continue;
    need += 1;
  }

  console.log(`wanted keys: ${keys.length}`);
  console.log(`to geocode: ${need} (overwrite=${overwrite})`);
  if (need === 0) return;

  let done = 0;
  for (const k of keys) {
    if (!overwrite && coords.byKey[k]?.lat && coords.byKey[k]?.lon) continue;
    const w = wanted.get(k);
    try {
      const r = await nominatimSearch(w.query);
      if (!r) {
        coords.byKey[k] = {
          label: w.precisePlace,
          placeKey: w.placeKey,
          query: w.query,
          status: "not_found",
        };
        console.log(`NOT_FOUND: ${k} -> ${w.query}`);
      } else {
        coords.byKey[k] = {
          label: w.precisePlace,
          placeKey: w.placeKey,
          query: w.query,
          status: "ok",
          lat: r.lat,
          lon: r.lon,
          displayName: r.displayName,
          source: "nominatim",
          updatedAt: new Date().toISOString(),
        };
        console.log(`OK: ${k} -> ${r.lat},${r.lon}`);
      }
    } catch (e) {
      coords.byKey[k] = {
        label: w.precisePlace,
        placeKey: w.placeKey,
        query: w.query,
        status: "error",
        error: String(e?.message || e),
        updatedAt: new Date().toISOString(),
      };
      console.log(`ERROR: ${k} -> ${String(e?.message || e)}`);
    }
    done += 1;
    fs.writeFileSync(COORDS_PATH, JSON.stringify(coords, null, 2) + "\n", "utf8");
    if (done < need) await sleep(delayMs);
  }

  console.log(`\nDone. Updated -> ${COORDS_PATH}`);
}

main();

