/**
 * Repository root for node scripts (the directory containing package.json).
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

export const __fsMediaRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

export function fsOrigin() {
  return "https://www.familysearch.org";
}
