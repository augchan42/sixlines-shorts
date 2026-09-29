// scripts/terminal-assets.mjs
// Builds the plain web Wang Bi terminal's generated inputs (spec: docs/superpowers/specs/
// 2026-09-29-plain-web-terminal.md) into a directory: data/hexagrams.json (the Godot build's,
// as is), both fonts as woff2 (Pixel Operator; the Noto Sans TC subset to the characters shown)
// and the sounds as .ogg and .m4a (scripts/sfx.mjs). The page itself now lives in sixlines-site
// (terminal/), which commits this output as an input at terminal/assets/ and builds the page
// with it (`pnpm terminal:build` there) — see that directory's README.
//   npm run terminal:assets [out-dir]
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { displayText, notoSource } from "./terminal-data.mjs";
import { makeSfx } from "./sfx.mjs";

const root = path.resolve(import.meta.dirname, "..");
export const SOUNDS = ["tick", "relay", "sweep", "warble", "winddown", "bed"];
// AAC for Safari; the .ogg keeps the Godot build's own encoding.
const AAC = ["-c:a", "aac", "-b:a", "48k"];
export const DEFAULT_OUT = path.join(homedir(), "projects/sixlines-site/terminal/assets");

export const files = (dir) =>
  readdirSync(dir, { recursive: true })
    .map((f) => path.join(dir, f))
    .filter((f) => statSync(f).isFile());

// The Noto subset the Godot build draws with: its default (lightest) instance, as Godot uses a
// variable font without set variations, cut to the characters shown.
function notoWoff2(out, text) {
  const tmp = mkdtempSync(path.join(tmpdir(), "noto-"));
  const subset = path.join(tmp, "subset.ttf");
  execFileSync("pyftsubset", [notoSource(root), `--text=${text}`, "--no-ignore-missing-unicodes", `--output-file=${subset}`]);
  execFileSync("python3", ["-c", [
    "import sys",
    "from fontTools.ttLib import TTFont",
    "from fontTools.varLib.instancer import instantiateVariableFont",
    "f = TTFont(sys.argv[1])",
    "f = instantiateVariableFont(f, {a.axisTag: a.defaultValue for a in f['fvar'].axes})",
    "f.flavor = 'woff2'",
    "f.save(sys.argv[2])",
  ].join("\n"), subset, out]);
  rmSync(tmp, { recursive: true });
}

function woff2(src, out) {
  execFileSync("python3", ["-c", "import sys\nfrom fontTools.ttLib import TTFont\nf = TTFont(sys.argv[1])\nf.flavor = 'woff2'\nf.save(sys.argv[2])", src, out]);
}

export async function buildAssets(out = DEFAULT_OUT) {
  rmSync(out, { recursive: true, force: true });
  for (const d of ["data", "fonts", "sfx"]) mkdirSync(path.join(out, d), { recursive: true });
  const dataFile = path.join(root, "godot/wangbi-terminal/data/hexagrams.json");
  copyFileSync(dataFile, path.join(out, "data/hexagrams.json"));
  woff2(path.join(root, "public/fonts/PixelOperator-Bold.ttf"), path.join(out, "fonts/PixelOperator-Bold.woff2"));
  notoWoff2(path.join(out, "fonts/NotoSansTC-subset.woff2"), displayText(JSON.parse(readFileSync(dataFile, "utf8"))));
  for (const s of SOUNDS) {
    makeSfx(s, path.join(out, "sfx", `${s}.ogg`));
    makeSfx(s, path.join(out, "sfx", `${s}.m4a`), AAC);
  }
  const all = files(out);
  const raw = all.reduce((n, f) => n + statSync(f).size, 0);
  return { out, files: all, raw };
}

async function main() {
  const { out, files: all, raw } = await buildAssets(process.argv[2] ? path.resolve(process.argv[2]) : undefined);
  const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
  for (const f of all) console.log(`${kb(statSync(f).size).padStart(9)}  ${path.relative(out, f)}`);
  console.log(`total ${kb(raw)} in ${out}`);
}
if (process.argv[1] === fileURLToPath(import.meta.url)) main();
