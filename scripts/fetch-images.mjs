// Downloads the recipe photos from Rohlík's CDN into public/recipes/ so the app
// does not depend on cdn.rohlik.cz at runtime. Photos are shrunk to fit 1200 px
// and saved as JPEG (the originals are up to 2900 px and 1.8 MB each).
// Run: npm run fetch-images   (behind a proxy on Node 22: NODE_USE_ENV_PROXY=1)
import { mkdir, writeFile, access } from 'node:fs/promises';
import sharp from 'sharp';
import { RECIPES } from '../src/data/recipes.ts';

const dir = new URL('../public/', import.meta.url);
await mkdir(new URL('recipes/', dir), { recursive: true });

let ok = 0;
const failed = [];
for (const r of RECIPES) {
  const file = new URL(r.imageLocal, dir);
  try {
    await access(file);
    ok++;
    continue;
  } catch {}
  try {
    const res = await fetch(r.image);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const jpeg = await sharp(Buffer.from(await res.arrayBuffer()))
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .flatten({ background: '#ffffff' })
      .jpeg({ quality: 78, progressive: true, mozjpeg: true })
      .toBuffer();
    await writeFile(file, jpeg);
    ok++;
  } catch (e) {
    failed.push(`${r.title}: ${e.message}`);
  }
}
console.log(`${ok}/${RECIPES.length} photos in public/recipes/`);
if (failed.length) {
  console.log('Failed:\n' + failed.join('\n'));
  process.exitCode = 1;
}
