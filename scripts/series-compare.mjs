// Puts a series short's earlier render (out/before/NN-trigram.mp4) and its current one
// (out/series/NN-trigram/share.mp4) side by side, with the current one's sound, into
// out/compare/NN-trigram.mp4 (yuv420p, faststart, for sending), and records the hashes of
// all three in out/compare/NN-trigram.json.
//
//   node scripts/series-compare.mjs 1 2 29 ...
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const sha = (f) => createHash("sha256").update(readFileSync(f)).digest("hex");
const font = "/System/Library/Fonts/Supplemental/Andale Mono.ttf";
const label = (text) =>
  `drawtext=fontfile='${font}':text='${text}':x=(w-text_w)/2:y=h-90:fontsize=34:fontcolor=white:box=1:boxcolor=black@0.7:boxborderw=10`;

const numbers = process.argv.slice(2).map(Number);
if (!numbers.length) {
  console.error("usage: node scripts/series-compare.mjs N [N ...]");
  process.exit(1);
}
mkdirSync(path.join(root, "out/compare"), { recursive: true });
for (const n of numbers) {
  const nn = String(n).padStart(2, "0");
  const dir = readdirSync(path.join(root, "out/series")).find((d) => d.startsWith(`${nn}-`));
  const before = path.join(root, "out/before", `${dir}.mp4`);
  const after = path.join(root, "out/series", dir, "share.mp4");
  if (!existsSync(before)) throw new Error(`no ${path.relative(root, before)}`);
  const style = JSON.parse(readFileSync(path.join(root, "out/series", dir, "props.json"), "utf8")).style;
  const out = path.join(root, "out/compare", `${dir}.mp4`);
  execFileSync("ffmpeg", [
    "-v", "error", "-y", "-i", before, "-i", after,
    "-filter_complex", `[0:v]scale=540:960,${label("BEFORE")}[a];[1:v]scale=540:960,${label(`AFTER (${style})`)}[b];[a][b]hstack=inputs=2[v]`,
    "-map", "[v]", "-map", "1:a", "-c:v", "libx264", "-crf", "23", "-preset", "medium", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", "-shortest", out,
  ]);
  writeFileSync(
    path.join(root, "out/compare", `${dir}.json`),
    JSON.stringify({ script: "scripts/series-compare.mjs", before: { path: path.relative(root, before), sha256: sha(before) }, after: { path: path.relative(root, after), sha256: sha(after) }, compare: { path: path.relative(root, out), sha256: sha(out) } }, null, 1) + "\n",
  );
  console.log(`${path.relative(root, out)} (${(statSync(out).size / 1e6).toFixed(1)} MB)`);
}
