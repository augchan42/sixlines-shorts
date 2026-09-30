// Renders an explainer (series/explainers/<name>.json; readout-key by default):
//   node scripts/explainer.mjs [name] [--pages 1,5]
// --pages renders only those pages (counted from 1, chapter pages not counted) and no end card, as
// <name>-pages-1-5, for a smoke test.
// A script with chapters (wangbi-lesson) is the Lesson composition; otherwise ReadoutKey.
// Its props are built from the script and the example hexagram's series props (music, end
// card, readout) and written to series/explainers/<name>.props.json, which the studio opens.
// out/explainers/<name>/ gets short.mp4, share.mp4, caption.txt and manifest.json; the
// manifest is copied to series/renders/explainers/<name>.json. An earlier render moves to
// out/explainers/versions/<name>/<time>-<commit>/ first.
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { overrides } from "../src/series/overrides.ts";
import { seriesProps } from "../src/series/props.ts";
import { shareBitrate, versionDir } from "./series/render-lib.mjs";
import { makeSfx } from "./sfx.mjs";

const root = path.resolve(import.meta.dirname, "..");
const pub = (f) => path.join(root, "public", f);
const shaAbs = (f) => createHash("sha256").update(readFileSync(f)).digest("hex");
const run = (cmd, args) => execFileSync(cmd, args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
// loudnorm prints its measurements to stderr; the JSON block is the part between the braces.
const loudnormJson = (args) => {
  const { stderr } = spawnSync("ffmpeg", ["-nostdin", "-hide_banner", "-y", ...args, "-f", "null", "-"], { cwd: root, encoding: "utf8" });
  return stderr.slice(stderr.lastIndexOf("{"), stderr.lastIndexOf("}") + 1);
};
// The end card holds 3 beats past its 9 while the music fades, as in the shorts (the user, on the
// lesson, 2026-09-27: "the end credit ends too abruptly").
const END_HOLD_BEATS = 3;
const argv = process.argv.slice(2);
const pagesArg = argv.includes("--pages") ? argv[argv.indexOf("--pages") + 1] : undefined;
const scriptName = argv.find((a) => !a.startsWith("--") && a !== pagesArg) ?? "readout-key";
const script = JSON.parse(readFileSync(path.join(root, "series/explainers", `${scriptName}.json`), "utf8"));
const only = pagesArg?.split(",").map(Number);
const name = only ? `${scriptName}-pages-${only.join("-")}` : scriptName;
const rows = JSON.parse(readFileSync(path.join(root, "series/hexagrams.json"), "utf8"));
const row = rows.find((r) => r.number === script.hexagram);
const sp = seriesProps(row, overrides[row.number]);
if (!sp.lesson?.readout) throw new Error(`hexagram ${row.number} has no readout lesson`);

// The two trigrams (upper, lower) of a hexagram's lines, bottom line first, as the readout names them.
const TRIGRAMS = { "111": ["天", "HEAVEN"], "000": ["地", "EARTH"], "100": ["雷", "THUNDER"], "010": ["水", "WATER"], "001": ["山", "MOUNTAIN"], "011": ["風", "WIND"], "101": ["火", "FIRE"], "110": ["澤", "LAKE"] };
const trigram = (bits) => ({ zh: TRIGRAMS[bits.join("")][0], name: TRIGRAMS[bits.join("")][1] });
const hexagram = (n) => {
  const r = rows.find((x) => x.number === n);
  return { number: n, name: r.name, lines: r.lines, trigrams: [trigram(r.lines.slice(3)), trigram(r.lines.slice(0, 3))] };
};
// A script can pin a readout as it teaches it (`readouts` in its json), so the lesson keeps
// its example when the short's own readout changes (22, 2026-09-27).
const readout = (n) => {
  const p = seriesProps(rows.find((x) => x.number === n), overrides[n]);
  return { ...hexagram(n), trigrams: p.lesson.trigrams, text: p.lesson.text, ...(script.readouts?.[n] ?? p.lesson.readout) };
};

// The teletype tick: a short decaying click, 25 a second (one per typed character), generated.
const ticks = "local/sfx/teletype.wav";
if (!existsSync(pub(ticks))) makeSfx("teletype", pub(ticks));

// The flight look's machine sounds (docs/research/2026-09-27-nostromo-screens.md): a ship's
// background (bed), a beacon, a relay's click-clack, a printer's chatter, and (with `cues`) a
// sweep, chatter, warble and winddown, generated from scripts/sfx.mjs's recipes.
// "beacon": "level" takes the beacon up to the bed's level, as the landing's beep sits level
// with the engine (the bed measures -31 LUFS on a phone, the first beacon -41; review of
// 2026-09-27, item 2). The first beacon, 10 dB under, stays the default.
const sfx = {
  hum: "local/sfx/bed.wav", beacon: script.beacon === "level" ? "local/sfx/beacon-level.wav" : "local/sfx/beacon.wav", relay: "local/sfx/relay.wav", printer: "local/sfx/printer.wav",
  ...(script.cues ? { sweep: "local/sfx/sweep.wav", chatter: "local/sfx/chatter.wav", warble: "local/sfx/warble.wav", winddown: "local/sfx/winddown.wav" } : {}),
};
if (script.look === "flight")
  for (const f of Object.values(sfx))
    if (!existsSync(pub(f))) makeSfx(path.basename(f, ".wav"), pub(f));

// "endcardText": true plays the end card clip rendered without its tagline and site
// (<clip>-notext.mp4, blender/endcard.py --no-text) and has Remotion draw them, on the timing
// Blender wrote beside the clip. The tagline is the one in scripts/endcard.mjs (goudy-caps).
const endcardClip = (clip, text) => {
  if (!text) return { clip };
  const notext = clip.replace(/\.mp4$/, "-notext.mp4");
  const timing = JSON.parse(readFileSync(pub(notext.replace(/\.mp4$/, ".json")), "utf8"));
  return { clip: notext, text: { rise: timing.rise, beat: timing.beat, frames: timing.frames, tagline: "REVEAL THE MOMENT", site: "sixlines.day" } };
};
const allPages = script.chapters?.flatMap((c) => [...(c.page ? [{ chapter: c.page }] : []), ...c.pages.map(({ q, a, show }) => ({ q, a, show }))]);
const usesDiagram = script.chapters?.some((c) => c.pages.some((p) => p.show?.plate || p.show?.diagram));
// Every hexagram's name by its value, the bottom line the most significant bit (src/lib/diagram.ts).
const byValue = Object.fromEntries(rows.map((r) => [r.lines.reduce((v, l) => v * 2 + l, 0), { zh: r.zh, name: r.name }]));
const lesson = script.chapters && {
  pages: only ? allPages.filter((p) => !p.chapter).filter((_, i) => only.includes(i + 1)) : allPages,
  ...(usesDiagram ? { plate: "local/leibniz/plate.jpg", names: byValue } : {}),
  hexagrams: Object.fromEntries([...new Set(script.chapters.flatMap((c) => c.pages.flatMap((p) => [p.show?.hex, ...(p.show?.small ?? [])])).filter((n) => typeof n === "number"))].map((n) => [n, hexagram(n)])),
  readouts: Object.fromEntries([...new Set(script.chapters.flatMap((c) => c.pages.flatMap((p) => (p.show?.full ?? []).map((f) => f.n))))].map((n) => [n, readout(n)])),
  // "music": null leaves only the machine sounds; "mix" sets their volumes.
  music: script.music ? `local/music/${script.music.file}` : null,
  musicStart: script.music?.start ?? 0,
  ...(script.mix ? { mix: script.mix } : {}),
  ticks,
  // A test clip of a page or two has no end card. "endcardRate" below 1 plays the card slower
  // (a slower reveal, longer for the music); "endMusic" lands the music's `at` second on the cut
  // to the end card, faded in over the `lead` seconds before it as the machine sounds fall away.
  // A tempo-independent card (sp.endcard.rate) plays at its own rate times endcardRate.
  endcard: { ...endcardClip(sp.endcard.clip, script.endcardText), seconds: script.endcard === false || only ? 0 : ((9 + END_HOLD_BEATS) * 60) / sp.bpm / (script.endcardRate ?? 1), rate: (script.endcardRate ?? 1) * (sp.endcard.rate ?? 1) },
  ...(script.endMusic ? { endMusic: script.endMusic } : {}),
  ...(script.look === "flight" ? { look: "flight", sfx } : {}),
};

const props = lesson || {
  number: row.number,
  name: row.name,
  lines: row.lines,
  trigrams: sp.lesson.trigrams,
  ...sp.lesson.readout,
  steps: script.steps.map(({ at, text, focus }) => ({ at, text, focus })),
  end: script.end,
  music: sp.music,
  musicStart: sp.musicStart,
  // The end card clip is 9 beats long.
  endcard: { clip: sp.endcard.clip, seconds: (9 * 60) / sp.bpm },
};
const propsFile = path.join(root, "series/explainers", `${name}.props.json`);
writeFileSync(propsFile, `${JSON.stringify(props, null, 1)}\n`);
// --props-only: write the props for the studio or stills, and stop.
if (process.argv.includes("--props-only")) process.exit(0);

const commit = run("git", ["rev-parse", "HEAD"]).trim();
const clean = run("git", ["status", "--porcelain"]).trim() === "";
const inputs = [...(props.music ? [props.music] : []), ...(props.plate ? [props.plate] : []), props.endcard.clip, ...(lesson ? [ticks] : []), ...(props.sfx ? Object.values(props.sfx) : [])];
const missing = inputs.filter((f) => !existsSync(pub(f)));
if (missing.length) throw new Error(`missing: ${missing.join(", ")}`);

const dir = path.join(root, "out/explainers", name);
if (existsSync(path.join(dir, "manifest.json"))) {
  const kept = path.join(root, versionDir("out/explainers", name, JSON.parse(readFileSync(path.join(dir, "manifest.json"), "utf8"))));
  mkdirSync(path.dirname(kept), { recursive: true });
  renameSync(dir, kept);
  console.log(`kept the earlier render in ${path.relative(root, kept)}`);
}
mkdirSync(dir, { recursive: true });
const short = path.join(dir, "short.mp4");
const share = path.join(dir, "share.mp4");
console.log("rendering");
if (props.look === "flight") {
  // The screen's glow: rendered flat, then a light bloom over the lesson, not the end card.
  // No bow or blur: resampling smeared the scan lines and the pixel font (the user, round 3:
  // "It's not pixelated. I can't see the scan lines").
  const flat = path.join(dir, "flat.mp4");
  run("npx", ["remotion", "render", "src/index.ts", "Lesson", flat, `--props=${propsFile}`, "--log=error"]);
  const lessonEnd = Number(run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", flat]).trim()) - props.endcard.seconds;
  // Loudness in two passes, linear: one gain over the whole file, so the jump from the machine
  // sounds to the end card's music is kept as mixed. One pass (no measured values) is
  // loudnorm's dynamic mode, which levelled it (a render at 02e2ae3 measured LRA 10.6 in,
  // 6.7 out). The target comes down from -16 as far as the true peak needs, since loudnorm
  // falls back to dynamic when a linear gain would pass TP.
  const measure = (args) => JSON.parse(loudnormJson(["-i", flat, "-vn", "-af", `loudnorm=${args}:print_format=json`]));
  const m = measure("I=-16:TP=-1.5");
  // Floored to a tenth and a tenth below that: rounding the target up by 0.04 dB was enough to
  // pass TP and make loudnorm fall back (the smoke test, 2026-09-27).
  const target = Math.floor(Math.min(-16, Number(m.input_i) + (-1.5 - Number(m.input_tp))) * 10) / 10 - 0.1;
  const norm = `loudnorm=I=${target.toFixed(1)}:TP=-1.5:LRA=20:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`;
  const check = measure(norm.slice("loudnorm=".length));
  if (check.normalization_type !== "linear") throw new Error(`loudnorm fell back to ${check.normalization_type}: ${JSON.stringify(check)}`);
  console.log(`loudnorm linear: ${m.input_i} -> ${target.toFixed(1)} LUFS, true peak ${m.input_tp} -> -1.5`);
  run("ffmpeg", ["-v", "error", "-y", "-i", flat, "-filter_complex", `[0:v]format=gbrp,split[a][b];[b]gblur=sigma=14[g];[a][g]blend=all_mode=screen:all_opacity=0.3:enable='lt(t,${lessonEnd.toFixed(3)})',format=yuv420p[v]`, "-map", "[v]", "-map", "0:a", "-af", norm, "-ar", "48000", "-c:v", "libx264", "-crf", "14", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "256k", short]);
} else run("npx", ["remotion", "render", "src/index.ts", lesson ? "Lesson" : "ReadoutKey", short, `--props=${propsFile}`, "--log=error"]);

// The share copy: yuv420p, faststart, under 25 MB, for Instagram and Threads.
const seconds = Number(run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", short]).trim());
const kbps = shareBitrate(seconds);
const enc = (pass, out) => [
  "-v", "error", "-y", "-i", short, "-vf", "scale=in_range=full:out_range=tv,format=yuv420p",
  "-c:v", "libx264", "-b:v", `${kbps}k`, "-pass", String(pass), "-passlogfile", path.join(dir, "x264"),
  ...(pass === 1 ? ["-an", "-f", "mp4", out] : ["-c:a", "aac", "-b:a", "128k", "-ar", "44100", "-movflags", "+faststart", out]),
];
run("ffmpeg", enc(1, "/dev/null"));
run("ffmpeg", enc(2, share));
writeFileSync(path.join(dir, "caption.txt"), `${script.caption}\n`);

const files = Object.fromEntries(inputs.map((f) => [f, shaAbs(pub(f))]));
files[`out/explainers/${name}/short.mp4`] = shaAbs(short);
files[`out/explainers/${name}/share.mp4`] = shaAbs(share);
const manifest = { explainer: name, rendered: new Date().toISOString(), commit, clean, seconds, shareKbps: kbps, props, files };
writeFileSync(path.join(dir, "manifest.json"), `${JSON.stringify(manifest, null, 1)}\n`);
const records = path.join(root, "series/renders/explainers");
mkdirSync(records, { recursive: true });
copyFileSync(path.join(dir, "manifest.json"), path.join(records, `${name}.json`));
console.log(`${path.relative(root, share)} (${seconds.toFixed(1)} s)`);
