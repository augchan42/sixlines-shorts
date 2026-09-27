// Renders an end-card treatment (blender/endcard.py) into out/endcards/ (gitignored), or with
// --clip into that public/-relative path, which the Series template plays.
//
//   node scripts/endcard.mjs --lines 010010 --bpm 100 --mode join|flip|snap|fill [--beats 7] [--tagline STYLE] [--clip PATH] [--preview]
//   node scripts/endcard.mjs --lines 010010 --ref --mode join [--beats 9] [--clip PATH]
//
// --ref renders the tempo-independent card: 120 bpm at 60 fps (REF_BPM, REF_FPS in
// src/lib/clips.ts), which Remotion plays at the track's rate; one Blender render serves any
// track. The glyph rain behind it is rain.mp4 with each frame doubled (rain-60.mp4), so it
// runs at the same speed as in the 30 fps cards.
//
// Tagline styles, none with a period since 2026-09-27 (the user: "we definitely need to leave off the period"): goudy-caps (REVEAL THE MOMENT in Goudy, typed; the default), serif (Goudy,
// faded in), or typed with a cursor: pixel
// (REVEAL THE MOMENT in PixelOperator), terminal (reveal the moment in Andale Mono),
// terminal-caps (REVEAL THE MOMENT in Andale Mono), goudy and goudy-caps (the serif, typed),
// typewriter (REVEAL THE MOMENT in Courier New).
//
// The wordmark and tagline use the app's Goudy Old Style from the sixlines-ios checkout
// (SIXLINES_IOS, default ../sixlines-ios); it is not copied into this public repo.
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { CLIP_FPS, clipFrames, REF_BPM, REF_FPS } from "../src/lib/clips.ts";
import { keepIfComplete } from "./blender-output.mjs";

const root = path.resolve(import.meta.dirname, "..");
const blender = process.env.BLENDER ?? "/Applications/Blender.app/Contents/MacOS/Blender";
const ios = process.env.SIXLINES_IOS ?? path.resolve(root, "../sixlines-ios");
const { values: a } = parseArgs({
  options: {
    lines: { type: "string" }, bpm: { type: "string" }, mode: { type: "string" },
    beats: { type: "string", default: "7" }, preview: { type: "boolean", default: false },
    // No tagline or site in the clip: Remotion draws them (src/scenes/EndCard3D.tsx); Blender's
    // timing JSON moves into place beside the clip.
    "no-text": { type: "boolean", default: false },
    ref: { type: "boolean", default: false },
    tagline: { type: "string", default: "goudy-caps" }, clip: { type: "string" },
  },
});
if (a.ref && a.bpm) (console.error("--ref renders at 120 bpm; leave --bpm out"), process.exit(1));
if (a.ref) a.bpm = String(REF_BPM);
const fps = a.ref ? REF_FPS : CLIP_FPS;
if (!/^[01]{6}$/.test(a.lines ?? "") || !(Number(a.bpm) > 0) || !["join", "flip", "snap", "fill"].includes(a.mode)) {
  console.error("usage: node scripts/endcard.mjs --lines 010010 (--bpm 100 | --ref) --mode join|flip|snap|fill [--beats 7] [--tagline STYLE] [--clip PATH] [--preview]");
  process.exit(1);
}
const serif = path.join(ios, "SixLines/Resources/Fonts/goudos.ttf");
const pixel = path.join(root, "public/fonts/PixelOperator-Bold.ttf");
const TAGLINES = {
  serif: [],
  pixel: ["--tagline", "REVEAL THE MOMENT", "--tagline-font", pixel],
  terminal: ["--tagline", "reveal the moment", "--tagline-font", "/System/Library/Fonts/Supplemental/Andale Mono.ttf"],
  goudy: ["--tagline", "Reveal the moment", "--tagline-font", serif],
  "goudy-caps": ["--tagline", "REVEAL THE MOMENT", "--tagline-font", serif],
  "terminal-caps": ["--tagline", "REVEAL THE MOMENT", "--tagline-font", "/System/Library/Fonts/Supplemental/Andale Mono.ttf"],
  typewriter: ["--tagline", "REVEAL THE MOMENT", "--tagline-font", "/System/Library/Fonts/Supplemental/Courier New.ttf"],
};
if (!TAGLINES[a.tagline]) (console.error(`--tagline is one of ${Object.keys(TAGLINES).join(", ")}`), process.exit(1));
const rain30 = path.join(root, "public/assets/3d/rain.mp4");
for (const f of [serif, pixel, rain30]) if (!existsSync(f)) (console.error(`missing ${f}`), process.exit(1));
const rain = a.ref ? rain30.replace(/\.mp4$/, `-${REF_FPS}.mp4`) : rain30;
if (a.ref && !existsSync(rain)) {
  console.log(`writing ${path.relative(root, rain)} (rain.mp4 with each frame doubled)`);
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", rain30, "-vf", `fps=${REF_FPS}`, "-c:v", "libx264", "-crf", "12", rain]);
}

const style = a.tagline === "serif" ? "" : `-${a.tagline}`;
const name = `endcard-${a.mode}${style}-${a.lines}-${a.ref ? "" : `${a.bpm}bpm-`}${a.beats}b${a.ref ? "-ref" : ""}${a["no-text"] ? "-notext" : ""}${a.preview ? "-preview" : ""}`;
// Blender writes to out/endcards/ first; a --clip only takes its real name once every frame is there.
const partial = path.join(root, "out/endcards", `${name}.mp4`);
const out = a.clip ? path.join(root, "public", a.clip) : partial;
mkdirSync(path.dirname(partial), { recursive: true });
rmSync(partial, { force: true });
if (a.clip) rmSync(out, { force: true });
console.log(`rendering ${path.relative(root, out)}`);
const run = spawnSync(
  blender,
  [
    "-b", "--factory-startup", "--python-exit-code", "1", "-P", path.join(root, "blender/endcard.py"), "--",
    "--lines", a.lines, "--bpm", a.bpm, "--beats", a.beats, "--mode", a.mode,
    "--rain", rain, "--serif", serif, "--pixel", pixel, "--out", partial, "--fps", String(fps), ...TAGLINES[a.tagline],
    ...(a.preview ? ["--preview"] : []), ...(a["no-text"] ? ["--no-text"] : []),
  ],
  { encoding: "utf8", maxBuffer: 1 << 28 },
);
writeFileSync(path.join(root, "out/endcards", `${name}.log`), `${run.stdout ?? ""}\n${run.stderr ?? ""}`);
if (run.status !== 0 || !existsSync(partial)) {
  console.error(`Blender failed (exit ${run.status}); see out/endcards/${name}.log`);
  process.exit(1);
}
if (a.clip) {
  const frames = Number(
    execFileSync(
      "ffprobe",
      ["-v", "error", "-count_frames", "-select_streams", "v:0", "-show_entries", "stream=nb_read_frames", "-of", "csv=p=0", partial],
      { encoding: "utf8" },
    ).trim(),
  );
  const expected = clipFrames(Number(a.beats), Number(a.bpm), fps);
  if (!keepIfComplete({ partial, out, frames, expected })) {
    console.error(`The render had ${frames} frames; expected ${expected}. Log: out/endcards/${name}.log`);
    process.exit(1);
  }
  const timing = partial.replace(/\.mp4$/, ".json");
  if (existsSync(timing)) renameSync(timing, out.replace(/\.mp4$/, ".json"));
  console.log(`wrote ${path.relative(root, out)} (${frames} frames)`);
}
