// Fetches a character's stroke data (Make Me a Hanzi, via hanzi-writer-data; Arphic Public
// License) to public/local/hanzi/, which is gitignored, for blender/character.py; or renders a
// hexagram's character lesson from its settings in series/characters.json.
//
//   node scripts/character.mjs 困 [井 ...]
//   node scripts/character.mjs --render 42[,18,...] [--still FRAME] [--preview]
//       writes out/characters/42-益.mp4 (or 42-益-FRAME.png), one after another
//   node scripts/character.mjs --special character-42
//       renders a special's character lesson (scripts/character-special.mjs) at the short's
//       tempo and length, to the clip its props name under public/
//   node scripts/character.mjs --series 42[,18,...]
//       the same for series shorts whose copy has a character lesson (scripts/lesson-apply.mjs)
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { clipFrames } from "../src/lib/clips.ts";
import { planOf } from "../src/lib/seriesPlan.ts";
import { seriesProps } from "../src/series/props.ts";
import { keepIfComplete } from "./blender-output.mjs";
import { characterFlags } from "./character-args.mjs";

const root = path.resolve(import.meta.dirname, "..");
const dir = path.join(root, "public/local/hanzi");
const blender = process.env.BLENDER ?? "/Applications/Blender.app/Contents/MacOS/Blender";

async function fetchStrokes(ch) {
  mkdirSync(dir, { recursive: true });
  const res = await fetch(`https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/${encodeURIComponent(ch)}.json`);
  if (!res.ok) throw new Error(`${ch}: ${res.status}`);
  const data = await res.json();
  writeFileSync(path.join(dir, `${ch}.json`), JSON.stringify(data));
  console.log(`wrote public/local/hanzi/${ch}.json (${data.medians.length} strokes)`);
}

const { values: a, positionals } = parseArgs({
  allowPositionals: true,
  options: { render: { type: "string" }, special: { type: "string" }, series: { type: "string" }, still: { type: "string" }, preview: { type: "boolean", default: false } },
});

async function render(number) {
  const { characters } = JSON.parse(readFileSync(path.join(root, "series/characters.json"), "utf8"));
  const c = characters.find((x) => x.number === number);
  if (!c) (console.error(`no character for hexagram ${number} in series/characters.json`), process.exit(1));
  const data = path.join(dir, `${c.char}.json`);
  if (!existsSync(data)) await fetchStrokes(c.char);
  const name = `${c.number}-${c.char}${a.still ? `-${a.still}` : ""}${a.preview ? "-preview" : ""}`;
  const out = path.join(root, "out/characters", `${name}.${a.still ? "png" : "mp4"}`);
  mkdirSync(path.dirname(out), { recursive: true });
  console.log(`rendering ${path.relative(root, out)}`);
  const run = spawnSync(
    blender,
    [
      "-b", "--factory-startup", "--python-exit-code", "1", "-P", path.join(root, "blender/character.py"), "--",
      "--data", data, "--bpm", String(c.bpm), "--beats", String(c.beats), "--out", out,
      ...characterFlags(c.args),
      ...(a.still ? ["--still", a.still] : []),
      ...(a.preview ? ["--preview"] : []),
    ],
    { stdio: ["ignore", "ignore", "inherit"] },
  );
  if (run.status !== 0) process.exit(run.status ?? 1);
}

const rows = () => JSON.parse(readFileSync(path.join(root, "series/hexagrams.json"), "utf8"));

async function renderSpecial(name) {
  const special = JSON.parse(readFileSync(path.join(root, "series/specials", `${name}.json`), "utf8"));
  await renderLesson(name, { ...rows().find((r) => r.number === special.hexagram), copy: special.copy });
}

// A lesson's clip: the short's tempo and the lesson's length. The drawing and the camera's
// crane take the character's own beats; the camera then holds over the finished character
// for the rest, while the short types its sentence.
async function renderLesson(name, row) {
  const props = seriesProps(row);
  const c = row.copy?.lesson?.character;
  if (props.lesson?.kind !== "character" || !c) (console.error(`${name} has no character lesson`), process.exit(1));
  if (existsSync(path.join(root, "public", props.lesson.clip))) return console.log(`${name}: ${props.lesson.clip} is already there`);
  const plan = planOf(props);
  const beats = plan.cta - plan.showcase;
  const data = path.join(dir, `${c.char}.json`);
  if (!existsSync(data)) await fetchStrokes(c.char);
  // Blender writes to out/characters/partial/ first; the clip takes its real name only with every frame.
  const partial = path.join(root, "out/characters/partial", path.basename(props.lesson.clip));
  const out = path.join(root, "public", props.lesson.clip);
  mkdirSync(path.dirname(partial), { recursive: true });
  rmSync(partial, { force: true });
  console.log(`rendering ${path.relative(root, out)}`);
  const run = spawnSync(
    blender,
    [
      "-b", "--factory-startup", "--python-exit-code", "1", "-P", path.join(root, "blender/character.py"), "--",
      "--data", data, "--bpm", String(props.bpm), "--beats", String(beats), "--hold", String(beats - c.beats), "--out", partial, ...characterFlags(c.args),
    ],
    { stdio: ["ignore", "ignore", "inherit"] },
  );
  if (run.status !== 0 || !existsSync(partial)) (console.error(`Blender failed (exit ${run.status})`), process.exit(1));
  const frames = Number(
    execFileSync("ffprobe", ["-v", "error", "-count_frames", "-select_streams", "v:0", "-show_entries", "stream=nb_read_frames", "-of", "csv=p=0", partial], { encoding: "utf8" }).trim(),
  );
  const expected = clipFrames(beats, props.bpm);
  if (!keepIfComplete({ partial, out, frames, expected })) (console.error(`The render had ${frames} frames; expected ${expected}.`), process.exit(1));
  console.log(`wrote ${path.relative(root, out)} (${frames} frames)`);
}

if (a.special) {
  await renderSpecial(a.special);
} else if (a.series) {
  for (const n of a.series.split(",").map(Number)) await renderLesson(String(n), rows().find((r) => r.number === n));
} else if (a.render) {
  for (const n of a.render.split(",")) await render(Number(n));
} else {
  for (const ch of positionals) await fetchStrokes(ch);
}
