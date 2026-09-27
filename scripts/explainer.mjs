// Renders an explainer (series/explainers/<name>.json; readout-key by default):
//   node scripts/explainer.mjs [name]
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
const name = process.argv[2] ?? "readout-key";
const script = JSON.parse(readFileSync(path.join(root, "series/explainers", `${name}.json`), "utf8"));
const rows = JSON.parse(readFileSync(path.join(root, "series/hexagrams.json"), "utf8"));
const row = rows.find((r) => r.number === script.hexagram);
const sp = seriesProps(row, overrides[row.number]);
if (!sp.lesson?.readout) throw new Error(`hexagram ${row.number} has no readout lesson`);

const props = {
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

const commit = run("git", ["rev-parse", "HEAD"]).trim();
const clean = run("git", ["status", "--porcelain"]).trim() === "";
const inputs = [props.music, props.endcard.clip];
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
run("npx", ["remotion", "render", "src/index.ts", "ReadoutKey", short, `--props=${propsFile}`, "--log=error"]);

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
