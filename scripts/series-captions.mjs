// Rewrites the post captions (Instagram and LinkedIn) of shorts already rendered, without
// rendering the video again: out/series/NN-pinyin/caption.txt and linkedin.txt, and
// series/renders/NN.txt and NN.linkedin.txt. A special: --special NAME (out/specials/NAME/,
// series/renders/specials/). The manifest keeps the commit the
// video was rendered from and gains `caption`, the commit the caption was written from.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { linkedinCaption, postCaption } from "./series/caption.mjs";
import { parseNumbers, slug } from "./series/render-lib.mjs";

const root = path.resolve(import.meta.dirname, "..");
const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
const rows = JSON.parse(readFileSync(path.join(root, "series/hexagrams.json"), "utf8"));
const special = process.argv[2] === "--special" ? process.argv[3] : null;
const specialCopy = special && JSON.parse(readFileSync(path.join(root, "series/specials", `${special}.json`), "utf8"));
const wanted = special ? [specialCopy.hexagram] : parseNumbers(process.argv[2]);
const numbers = wanted === "all" ? rows.filter((r) => r.copy).map((r) => r.number) : wanted;
const commit = git("rev-parse", "HEAD");
const clean = git("status", "--porcelain") === "";

for (const n of numbers) {
  const found = rows.find((r) => r.number === n);
  const row = special ? { ...found, copy: specialCopy.copy } : found;
  const nn = special ?? String(n).padStart(2, "0");
  const dir = special ? path.join(root, "out/specials", special) : path.join(root, "out/series", `${nn}-${slug(row.pinyin)}`);
  const records = path.join(root, special ? "series/renders/specials" : "series/renders");
  const record = path.join(records, `${nn}.json`);
  if (!existsSync(record)) {
    console.log(`[${n}] not rendered yet: npm run series -- ${n}`);
    continue;
  }
  const caption = postCaption(row);
  const manifest = { ...JSON.parse(readFileSync(record, "utf8")), caption: { commit, clean } };
  const json = `${JSON.stringify(manifest, null, 1)}\n`;
  writeFileSync(path.join(records, `${nn}.txt`), caption);
  writeFileSync(path.join(records, `${nn}.linkedin.txt`), linkedinCaption(row));
  writeFileSync(record, json);
  if (existsSync(dir)) {
    writeFileSync(path.join(dir, "caption.txt"), caption);
    writeFileSync(path.join(dir, "linkedin.txt"), linkedinCaption(row));
    writeFileSync(path.join(dir, "manifest.json"), json);
  }
  console.log(`[${n}] caption written`);
}
