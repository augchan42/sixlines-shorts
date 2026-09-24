// Renders the 3D hexagram build (blender/hexagram.py) into public/assets/3d/ (gitignored).
//
//   npm run blender -- --lines 111111 --bpm 110 [--beats 4] [--edge "#6cff7a"] [--preview]
//
// Renders the glyph-rain backdrop from Remotion first if it is missing. Set BLENDER if
// Blender is not in /Applications.

import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { clipFrames, hexagramClip } from "../src/lib/clips.ts";
import { parseBlenderArgs } from "./blender-args.mjs";
import { keepIfComplete } from "./blender-output.mjs";

const root = path.resolve(import.meta.dirname, "..");
const blender = process.env.BLENDER ?? "/Applications/Blender.app/Contents/MacOS/Blender";

let args;
try {
  args = parseBlenderArgs(process.argv.slice(2));
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
if (!existsSync(blender)) {
  console.error(`Blender not found at ${blender}. Set BLENDER to the Blender executable.`);
  process.exit(1);
}

const rain = path.join(root, "public/assets/3d/rain.mp4");
if (!existsSync(rain)) {
  console.log("rendering the glyph-rain backdrop");
  mkdirSync(path.dirname(rain), { recursive: true });
  execFileSync("npx", ["remotion", "render", "src/index.ts", "RainPlate", rain, "--log=error"], { cwd: root, stdio: "inherit" });
}

const lines = args.lines.join("");
const out = path.join(root, "public", hexagramClip(args.lines, args.bpm, args.beats, args.preview));
const log = path.join(root, "out", `blender-${lines}.log`);
// Blender writes to out/ first; the clip only takes its real name once every frame is there.
const partial = path.join(root, "out", path.basename(out));
mkdirSync(path.dirname(log), { recursive: true });
// A clip left from an earlier run must not pass for this one.
rmSync(out, { force: true });
rmSync(partial, { force: true });

console.log(`rendering ${path.relative(root, out)}`);
const run = spawnSync(
  blender,
  [
    "-b", "--factory-startup", "--python-exit-code", "1", "-P", path.join(root, "blender/hexagram.py"), "--",
    "--lines", lines, "--bpm", String(args.bpm), "--beats", String(args.beats),
    "--rain", rain, "--out", partial, "--edge", args.edge, ...(args.preview ? ["--preview"] : []),
  ],
  { encoding: "utf8", maxBuffer: 1 << 28 },
);
writeFileSync(log, `${run.stdout ?? ""}\n${run.stderr ?? ""}`);
if (run.status !== 0 || !existsSync(partial)) {
  console.error(`Blender failed (exit ${run.status}). Log: ${path.relative(root, log)}`);
  process.exit(1);
}

const frames = Number(
  execFileSync(
    "ffprobe",
    ["-v", "error", "-count_frames", "-select_streams", "v:0", "-show_entries", "stream=nb_read_frames", "-of", "csv=p=0", partial],
    { encoding: "utf8" },
  ).trim(),
);
const expected = clipFrames(args.beats, args.bpm);
if (!keepIfComplete({ partial, out, frames, expected })) {
  console.error(`The render had ${frames} frames; expected ${expected}. Log: ${path.relative(root, log)}`);
  process.exit(1);
}
console.log(`wrote ${path.relative(root, out)} (${frames} frames)`);
