// Rewrites the post caption of shorts already rendered, without rendering the video again:
// out/series/NN-pinyin/caption.txt and series/renders/NN.txt. The manifest keeps the commit the
// video was rendered from and gains `caption`, the commit the caption was written from.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { postCaption } from "./series/caption.mjs";
import { parseNumbers, slug } from "./series/render-lib.mjs";

const root = path.resolve(import.meta.dirname, "..");
const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
const rows = JSON.parse(readFileSync(path.join(root, "series/hexagrams.json"), "utf8"));
const wanted = parseNumbers(process.argv[2]);
const numbers = wanted === "all" ? rows.filter((r) => r.copy).map((r) => r.number) : wanted;
const commit = git("rev-parse", "HEAD");
const clean = git("status", "--porcelain") === "";

for (const n of numbers) {
  const row = rows.find((r) => r.number === n);
  const nn = String(n).padStart(2, "0");
  const dir = path.join(root, "out/series", `${nn}-${slug(row.pinyin)}`);
  const record = path.join(root, "series/renders", `${nn}.json`);
  if (!existsSync(record)) {
    console.log(`[${n}] not rendered yet: npm run series -- ${n}`);
    continue;
  }
  const caption = postCaption(row);
  const manifest = { ...JSON.parse(readFileSync(record, "utf8")), caption: { commit, clean } };
  const json = `${JSON.stringify(manifest, null, 1)}\n`;
  writeFileSync(path.join(root, "series/renders", `${nn}.txt`), caption);
  writeFileSync(record, json);
  if (existsSync(dir)) {
    writeFileSync(path.join(dir, "caption.txt"), caption);
    writeFileSync(path.join(dir, "manifest.json"), json);
  }
  console.log(`[${n}] caption written`);
}
