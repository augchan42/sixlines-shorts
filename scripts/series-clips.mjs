// Renders the Blender clips the series needs (hexagram builds and end cards), skipping any already in public/.
//   npm run series:clips -- 29 | 2,52 | all
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { overrides } from "../src/series/overrides.ts";
import { seriesProps } from "../src/series/props.ts";
import { clipJobs, parseNumbers } from "./series/render-lib.mjs";

const root = path.resolve(import.meta.dirname, "..");
const rows = JSON.parse(readFileSync(path.join(root, "series/hexagrams.json"), "utf8"));
const wanted = parseNumbers(process.argv[2]);
// Clips depend on lines and tempo only, so rows without copy still get theirs.
const withCopy = (r) =>
  r.copy ? r : { ...r, copy: { hook: { text: "" }, meaning: [{ text: "" }, { text: "" }], question: { text: "" }, plates: [`${r.number}-1`, `${r.number}-2`] } };
const props = rows.filter((r) => wanted === "all" || wanted.includes(r.number)).map((r) => seriesProps(withCopy(r), overrides[r.number]));
const jobs = clipJobs(props, (clip) => existsSync(path.join(root, "public", clip)));
console.log(`${jobs.length} clip(s) to render`);
let failed = 0;
for (const [i, j] of jobs.entries()) {
  console.log(`[${i + 1}/${jobs.length}] ${j.clip}`);
  const args =
    j.kind === "endcard"
      ? ["scripts/endcard.mjs", "--lines", j.lines, "--bpm", String(j.bpm), "--beats", String(j.beats), "--mode", j.mode, "--clip", j.clip]
      : ["scripts/blender.mjs", "--lines", j.lines, "--bpm", String(j.bpm), "--beats", String(j.beats)];
  const run = spawnSync("node", args, { cwd: root, stdio: "inherit" });
  if (run.status !== 0) failed++;
}
if (failed) {
  console.error(`${failed} clip(s) failed; see out/blender-*.log and out/endcards/*.log`);
  process.exit(1);
}
