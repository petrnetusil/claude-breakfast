// Downloads the recipe photos from Rohlík's CDN into public/recipes/ so the app
// does not depend on cdn.rohlik.cz at runtime. Run: npm run fetch-images
import { mkdir, writeFile, access } from 'node:fs/promises';
import { RECIPES } from '../src/data/recipes.ts';

const dir = new URL('../public/recipes/', import.meta.url);
await mkdir(dir, { recursive: true });

let ok = 0;
const failed = [];
for (const r of RECIPES) {
  const file = new URL(r.imageLocal.replace(/^recipes\//, ''), dir);
  try {
    await access(file);
    ok++;
    continue;
  } catch {}
  try {
    const res = await fetch(r.image);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await writeFile(file, Buffer.from(await res.arrayBuffer()));
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
