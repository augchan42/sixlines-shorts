// Copies each hexagram's reading, verse and today screens from the sixlines-ios galleries,
// skipping any already present. Capture them first, each set in one run (the script clears its output):
//   cd ../sixlines-ios && APPEARANCES=matrix PAIRS="1-1,2-2,…,64-64" scripts/capture_gallery.sh yilin
//   DAYS="$(grep -v '^#' ../sixlines-shorts/series/today-days.txt | paste -sd, -)" \
//     APPEARANCES=matrix OUT=gallery-today scripts/capture_gallery.sh today
//   npm run series:screens
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { screenFiles } from "./series/render-lib.mjs";

const root = path.resolve(import.meta.dirname, "..");
const ios = process.env.SIXLINES_IOS ?? path.resolve(root, "../sixlines-ios");
const missing = [];
for (let n = 1; n <= 64; n++) {
  for (const { from, to } of screenFiles(n, ios)) {
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
