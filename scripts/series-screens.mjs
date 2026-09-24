// Copies each hexagram's reading and verse screens from the sixlines-ios gallery, skipping
// any already present. Capture them first, all 64 in one run (the script clears its output):
//   cd ../sixlines-ios && APPEARANCES=matrix PAIRS="1-1,2-2,…,64-64" scripts/capture_gallery.sh yilin
//   npm run series:screens
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { screenFiles } from "./series/render-lib.mjs";

const root = path.resolve(import.meta.dirname, "..");
const gallery = path.join(process.env.SIXLINES_IOS ?? path.resolve(root, "../sixlines-ios"), "gallery");
const missing = [];
for (let n = 1; n <= 64; n++) {
  for (const { from, to } of screenFiles(n, gallery)) {
    const dest = path.join(root, to);
    if (existsSync(dest)) continue;
    if (!existsSync(from)) {
      missing.push(path.relative(root, from));
      continue;
    }
    mkdirSync(path.dirname(dest), { recursive: true });
    copyFileSync(from, dest);
    console.log(`copied   ${to}`);
  }
}
if (missing.length) console.error(`${missing.length} screen(s) not in the gallery, e.g. ${missing[0]}`);
