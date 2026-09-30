// Renders a short between its Goudy-on-ivory cards (src/templates/Bookend.tsx):
//   node scripts/bookend.mjs 02        (or a variant, 02-icon: series/bookend/02-icon.json)
// Reads series/bookend/NN.json; the short is out/series/NN-*/short.mp4 as rendered, copied to
// public/local/bookend/ (gitignored). Writes out/bookend/NN/ (bookend.mp4, share.mp4,
// manifest.json) and records the manifest in series/renders/bookend/NN.json. The sound is set to
// the series level (scripts/series/render-lib.mjs, PHONE_LUFS) as scripts/series.mjs does; the
// video is copied as rendered.
import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, createReadStream, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { limitedGain, limiterCeiling, phoneGain } from "./series/render-lib.mjs";

const root = path.resolve(import.meta.dirname, "..");
const nn = String(process.argv[2] ?? "02").padStart(2, "0");
const run = (cmd, args) => execFileSync(cmd, args, { cwd: root, encoding: "utf8", maxBuffer: 1 << 28 });
const sha256 = (f) => new Promise((ok) => { const h = createHash("sha256"); createReadStream(f).on("data", (d) => h.update(d)).on("end", () => ok(h.digest("hex"))); });

const propsFile = path.join(root, "series/bookend", `${nn}.json`);
const props = JSON.parse(readFileSync(propsFile, "utf8"));
const dirName = readdirSync(path.join(root, "out/series")).find((d) => d.startsWith(`${nn.split("-")[0]}-`));
const short = path.join(root, "out/series", dirName, "short.mp4");
mkdirSync(path.dirname(path.join(root, "public", props.src)), { recursive: true });
copyFileSync(short, path.join(root, "public", props.src));
const frames = Number(run("ffprobe", ["-v", "error", "-count_frames", "-select_streams", "v:0", "-show_entries", "stream=nb_read_frames", "-of", "default=nw=1:nk=1", short]).trim());
if (frames !== props.frames) throw new Error(`${path.relative(root, short)} has ${frames} frames; ${path.relative(root, propsFile)} says ${props.frames}`);
for (const s of Object.values(props.sfx ?? {})) if (typeof s === "string" && !existsSync(path.join(root, "public", s))) throw new Error(`missing public/${s}`);

const dir = path.join(root, "out/bookend", nn);
mkdirSync(dir, { recursive: true });
const raw = path.join(dir, "bookend.mp4");
const share = path.join(dir, "share.mp4");
run("npx", ["remotion", "render", "src/index.ts", "Bookend", raw, `--props=${propsFile}`, "--timeout=120000", "--log=error"]);

// As scripts/series.mjs's level(): measured above 250 Hz, a limiter first if the gain needs room.
const loudnormJson = (input, af) => {
  const { stderr } = spawnSync("ffmpeg", ["-nostdin", "-hide_banner", "-i", input, "-vn", "-af", `${af}loudnorm=print_format=json`, "-f", "null", "-"], { cwd: root, encoding: "utf8" });
  return JSON.parse(stderr.slice(stderr.lastIndexOf("{"), stderr.lastIndexOf("}") + 1));
};
const full = loudnormJson(raw, "");
const phone = loudnormJson(raw, "highpass=f=250,");
let gain = phoneGain(Number(phone.input_i));
const limiter = limiterCeiling(Number(full.input_tp), gain);
const pre = limiter === null ? "" : `alimiter=limit=${(10 ** (limiter / 20)).toFixed(4)}:attack=5:release=50:level=false,`;
if (pre) gain = limitedGain(Number(loudnormJson(raw, `${pre}highpass=f=250,`).input_i), Number(loudnormJson(raw, pre).input_tp));
run("ffmpeg", ["-v", "error", "-y", "-i", raw, "-c:v", "copy", "-af", `${pre}volume=${gain}dB`, "-ar", "48000", "-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart", share]);
const [outFull, outPhone] = [loudnormJson(share, ""), loudnormJson(share, "highpass=f=250,")];

const manifest = {
  short: path.relative(root, short),
  shortSha256: await sha256(short),
  props: path.relative(root, propsFile),
  sfx: Object.fromEntries(await Promise.all(Object.entries(props.sfx ?? {}).filter(([, s]) => typeof s === "string").map(async ([k, s]) => [k, { file: s, sha256: await sha256(path.join(root, "public", s)) }]))),
  seconds: Number(run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", share]).trim()),
  level: { gain, limiter, after: { lufs: Number(outFull.input_i), phoneLufs: Number(outPhone.input_i), dbtp: Number(outFull.input_tp) } },
  commit: run("git", ["rev-parse", "HEAD"]).trim(),
  clean: run("git", ["status", "--porcelain"]).trim() === "",
};
writeFileSync(path.join(dir, "manifest.json"), JSON.stringify(manifest, null, 1));
mkdirSync(path.join(root, "series/renders/bookend"), { recursive: true });
writeFileSync(path.join(root, "series/renders/bookend", `${nn}.json`), JSON.stringify(manifest, null, 1) + "\n");
console.log(`${path.relative(root, share)} (${manifest.seconds.toFixed(1)} s), phone ${manifest.level.after.phoneLufs} LUFS, peak ${manifest.level.after.dbtp} dBTP`);
