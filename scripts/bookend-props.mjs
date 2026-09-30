// Writes series/bookend/NN.json for a short, timed as Kun's (series/bookend/02.json) was:
//   node scripts/bookend-props.mjs 01            (ivory open card)
//   node scripts/bookend-props.mjs 01 --no-open  (the short's own terminal open; the close only)
// The flicker in starts when the hook turns to caps (src/scenes/Hook.tsx: 0.45 of the hook, which
// runs from frame 0 to the hexagram, 4 beats in); the flicker out starts 3 beats before the end,
// once the end card has held (src/lib/seriesPlan.ts, CREDIT_BEATS). On Kun this gives 36 and 900,
// the values picked by eye. Then render with scripts/bookend.mjs NN.
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const n = Number(process.argv[2]);
const nn = String(n).padStart(2, "0");
const open = !process.argv.includes("--no-open");
const FPS = 30;
const HOOK_BEATS = 4;
const HELD_BEATS = 3;

const row = JSON.parse(readFileSync(path.join(root, "series/hexagrams.json"), "utf8")).find((r) => r.number === n);
const { props } = JSON.parse(readFileSync(path.join(root, "series/renders", `${nn}.json`), "utf8"));
const dir = readdirSync(path.join(root, "out/series")).find((d) => d.startsWith(`${nn}-`));
const short = path.join(root, "out/series", dir, "short.mp4");
const frames = Number(execFileSync("ffprobe", ["-v", "error", "-count_frames", "-select_streams", "v:0", "-show_entries", "stream=nb_read_frames", "-of", "default=nw=1:nk=1", short], { encoding: "utf8" }).trim());
const hookFrames = Math.round((props.firstBeat + (HOOK_BEATS * 60) / props.bpm) * FPS);
const kun = JSON.parse(readFileSync(path.join(root, "series/bookend/02.json"), "utf8"));

const out = {
  about: `Launch bookend for ${n} ${row.pinyin}, ${open ? "with" : "without"} the ivory open card (Astra's test of the open, docs/research/2026-09-30-codex-media-strategy-bookend.md). Written by scripts/bookend-props.mjs.`,
  src: `local/bookend/${nn}-${dir.split("-").slice(1).join("-")}.mp4`,
  frames,
  hook: props.hook,
  label: `${n} · ${row.zh} ${row.pinyin.toUpperCase()} · ${row.name.toUpperCase()}`,
  tagline: kun.tagline,
  site: kun.site,
  inAt: Math.floor(0.45 * hookFrames),
  outAt: frames - Math.round((HELD_BEATS * 60 * FPS) / props.bpm) - 1,
  tail: kun.tail,
  sfx: kun.sfx,
  sfxNote: kun.sfxNote,
  open,
};
writeFileSync(path.join(root, "series/bookend", `${nn}.json`), JSON.stringify(out, null, 1) + "\n");
console.log(`series/bookend/${nn}.json: ${frames} frames, in ${out.inAt}, out ${out.outAt}, open ${open}`);
