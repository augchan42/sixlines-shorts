// Renders series shorts: npm run series -- 29 | 2,52 | all
// or a special, a one-off short on a hexagram with its own copy (series/specials/NAME.json,
// {hexagram, copy}), which leaves the hexagram's series short alone:
//   npm run series -- --special mid-autumn-2026
// A special renders to out/specials/NAME/ and records to series/renders/specials/.
// Per short, out/series/NN-pinyin/ gets short.mp4, share.mp4, caption.txt, props.json and
// manifest.json; the manifest and caption are also copied to series/renders/ for committing.
// An earlier render there moves to out/series/versions/NN-pinyin/<time>-<commit>/ first.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { overrides } from "../src/series/overrides.ts";
import { seriesProps } from "../src/series/props.ts";
import { postCaption } from "./series/caption.mjs";
import { missingAssets, parseNumbers, renderAll, shareBitrate, slug, versionDir } from "./series/render-lib.mjs";

const root = path.resolve(import.meta.dirname, "..");
const pub = (f) => path.join(root, "public", f);
const sha256 = (f) => createHash("sha256").update(readFileSync(pub(f))).digest("hex");
const shaAbs = (f) => createHash("sha256").update(readFileSync(f)).digest("hex");
const run = (cmd, args) => execFileSync(cmd, args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const rows = JSON.parse(readFileSync(path.join(root, "series/hexagrams.json"), "utf8"));
const special = process.argv[2] === "--special" ? process.argv[3] : null;
const specialFile = special && path.join(root, "series/specials", `${special}.json`);
const wanted = special ? [JSON.parse(readFileSync(specialFile, "utf8")).hexagram] : parseNumbers(process.argv[2]);
const numbers = wanted === "all" ? rows.filter((r) => r.copy).map((r) => r.number) : wanted;
// Read once, before any render writes series/renders/, so every hexagram in this run
// records the commit and cleanliness of the tree it was actually rendered from.
const commit = run("git", ["rev-parse", "HEAD"]).trim();
const clean = run("git", ["status", "--porcelain"]).trim() === "";

const renderOne = async (n) => {
  const found = rows.find((r) => r.number === n);
  const row = special ? { ...found, copy: JSON.parse(readFileSync(specialFile, "utf8")).copy } : found;
  const props = seriesProps(row, special ? {} : overrides[n]);
  const problems = missingAssets(props, row, { exists: (f) => existsSync(pub(f)), sha256 });
  if (problems.length) throw new Error(problems.join("\n  "));

  const nn = String(n).padStart(2, "0");
  const name = special ?? `${nn}-${slug(row.pinyin)}`;
  const outBase = special ? "out/specials" : "out/series";
  const records = path.join(root, special ? "series/renders/specials" : "series/renders");
  const record = special ?? nn;
  const dir = path.join(root, outBase, name);
  // Keep the earlier render rather than overwrite it.
  if (existsSync(path.join(dir, "manifest.json"))) {
    const kept = path.join(root, versionDir(outBase, name, JSON.parse(readFileSync(path.join(dir, "manifest.json"), "utf8"))));
    mkdirSync(path.dirname(kept), { recursive: true });
    renameSync(dir, kept);
    console.log(`[${n}] kept the earlier render in ${path.relative(root, kept)}`);
  }
  mkdirSync(dir, { recursive: true });
  const propsFile = path.join(dir, "props.json");
  writeFileSync(propsFile, JSON.stringify(props, null, 1));
  const short = path.join(dir, "short.mp4");
  const share = path.join(dir, "share.mp4");
  console.log(`[${n}] rendering`);
  run("npx", ["remotion", "render", "src/index.ts", "Series", short, `--props=${propsFile}`, "--log=error"]);

  const seconds = Number(run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", short]).trim());
  const kbps = shareBitrate(seconds);
  const enc = (pass, out) => [
    "-v", "error", "-y", "-i", short, "-vf", "scale=in_range=full:out_range=tv,format=yuv420p",
    "-c:v", "libx264", "-b:v", `${kbps}k`, "-pass", String(pass), "-passlogfile", path.join(dir, "x264"),
    ...(pass === 1 ? ["-an", "-f", "mp4", out] : ["-c:a", "aac", "-b:a", "128k", "-ar", "44100", "-movflags", "+faststart", out]),
  ];
  run("ffmpeg", enc(1, "/dev/null"));
  run("ffmpeg", enc(2, share));

  const caption = postCaption(row);
  writeFileSync(path.join(dir, "caption.txt"), caption);
  const files = Object.fromEntries(
    [props.music, `local/music/certificates/${row.music.certificate.file}`, props.hexagramClip, props.endcard.clip, ...props.screens.map((s) => s.src), ...(props.lesson?.screen ? [props.lesson.screen.src] : []), ...(props.lesson?.painting ? [props.lesson.painting.src] : []), ...props.plates].map((f) => [f, sha256(f)]),
  );
  files[`${outBase}/${name}/short.mp4`] = shaAbs(short);
  files[`${outBase}/${name}/share.mp4`] = shaAbs(share);
  const manifest = { hexagram: n, ...(special ? { special } : {}), rendered: new Date().toISOString(), commit, clean, seconds, shareKbps: kbps, props, files };
  writeFileSync(path.join(dir, "manifest.json"), `${JSON.stringify(manifest, null, 1)}\n`);
  mkdirSync(records, { recursive: true });
  copyFileSync(path.join(dir, "manifest.json"), path.join(records, `${record}.json`));
  copyFileSync(path.join(dir, "caption.txt"), path.join(records, `${record}.txt`));
  console.log(`[${n}] ${path.relative(root, share)} (${seconds.toFixed(1)} s)`);
};

const { done, failures } = await renderAll(numbers, renderOne);
console.log(`rendered ${done.length} of ${numbers.length}`);
for (const f of failures) console.error(`hexagram ${f.n}:\n  ${f.message}`);
if (failures.length) process.exit(1);
