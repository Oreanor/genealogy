#!/usr/bin/env node
/**
 * Pre-crops face avatars for delivery (runs as `prebuild`; originals in public/photos are untouched).
 *
 * Avatars with a face rect are rendered as a CSS background of the whole photo, scaled up so the face
 * fills the container (see getAvatarCropStyles in src/lib/data/photos.ts). For group photos the face is
 * a few percent of the frame, so the full image had to be downloaded at 2000–4000 px wide.
 *
 * The horizontally visible part of such a background depends only on background-size and
 * background-position-x — not on the container size. So we cut that vertical strip (full height, plus a
 * small margin) at a modest width and record the adjusted size/position-x; position-y is unchanged
 * because the strip keeps the full height and the same scale. The rendered crop is identical.
 *
 * Output: public/avatar-crops/*.webp + src/lib/data/avatarCrops.generated.json
 * (key `${src}|${l},${t},${r},${b}` → { url, size, posX }). Missing keys fall back to /_next/image.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const DATA = path.join(ROOT, 'src/data/data.json');
const PUBLIC = path.join(ROOT, 'public');
const OUT_DIR = path.join(PUBLIC, 'avatar-crops');
const MANIFEST = path.join(ROOT, 'src/lib/data/avatarCrops.generated.json');

/** Output strip width (px). Largest avatar box is ~93 CSS px → ~2.75x density, enough for retina + zoom. */
const STRIP_WIDTH = 256;
/** Extra source pixels kept on each side of the visible strip (absorbs rounding). */
const MARGIN_PX = 2;
/** Must match MIN_RECT_SIZE in photos.ts (smaller rects use `cover` and are not pre-cropped). */
const MIN_RECT_SIZE = 0.5;

export const cropKey = (src, rect) => `${src}|${rect.join(',')}`;

async function main() {
  const data = JSON.parse(fs.readFileSync(DATA, 'utf8'));
  const faces = new Map();
  for (const photo of data.photos ?? []) {
    for (const p of photo.people ?? []) {
      if (!Array.isArray(p.coords) || p.coords.length < 4) continue;
      const rect = p.coords.slice(0, 4);
      faces.set(cropKey(photo.src, rect), { src: photo.src, rect });
    }
  }

  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const manifest = {};
  let total = 0;

  for (const [key, { src, rect }] of [...faces].sort(([a], [b]) => a.localeCompare(b))) {
    const [l, t, r, b] = rect;
    const w = r - l;
    const h = b - t;
    if (w < MIN_RECT_SIZE || h < MIN_RECT_SIZE || w >= 100) continue;
    const file = path.join(PUBLIC, decodeURI(src).replace(/^\//, ''));
    if (!fs.existsSync(file)) {
      console.warn(`[avatar-crops] missing ${src}`);
      continue;
    }
    // Same math as getAvatarCropStyles.
    const s = Math.max(100 / w, 100 / h); // background-size / container width
    const px = l / (l - r + 100); // background-position-x as a fraction

    const img = sharp(file, { failOn: 'none' }).rotate();
    const { width: imgW, height: imgH } = await img.metadata().then((m) =>
      (m.orientation ?? 1) >= 5 ? { width: m.height, height: m.width } : m
    );
    // Visible horizontal range of the image, as fractions of its width.
    const visL = ((s - 1) * px) / s;
    const visR = visL + 1 / s;
    const left = Math.max(0, Math.floor(visL * imgW) - MARGIN_PX);
    const right = Math.min(imgW, Math.ceil(visR * imgW) + MARGIN_PX);
    const a = left / imgW;
    const bb = right / imgW;
    const stripSize = s * (bb - a); // new background-size / container width
    // Strip offset from container left = Wc * ((1 - s) * px + a * s); convert to background-position %.
    const denom = 1 - stripSize;
    const posX = Math.abs(denom) < 1e-9 ? 0 : (((1 - s) * px + a * s) / denom) * 100;

    const outWidth = Math.min(STRIP_WIDTH, right - left);
    const buf = await img
      .extract({ left, top: 0, width: right - left, height: imgH })
      .resize({ width: outWidth })
      .webp({ quality: 85 })
      .toBuffer();
    const name = crypto.createHash('sha1').update(key).digest('hex').slice(0, 16) + '.webp';
    fs.writeFileSync(path.join(OUT_DIR, name), buf);
    total += buf.length;
    manifest[key] = {
      url: `/avatar-crops/${name}`,
      size: +(stripSize * 100).toFixed(4),
      posX: +posX.toFixed(4),
    };
  }

  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
  console.log(
    `[avatar-crops] ${Object.keys(manifest).length} crops, ${(total / 1024).toFixed(0)} KB → public/avatar-crops`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
