// A strip of a short's end card, the current render above the previous one, at six moments, so
// a change to the card (the tempo-independent card, plan B in
// docs/research/2026-09-27-recompose.md) can be judged against what it replaces. Also a
// preview copy of the current short (crf 28, 540 px wide) for sending.
//
//   node scripts/endcard-compare.mjs 22 [18 ...]
//   -> out/series/NN-name/endcard-compare.png and preview.mp4
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { planOf } from "../src/lib/seriesPlan.ts";
import { slug } from "./series/render-lib.mjs";

const root = path.resolve(import.meta.dirname, "..");
const rows = JSON.parse(readFileSync(path.join(root, "series/hexagrams.json"), "utf8"));
const run = (cmd, args) => execFileSync(cmd, args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

for (const arg of process.argv.slice(2)) {
  const n = Number(arg);
  const row = rows.find((r) => r.number === n);
  const name = `${String(n).padStart(2, "0")}-${slug(row.pinyin)}`;
  const dir = path.join(root, "out/series", name);
  const props = JSON.parse(readFileSync(path.join(dir, "props.json"), "utf8"));
  const versions = path.join(root, "out/series/versions", name);
  // The latest plain <time>-<commit> version; a labelled one (…-hud-rejected, …-copy-…) is a try or a copy.
  const previous = existsSync(versions)
    ? readdirSync(versions).filter((d) => /^\d{4}-\d\d-\d\dT\d\d-\d\d-\d\dZ-[0-9a-f]{7}$/.test(d) && existsSync(path.join(versions, d, "short.mp4"))).sort().at(-1)
    : undefined;
  if (!previous) throw new Error(`${name}: no earlier render under ${path.relative(root, versions)}`);
  const current = path.join(dir, "short.mp4");
  const old = path.join(versions, previous, "short.mp4");
  // The card runs from the cta beat to the credit beat (src/lib/seriesPlan.ts).
  const plan = planOf(props);
  const beat = 60 / props.bpm;
  const start = props.firstBeat + plan.cta * beat;
  const seconds = (plan.credit - plan.cta) * beat;
  const at = [0.03, 0.15, 0.3, 0.45, 0.65, 0.95].map((k) => start + k * seconds);
  const frames = (file, tag) => at.map((t, i) => {
    const png = path.join(dir, `endcard-${tag}-${i}.png`);
    run("ffmpeg", ["-v", "error", "-y", "-ss", t.toFixed(3), "-i", file, "-frames:v", "1", "-vf", "scale=360:640", png]);
    return png;
  });
  const top = frames(current, "new");
  const bottom = frames(old, "old");
  const out = path.join(dir, "endcard-compare.png");
  run("ffmpeg", [
    "-v", "error", "-y", ...[...top, ...bottom].flatMap((f) => ["-i", f]),
    "-filter_complex", `${top.map((_, i) => `[${i}:v]`).join("")}hstack=6[a];${bottom.map((_, i) => `[${i + 6}:v]`).join("")}hstack=6[b];[a][b]vstack`,
    out,
  ]);
  for (const f of [...top, ...bottom]) run("rm", [f]);
  run("ffmpeg", ["-v", "error", "-y", "-i", current, "-vf", "scale=540:-2", "-c:v", "libx264", "-crf", "28", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", path.join(dir, "preview.mp4")]);
  console.log(`${name}: ${path.relative(root, out)} (current above ${previous}), preview.mp4; card ${start.toFixed(2)}-${(start + seconds).toFixed(2)} s`);
}
