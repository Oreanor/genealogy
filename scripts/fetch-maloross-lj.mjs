import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outDir = path.join(root, 'public', 'photos', 'others', 'maloross');

const urls = [
  'https://humus.livejournal.com/3090328.html',
  'https://humus.livejournal.com/3092085.html',
  'https://humus.livejournal.com/3093834.html',
];

fs.mkdirSync(outDir, { recursive: true });

const re = /https?:\/\/img-fotki\.yandex\.ru\/get\/[^\s"'<>]+\.jpg/gi;
const all = new Set();

for (const pageUrl of urls) {
  const tmp = path.join(root, `.tmp-lj-${path.basename(pageUrl)}`);
  execFileSync('curl.exe', ['-fsSL', '-A', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120', '-o', tmp, pageUrl], {
    stdio: 'inherit',
  });
  const h = fs.readFileSync(tmp, 'utf8');
  fs.unlinkSync(tmp);
  for (const m of h.matchAll(re)) {
    all.add(m[0].replace(/^http:\/\//i, 'https://'));
  }
}

const list = [...all];
console.log('unique images:', list.length);

let n = 0;
for (const u of list) {
  const base = u.split('/').pop() || `img-${n}.jpg`;
  const dest = path.join(outDir, base);
  if (fs.existsSync(dest)) {
    console.log('skip exists', base);
    continue;
  }
  const res = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; genealogy-fetch/1.0)' } });
  if (!res.ok) {
    console.error('FAIL', res.status, u);
    continue;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
  n++;
  console.log('+', base, buf.length);
}
console.log('downloaded new:', n);
