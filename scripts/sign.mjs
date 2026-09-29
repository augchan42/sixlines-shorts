// Renders a still neon sign (blender/sign.py) from series/signs/<name>.json: its characters
// traced in neon as the character lessons trace them, with label lines under them, once per
// label font the spec names.
//
//   node scripts/sign.mjs wuyue [--font pixel|goudy] [--layout stack|row] [--size 1920x1080] [--samples N] [--clip]
// writes out/signs/wuyue-pixel.png, out/signs/wuyue-goudy.png (with --layout or --size, the
// name says so: out/signs/wuyue-goudy-row-1920x1080.png). Fetches missing stroke data first.
// With --clip, a clip instead (out/signs/wuyue-goudy.mp4): the strokes trace in, in the order
// the spec's "order" gives, to the music of the hexagram its "music" names, cut so the flare
// lands on the music's drop, encoded to play in an Instagram DM (H.264, yuv420p, faststart).
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { keepIfComplete } from "./blender-output.mjs";
import path from "node:path";
import { parseArgs } from "node:util";

const blender = process.env.BLENDER ?? "/Applications/Blender.app/Contents/MacOS/Blender";

// The label fonts: PixelOperator as the lessons' labels; the end cards' Goudy Old Style
// (public/local/fonts, not in git), which has no middle dot, so a bullet operator stands in.
export const FONTS = {
  pixel: { file: "public/fonts/PixelOperator-Bold.ttf", swap: {} },
  goudy: { file: "public/local/fonts/goudos.ttf", swap: { "·": "∙" } },
};

// blender/sign.py's arguments for one label font; `over` may set layout, size or samples.
export function signArgs(spec, root, font, out, over = {}) {
  const f = FONTS[font];
  if (!f) throw new Error(`no label font "${font}"`);
  const [width, height] = over.size ?? spec.size ?? [1080, 1920];
  const texts = spec.labels.map((l) => [...l.text].map((c) => f.swap[c] ?? c).join(""));
  for (const t of texts) if (t.includes("|")) throw new Error(`label "${t}" holds "|"`);
  return [
    "--data", spec.chars.map((c) => path.join(root, "public/local/hanzi", `${c}.json`)).join(","),
    "--layout", over.layout ?? spec.layout ?? "stack",
    "--labels", texts.join("|"),
    "--sizes", spec.labels.map((l) => String(l.size)).join(","),
    "--font", path.join(root, f.file),
    "--edge", spec.edge ?? "#ff5ec8",
    "--label-colour", spec.labelColour ?? "#a89aa3",
    ...(spec.tube ? ["--tube", String(spec.tube)] : []),
    "--width", String(width), "--height", String(height),
    ...(over.samples ? ["--samples", String(over.samples)] : []),
    ...(over.timing ? ["--timing", JSON.stringify(over.timing)] : []),
    "--out", out,
  ];
}

// A clip's timing in frames, as the character lessons draw: each stroke traced over 0.8 of a
// beat, 0.9 of a beat apart from half a beat in, with 0.6 of a beat more between characters.
// `order` maps a character's index to its strokes in drawing order (for 馮, 馬 before 冫).
// Then one flare on the next whole beat, the label lines fading in a beat apart, and a hold.
// The music starts so the flare lands on its drop, or on a 16-beat phrase after it.
export function signTiming({ counts, order, bpm, labels, drop, fps = 30, hold = 3 }) {
  const beat = (60 * fps) / bpm;
  const draw = Math.round(0.8 * beat);
  const strokes = [];
  let t = Math.round(0.5 * beat);
  counts.forEach((n, c) => {
    const ids = order[c] ?? [...Array(n).keys()];
    if (ids.length !== n || new Set(ids).size !== n || ids.some((i) => !(i >= 0 && i < n)))
      throw new Error(`character ${c}'s order must name every stroke once`);
    if (c > 0) t += Math.round(0.6 * beat);
    for (const s of ids) {
      strokes.push([c, s, t]);
      t += Math.round(0.9 * beat);
    }
  });
  const last = strokes.at(-1)[2] + draw;
  const flare = Math.round(Math.ceil((last + Math.round(0.4 * beat)) / beat) * beat);
  const fade = Math.round(1.5 * beat);
  const lines = [...Array(labels).keys()].map((i) => [flare + Math.round((0.5 + i) * beat), fade]);
  const end = lines.length ? lines.at(-1)[0] + fade : flare + Math.round(beat);
  const phrase = (16 * 60) / bpm;
  let musicStart = drop - flare / fps;
  while (musicStart < 0) musicStart += phrase;
  return { strokes, draw, flare, labels: lines, frames: end + hold * fps, musicStart };
}

// out/signs/<name>-<font>[-<layout>][-<w>x<h>].png: the spec's own layout and size need no suffix.
export function signName(spec, font, over = {}) {
  const parts = [spec.name, font];
  if (over.layout && over.layout !== (spec.layout ?? "stack")) parts.push(over.layout);
  if (over.size && over.size.join("x") !== (spec.size ?? [1080, 1920]).join("x")) parts.push(over.size.join("x"));
  return `${parts.join("-")}.${over.clip ? "mp4" : "png"}`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const root = path.resolve(import.meta.dirname, "..");
  const { values: a, positionals } = parseArgs({
    allowPositionals: true,
    options: { font: { type: "string" }, layout: { type: "string" }, size: { type: "string" }, samples: { type: "string" }, clip: { type: "boolean", default: false } },
  });
  const spec = JSON.parse(readFileSync(path.join(root, "series/signs", `${positionals[0]}.json`), "utf8"));
  for (const c of spec.chars) {
    if (existsSync(path.join(root, "public/local/hanzi", `${c}.json`))) continue;
    const got = spawnSync("node", [path.join(root, "scripts/character.mjs"), c], { stdio: "inherit" });
    if (got.status !== 0) (console.error(`no stroke data for ${c}`), process.exit(1));
  }
  const over = {
    layout: a.layout,
    size: a.size ? a.size.split("x").map(Number) : undefined,
    samples: a.samples ? Number(a.samples) : undefined,
    clip: a.clip,
  };
  let music;
  if (a.clip) {
    const row = JSON.parse(readFileSync(path.join(root, "series/hexagrams.json"), "utf8")).find((r) => r.number === spec.music.hexagram);
    music = row.music;
    const counts = spec.chars.map((c) => JSON.parse(readFileSync(path.join(root, "public/local/hanzi", `${c}.json`), "utf8")).strokes.length);
    const order = Object.fromEntries(Object.entries(spec.order ?? {}).map(([c, ids]) => [spec.chars.indexOf(c), ids]));
    over.timing = signTiming({ counts, order, bpm: music.bpm, labels: spec.labels.length, drop: music.drop });
  }
  for (const font of a.font ? [a.font] : spec.fonts) {
    const name = signName(spec, font, over);
    const out = path.join(root, "out/signs", name);
    // The still takes its real name only when Blender finishes.
    const partial = path.join(root, "out/signs/partial", name);
    mkdirSync(path.dirname(partial), { recursive: true });
    rmSync(partial, { force: true });
    const t0 = Date.now();
    const run = spawnSync(blender, ["-b", "--factory-startup", "--python-exit-code", "1", "-P", path.join(root, "blender/sign.py"), "--", ...signArgs(spec, root, font, partial, over)], {
      stdio: ["ignore", "ignore", "inherit"],
    });
    if (run.status !== 0 || !existsSync(partial)) (console.error(`Blender failed (exit ${run.status})`), process.exit(1));
    if (a.clip) {
      const frames = Number(
        execFileSync("ffprobe", ["-v", "error", "-count_frames", "-select_streams", "v:0", "-show_entries", "stream=nb_read_frames", "-of", "csv=p=0", partial], { encoding: "utf8" }).trim(),
      );
      const silent = partial.replace(/\.mp4$/, "-silent.mp4");
      if (!keepIfComplete({ partial, out: silent, frames, expected: over.timing.frames }))
        (console.error(`The render had ${frames} frames; expected ${over.timing.frames}.`), process.exit(1));
      const secs = over.timing.frames / 30;
      const mux = spawnSync("ffmpeg", [
        "-y", "-v", "error", "-i", silent, "-ss", over.timing.musicStart.toFixed(3), "-i", path.join(root, "public/local/music", music.file),
        "-filter_complex", `[1:a]atrim=duration=${secs.toFixed(3)},afade=t=in:st=0:d=1,afade=t=out:st=${(secs - 2).toFixed(3)}:d=2[a]`,
        "-map", "0:v", "-map", "[a]", "-c:v", "libx264", "-crf", "18", "-preset", "slow", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-shortest", out,
      ], { stdio: "inherit" });
      rmSync(silent, { force: true });
      if (mux.status !== 0) (console.error("ffmpeg failed"), process.exit(1));
    } else renameSync(partial, out);
    console.log(`wrote ${path.relative(root, out)} in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  }
}
