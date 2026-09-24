// Renders an end-card treatment (blender/endcard.py) into out/endcards/ (gitignored).
//
//   node scripts/endcard.mjs --lines 010010 --bpm 100 --mode join|flip|snap|fill [--beats 7] [--tagline STYLE] [--preview]
//
// Tagline styles: serif (Goudy, faded in; the default), or typed with a cursor: pixel
// (REVEAL THE MOMENT. in PixelOperator), terminal (reveal the moment. in Andale Mono),
// terminal-caps (REVEAL THE MOMENT. in Andale Mono), goudy and goudy-caps (the serif, typed),
// typewriter (REVEAL THE MOMENT in Courier New).
//
// The wordmark and tagline use the app's Goudy Old Style from the sixlines-ios checkout
// (SIXLINES_IOS, default ../sixlines-ios); it is not copied into this public repo.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";

const root = path.resolve(import.meta.dirname, "..");
const blender = process.env.BLENDER ?? "/Applications/Blender.app/Contents/MacOS/Blender";
const ios = process.env.SIXLINES_IOS ?? path.resolve(root, "../sixlines-ios");
const { values: a } = parseArgs({
  options: {
    lines: { type: "string" }, bpm: { type: "string" }, mode: { type: "string" },
    beats: { type: "string", default: "7" }, preview: { type: "boolean", default: false },
    tagline: { type: "string", default: "serif" },
  },
});
if (!/^[01]{6}$/.test(a.lines ?? "") || !(Number(a.bpm) > 0) || !["join", "flip", "snap", "fill"].includes(a.mode)) {
  console.error("usage: node scripts/endcard.mjs --lines 010010 --bpm 100 --mode join|flip|snap|fill [--beats 7] [--preview]");
  process.exit(1);
}
const serif = path.join(ios, "SixLines/Resources/Fonts/goudos.ttf");
const pixel = path.join(root, "public/fonts/PixelOperator-Bold.ttf");
const TAGLINES = {
  serif: [],
  pixel: ["--tagline", "REVEAL THE MOMENT.", "--tagline-font", pixel],
  terminal: ["--tagline", "reveal the moment.", "--tagline-font", "/System/Library/Fonts/Supplemental/Andale Mono.ttf"],
  goudy: ["--tagline", "Reveal the moment.", "--tagline-font", serif],
  "goudy-caps": ["--tagline", "REVEAL THE MOMENT.", "--tagline-font", serif],
  "terminal-caps": ["--tagline", "REVEAL THE MOMENT.", "--tagline-font", "/System/Library/Fonts/Supplemental/Andale Mono.ttf"],
  typewriter: ["--tagline", "REVEAL THE MOMENT", "--tagline-font", "/System/Library/Fonts/Supplemental/Courier New.ttf"],
};
if (!TAGLINES[a.tagline]) (console.error(`--tagline is one of ${Object.keys(TAGLINES).join(", ")}`), process.exit(1));
const rain = path.join(root, "public/assets/3d/rain.mp4");
for (const f of [serif, pixel, rain]) if (!existsSync(f)) (console.error(`missing ${f}`), process.exit(1));

const style = a.tagline === "serif" ? "" : `-${a.tagline}`;
const name = `endcard-${a.mode}${style}-${a.lines}-${a.bpm}bpm-${a.beats}b${a.preview ? "-preview" : ""}`;
const out = path.join(root, "out/endcards", `${name}.mp4`);
mkdirSync(path.dirname(out), { recursive: true });
console.log(`rendering ${path.relative(root, out)}`);
const run = spawnSync(
  blender,
  [
    "-b", "--factory-startup", "--python-exit-code", "1", "-P", path.join(root, "blender/endcard.py"), "--",
    "--lines", a.lines, "--bpm", a.bpm, "--beats", a.beats, "--mode", a.mode,
    "--rain", rain, "--serif", serif, "--pixel", pixel, "--out", out, ...TAGLINES[a.tagline],
    ...(a.preview ? ["--preview"] : []),
  ],
  { encoding: "utf8", maxBuffer: 1 << 28 },
);
writeFileSync(path.join(root, "out/endcards", `${name}.log`), `${run.stdout ?? ""}\n${run.stderr ?? ""}`);
if (run.status !== 0 || !existsSync(out)) {
  console.error(`Blender failed (exit ${run.status}); see out/endcards/${name}.log`);
  process.exit(1);
}
