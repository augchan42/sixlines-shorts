// Renders a lesson's Blender scene (blender/glyphs.py or blender/trigram.py) to the clip its
// props name (src/lib/clips.ts sceneClip), at the short's tempo and the lesson's length, for a
// series short or a special whose lesson has a `scene`.
//
//   node scripts/lesson3d.mjs --special judgment-3d-10 [--still FRAME] [--preview]
//   node scripts/lesson3d.mjs --series 10[,60]
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
const { values: a } = parseArgs({ options: { special: { type: "string" }, series: { type: "string" }, still: { type: "string" }, preview: { type: "boolean", default: false } } });
const rows = JSON.parse(readFileSync(path.join(root, "series/hexagrams.json"), "utf8"));

// The script's flags from the scene's settings: {glyphs: "履|虎"} becomes --glyphs 履|虎.
const flags = (args) => Object.entries(args).flatMap(([k, v]) => (v === true ? [`--${k}`] : [`--${k}`, String(v)]));

function render(name, row) {
  const props = seriesProps(row);
  const scene = row.copy?.lesson?.scene;
  if (!scene || !props.lesson?.clip) (console.error(`${name} has no lesson scene`), process.exit(1));
  const plan = planOf(props);
  const beats = plan.cta - plan.showcase;
  const out = a.still ? path.join(root, "out/lesson3d", `${name}-${a.still}.png`) : path.join(root, "public", props.lesson.clip);
  if (!a.still && existsSync(out)) return console.log(`${name}: ${props.lesson.clip} is already there`);
  // Blender writes to out/lesson3d/partial/ first; the clip takes its real name only with every frame.
  const partial = a.still ? out : path.join(root, "out/lesson3d/partial", path.basename(out));
  mkdirSync(path.dirname(partial), { recursive: true });
  rmSync(partial, { force: true });
  console.log(`rendering ${path.relative(root, out)}`);
  const run = spawnSync(
    blender,
    [
      "-b", "--factory-startup", "--python-exit-code", "1", "-P", path.join(root, `blender/${scene.script}.py`), "--",
      ...flags(scene.args),
      "--pixel", path.join(root, "public/fonts/PixelOperator-Bold.ttf"),
      ...(scene.script === "glyphs" ? ["--hanzi", path.join(root, "public/local/hanzi")] : ["--lines", props.hexagram.lines.join("")]),
      "--bpm", String(props.bpm), "--beats", String(beats), "--out", partial,
      ...(a.still ? ["--still", a.still] : []),
      ...(a.preview ? ["--preview"] : []),
    ],
    { encoding: "utf8", maxBuffer: 1 << 28 },
  );
  writeFileSync(path.join(root, "out/lesson3d", `${name}.log`), `${run.stdout ?? ""}\n${run.stderr ?? ""}`);
  if (run.status !== 0 || !existsSync(partial)) (console.error(`Blender failed (exit ${run.status}); see out/lesson3d/${name}.log`), process.exit(1));
  if (a.still) return console.log(`wrote ${path.relative(root, out)}`);
  const frames = Number(
    execFileSync("ffprobe", ["-v", "error", "-count_frames", "-select_streams", "v:0", "-show_entries", "stream=nb_read_frames", "-of", "csv=p=0", partial], { encoding: "utf8" }).trim(),
  );
  const expected = clipFrames(beats, props.bpm);
  if (!keepIfComplete({ partial, out, frames, expected })) (console.error(`The render had ${frames} frames; expected ${expected}.`), process.exit(1));
  console.log(`wrote ${path.relative(root, out)} (${frames} frames)`);
}

if (a.special) {
  const special = JSON.parse(readFileSync(path.join(root, "series/specials", `${a.special}.json`), "utf8"));
  render(a.special, { ...rows.find((r) => r.number === special.hexagram), copy: special.copy });
} else if (a.series) {
  for (const n of a.series.split(",").map(Number)) render(String(n), rows.find((r) => r.number === n));
} else {
  console.error("usage: node scripts/lesson3d.mjs --special NAME | --series N[,N] [--still FRAME] [--preview]");
  process.exit(1);
}
