// Fetches a character's stroke data (Make Me a Hanzi, via hanzi-writer-data; Arphic Public
// License) to public/local/hanzi/, which is gitignored, for blender/character.py.
//
//   node scripts/character.mjs 困 [井 ...]
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const dir = path.join(root, "public/local/hanzi");
mkdirSync(dir, { recursive: true });
for (const ch of process.argv.slice(2)) {
  const res = await fetch(`https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/${encodeURIComponent(ch)}.json`);
  if (!res.ok) throw new Error(`${ch}: ${res.status}`);
  const data = await res.json();
  writeFileSync(path.join(dir, `${ch}.json`), JSON.stringify(data));
  console.log(`wrote public/local/hanzi/${ch}.json (${data.medians.length} strokes)`);
}
