// Renders a special's moon (blender/moon.py) to the clip its props name (src/lib/clips.ts
// moonClip): the hexagram, tempo, lesson length and labels all come from the special.
//
//   node scripts/moon.mjs --special mid-autumn-2026 [--preview]
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { clipFrames } from "../src/lib/clips.ts";
import { planOf } from "../src/lib/seriesPlan.ts";
import { seriesProps } from "../src/series/props.ts";
import { keepIfComplete } from "./blender-output.mjs";

const root = path.resolve(import.meta.dirname, "..");
const blender = process.env.BLENDER ?? "/Applications/Blender.app/Contents/MacOS/Blender";
const { values: a } = parseArgs({ options: { special: { type: "string" }, preview: { type: "boolean", default: false } } });
if (!a.special) (console.error("usage: node scripts/moon.mjs --special NAME [--preview]"), process.exit(1));
const special = JSON.parse(readFileSync(path.join(root, "series/specials", `${a.special}.json`), "utf8"));
const rows = JSON.parse(readFileSync(path.join(root, "series/hexagrams.json"), "utf8"));
const props = seriesProps({ ...rows.find((r) => r.number === special.hexagram), copy: special.copy });
if (!props.lesson?.clip) (console.error(`${a.special} has no moon lesson`), process.exit(1));
const plan = planOf(props);
const beats = plan.cta - plan.showcase;
const lines = props.hexagram.lines.join("");
const rain = path.join(root, "public/assets/3d/rain.mp4");
const pixel = path.join(root, "public/fonts/PixelOperator-Bold.ttf");

const clip = a.preview ? props.lesson.clip.replace(/\.mp4$/, "-preview.mp4") : props.lesson.clip;
const name = path.basename(clip, ".mp4");
// Blender writes to out/moons/ first; the clip only takes its real name once every frame is there.
const partial = path.join(root, "out/moons", `${name}.mp4`);
const out = path.join(root, "public", clip);
mkdirSync(path.dirname(partial), { recursive: true });
rmSync(partial, { force: true });
console.log(`rendering ${path.relative(root, out)}`);
const run = spawnSync(
  blender,
  [
    "-b", "--factory-startup", "--python-exit-code", "1", "-P", path.join(root, "blender/moon.py"), "--",
    "--lines", lines, "--bpm", String(props.bpm), "--beats", String(beats), "--rain", rain, "--pixel", pixel, "--out", partial,
    ...(props.lesson.labels ? ["--labels", props.lesson.labels.join("|")] : []),
    ...(a.preview ? ["--preview"] : []),
  ],
  { encoding: "utf8", maxBuffer: 1 << 28 },
);
writeFileSync(path.join(root, "out/moons", `${name}.log`), `${run.stdout ?? ""}\n${run.stderr ?? ""}`);
if (run.status !== 0 || !existsSync(partial)) (console.error(`Blender failed (exit ${run.status}); see out/moons/${name}.log`), process.exit(1));
const frames = Number(
  execFileSync("ffprobe", ["-v", "error", "-count_frames", "-select_streams", "v:0", "-show_entries", "stream=nb_read_frames", "-of", "csv=p=0", partial], { encoding: "utf8" }).trim(),
);
const expected = clipFrames(beats, props.bpm);
if (!keepIfComplete({ partial, out, frames, expected })) (console.error(`The render had ${frames} frames; expected ${expected}.`), process.exit(1));
console.log(`wrote ${path.relative(root, out)} (${frames} frames)`);
