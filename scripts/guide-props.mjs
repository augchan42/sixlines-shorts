// Props for the Guide short (src/templates/Guide.tsx) from its spec and the voice takes:
//   node scripts/guide-props.mjs series/specials/guide-wangbi.json [--beats 1-3]
// Each line starts `gap` seconds after the last ends, the first after `lead`; each word gets the
// frames it is spoken on (from the takes' character timings), and each mark in the spec the frame
// its word starts. Copies the takes to public/local/voice/<name>/ and writes
// series/specials/<name>[-b1-3].props.json.
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const specPath = process.argv[2];
if (!specPath) throw new Error("usage: guide-props.mjs series/specials/<name>.json [--beats 1-3]");
const spec = JSON.parse(readFileSync(path.resolve(root, specPath), "utf8"));
const name = path.basename(specPath, ".json");
const range = process.argv.includes("--beats") ? process.argv[process.argv.indexOf("--beats") + 1] : undefined;
const [lo, hi] = range ? range.split("-").map(Number) : [1, spec.narration.length];
const { fps, lead, gap, tail } = spec.timing;
const F = (s) => Math.round(s * fps);
const bare = (w) => w.toLowerCase().replace(/[^a-z0-9-]/g, "");

mkdirSync(path.join(root, "public/local/voice", name), { recursive: true });
const beats = [];
let clock = lead;
for (let n = lo; n <= hi; n++) {
  const nn = String(n).padStart(2, "0");
  const a = JSON.parse(readFileSync(path.join(root, "out/voice", name, `${nn}.json`), "utf8"));
  const src = `local/voice/${name}/${nn}.mp3`;
  copyFileSync(path.join(root, "out/voice", name, `${nn}.mp3`), path.join(root, "public", src));
  // Words: runs of characters between spaces, from the first letter's start to the last's end.
  const words = [];
  let w = null;
  a.characters.forEach((c, i) => {
    if (c === " ") { if (w) words.push(w); w = null; return; }
    w ??= { text: "", from: F(clock + a.character_start_times_seconds[i]) };
    w.text += c;
    w.to = F(clock + a.character_end_times_seconds[i]);
  });
  if (w) words.push(w);
  const end = clock + a.character_end_times_seconds.at(-1);
  beats.push({ n, src, from: F(clock), to: F(end), words });
  clock = end + gap;
}
const marks = {};
for (const b of beats) marks[`b${b.n}`] = b.from;
for (const m of spec.marks) {
  const b = beats.find((x) => x.n === m.beat);
  if (!b) continue;
  const w = b.words.find((x) => bare(x.text) === bare(m.word));
  if (!w) throw new Error(`mark ${m.name}: no word "${m.word}" in line ${m.beat}`);
  marks[m.name] = w.from;
}
const frames = F(clock - gap + tail);
const out = path.join(root, "series/specials", `${name}${range ? `-b${range}` : ""}.props.json`);
writeFileSync(out, JSON.stringify({ frames, beats, marks }, null, 1) + "\n");
console.log(`${path.relative(root, out)}: ${frames} frames (${(frames / fps).toFixed(1)} s)`, marks);
