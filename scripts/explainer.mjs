// Renders an explainer (series/explainers/<name>.json; readout-key by default):
//   node scripts/explainer.mjs [name]
// A script with chapters (wangbi-lesson) is the Lesson composition; otherwise ReadoutKey.
// Its props are built from the script and the example hexagram's series props (music, end
// card, readout) and written to series/explainers/<name>.props.json, which the studio opens.
// out/explainers/<name>/ gets short.mp4, share.mp4, caption.txt and manifest.json; the
// manifest is copied to series/renders/explainers/<name>.json. An earlier render moves to
// out/explainers/versions/<name>/<time>-<commit>/ first.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { overrides } from "../src/series/overrides.ts";
import { seriesProps } from "../src/series/props.ts";
import { shareBitrate, versionDir } from "./series/render-lib.mjs";

const root = path.resolve(import.meta.dirname, "..");
const pub = (f) => path.join(root, "public", f);
const shaAbs = (f) => createHash("sha256").update(readFileSync(f)).digest("hex");
const run = (cmd, args) => execFileSync(cmd, args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const name = process.argv.slice(2).find((a) => !a.startsWith("--")) ?? "readout-key";
const script = JSON.parse(readFileSync(path.join(root, "series/explainers", `${name}.json`), "utf8"));
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
const readout = (n) => {
  const p = seriesProps(rows.find((x) => x.number === n), overrides[n]);
  return { ...hexagram(n), trigrams: p.lesson.trigrams, text: p.lesson.text, ...p.lesson.readout };
};

// The teletype tick: a short decaying click, 25 a second (one per typed character), generated.
const ticks = "local/sfx/teletype.wav";
if (!existsSync(pub(ticks))) {
  mkdirSync(path.dirname(pub(ticks)), { recursive: true });
  run("ffmpeg", ["-v", "error", "-y", "-f", "lavfi", "-i", "aevalsrc=0.3*sin(2*PI*1900*t)*exp(-mod(t\\,0.04)*350):s=44100:d=20", pub(ticks)]);
}

// The flight look's machine sounds (docs/research/2026-09-27-nostromo-screens.md), generated:
// a hum (mains and its overtones over brown noise), a relay's click-clack, a printer's chatter.
const sfx = { hum: "local/sfx/hum.wav", relay: "local/sfx/relay.wav", printer: "local/sfx/printer.wav" };
const makeSfx = {
  hum: ["-f", "lavfi", "-i", "anoisesrc=color=brown:amplitude=0.5:d=30:r=44100", "-f", "lavfi", "-i", "aevalsrc=0.22*sin(2*PI*50*t)+0.12*sin(2*PI*100*t)+0.04*sin(2*PI*150*t):s=44100:d=30", "-filter_complex", "[0]lowpass=f=180[n];[n][1]amix=inputs=2:normalize=0,afade=t=in:d=0.5,volume=0.8"],
  relay: ["-f", "lavfi", "-i", "aevalsrc=(random(0)*2-1)*(0.9*exp(-t*260)+0.6*gte(t\\,0.035)*exp(-(t-0.035)*300)):s=44100:d=0.15", "-af", "highpass=f=700,lowpass=f=6000"],
  printer: ["-f", "lavfi", "-i", "aevalsrc=(random(0)*2-1)*0.5*exp(-mod(t\\,0.022)*420)*(0.7+0.3*sin(2*PI*2.5*t)):s=44100:d=12", "-af", "bandpass=f=2200:width_type=h:w=1800"],
};
if (script.look === "flight")
  for (const [k, f] of Object.entries(sfx))
    if (!existsSync(pub(f))) {
      mkdirSync(path.dirname(pub(f)), { recursive: true });
      run("ffmpeg", ["-v", "error", "-y", ...makeSfx[k], pub(f)]);
    }

const lesson = script.chapters && {
  pages: script.chapters.flatMap((c) => [...(c.page ? [{ chapter: c.page }] : []), ...c.pages.map(({ q, a, show }) => ({ q, a, show }))]),
  hexagrams: Object.fromEntries([...new Set(script.chapters.flatMap((c) => c.pages.flatMap((p) => [p.show?.hex, ...(p.show?.small ?? [])])).filter((n) => typeof n === "number"))].map((n) => [n, hexagram(n)])),
  readouts: Object.fromEntries([...new Set(script.chapters.flatMap((c) => c.pages.flatMap((p) => (p.show?.full ?? []).map((f) => f.n))))].map((n) => [n, readout(n)])),
  // "music": null leaves only the machine sounds; "mix" sets their volumes.
  music: script.music ? `local/music/${script.music.file}` : null,
  musicStart: script.music?.start ?? 0,
  ...(script.mix ? { mix: script.mix } : {}),
  ticks,
  // A test clip of a page or two has no end card.
  endcard: { clip: sp.endcard.clip, seconds: script.endcard === false ? 0 : (9 * 60) / sp.bpm },
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
const inputs = [...(props.music ? [props.music] : []), props.endcard.clip, ...(lesson ? [ticks] : []), ...(props.sfx ? Object.values(props.sfx) : [])];
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
  // The screen as a tube: rendered flat, then bowed out a little and given a soft bloom.
  const flat = path.join(dir, "flat.mp4");
  run("npx", ["remotion", "render", "src/index.ts", "Lesson", flat, `--props=${propsFile}`, "--log=error"]);
  run("ffmpeg", ["-v", "error", "-y", "-i", flat, "-filter_complex", "[0:v]format=gbrp,lenscorrection=k1=-0.06:k2=-0.02,split[a][b];[b]gblur=sigma=14[g];[a][g]blend=all_mode=screen:all_opacity=0.35,gblur=sigma=0.7,format=yuv420p[v]", "-map", "[v]", "-map", "0:a", "-af", "loudnorm=I=-16:TP=-1.5", "-ar", "48000", "-c:v", "libx264", "-crf", "14", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "256k", short]);
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
