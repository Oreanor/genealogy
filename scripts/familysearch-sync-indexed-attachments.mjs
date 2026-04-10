import fs from "node:fs";
import path from "node:path";
import { __fsMediaRoot } from "./fs-media-lib.mjs";

const TEMP_DIR = path.join(__fsMediaRoot, "src", "data", "temp");
const DEFAULT_ENRICHED = path.join(TEMP_DIR, "familysearch-records-with-viewer-header.json");

const INDEXED_EVENTS_PATH = path.join(__fsMediaRoot, "src", "lib", "data", "indexedEvents.json");
const ATTACHMENTS_PATH = path.join(__fsMediaRoot, "src", "lib", "data", "indexedEventAttachments.json");

function parseArgs(argv) {
  let enrichedPath = DEFAULT_ENRICHED;
  let keepExisting = true;

  const rest = [...argv];
  while (rest.length) {
    const a = rest.shift();
    if (a === "--enriched" && rest.length) enrichedPath = path.resolve(rest.shift());
    else if (a === "--overwrite") keepExisting = false;
  }

  return { enrichedPath, keepExisting };
}

function main() {
  const { enrichedPath, keepExisting } = parseArgs(process.argv.slice(2));

  if (!fs.existsSync(enrichedPath)) throw new Error(`Missing enriched file: ${enrichedPath}`);
  if (!fs.existsSync(INDEXED_EVENTS_PATH)) throw new Error(`Missing indexedEvents.json: ${INDEXED_EVENTS_PATH}`);
  if (!fs.existsSync(ATTACHMENTS_PATH)) throw new Error(`Missing indexedEventAttachments.json: ${ATTACHMENTS_PATH}`);

  const enriched = JSON.parse(fs.readFileSync(enrichedPath, "utf8"));
  const byHitIdFromEnriched = new Map();
  for (const r of enriched.records ?? []) {
    if (!r?.hitId) continue;
    const h = String(r.viewerHeader ?? "").trim();
    if (h) byHitIdFromEnriched.set(r.hitId, h);
  }

  const indexed = JSON.parse(fs.readFileSync(INDEXED_EVENTS_PATH, "utf8"));
  const events = indexed.events ?? [];

  const existing = JSON.parse(fs.readFileSync(ATTACHMENTS_PATH, "utf8"));
  const out = {
    byHitId: keepExisting ? { ...(existing.byHitId ?? {}) } : {},
  };

  let updated = 0;
  let skippedExisting = 0;
  let missing = 0;

  for (const e of events) {
    const hitId = e.hitId;
    const precise = byHitIdFromEnriched.get(hitId);
    if (!precise) {
      missing += 1;
      continue;
    }

    if (keepExisting && out.byHitId[hitId]?.precisePlace) {
      skippedExisting += 1;
      continue;
    }

    out.byHitId[hitId] = {
      ...(out.byHitId[hitId] ?? {}),
      precisePlace: precise,
    };
    updated += 1;
  }

  fs.writeFileSync(ATTACHMENTS_PATH, JSON.stringify(out, null, 2) + "\n", "utf8");

  console.log(`indexed events: ${events.length}`);
  console.log(`enriched hitIds with viewerHeader: ${byHitIdFromEnriched.size}`);
  console.log(`updated precisePlace: ${updated}`);
  console.log(`skipped existing precisePlace: ${skippedExisting}`);
  console.log(`missing in enriched: ${missing}`);
  console.log(`-> ${ATTACHMENTS_PATH}`);
}

main();
