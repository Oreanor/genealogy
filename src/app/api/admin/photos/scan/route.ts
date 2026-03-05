import { NextResponse } from 'next/server';
import { readdirSync } from 'fs';
import { join, resolve } from 'path';

const PHOTOS_DIR = resolve(process.cwd(), 'public', 'photos');
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);

function scanImages(dir: string, basePath: string): string[] {
  const results: string[] = [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = resolve(join(dir, e.name));
      if (!full.startsWith(PHOTOS_DIR)) continue; // path traversal guard
      const rel = basePath ? `${basePath}/${e.name}` : e.name;
      if (e.isDirectory()) {
        results.push(...scanImages(full, rel));
      } else if (e.isFile() && IMAGE_EXT.has(getExt(e.name).toLowerCase())) {
        results.push(`/photos/${rel}`);
      }
    }
  } catch {
    // directory doesn't exist or not readable
  }
  return results;
}

function getExt(name: string): string {
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i) : '';
}

export async function GET() {
  const paths = scanImages(PHOTOS_DIR, '');
  return NextResponse.json({ paths });
}
