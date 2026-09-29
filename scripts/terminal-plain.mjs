// scripts/terminal-plain.mjs
// Builds the Wang Bi terminal as a plain web page (spec: docs/superpowers/specs/
// 2026-09-29-plain-web-terminal.md) into web/terminal/build/: the page, one minified module,
// the data as the Godot build reads it, both fonts as woff2 and the sounds as .ogg and .m4a.
//   npm run terminal:plain
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { build } from "esbuild";
import { makeSfx } from "./sfx.mjs";
import { displayText, notoSource } from "./terminal-data.mjs";

const root = path.resolve(import.meta.dirname, "..");
export const SOUNDS = ["tick", "relay", "sweep", "warble", "winddown", "bed"];
// AAC for Safari; the .ogg keeps the Godot build's own encoding.
const AAC = ["-c:a", "aac", "-b:a", "48k"];

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

export async function buildPlain(out = path.join(root, "web/terminal/build")) {
  rmSync(out, { recursive: true, force: true });
  for (const d of ["data", "fonts", "sfx"]) mkdirSync(path.join(out, d), { recursive: true });
  await build({ entryPoints: [path.join(root, "web/terminal/main.js")], bundle: true, minify: true, format: "esm", target: "es2020", outfile: path.join(out, "main.js"), logLevel: "warning" });
  copyFileSync(path.join(root, "web/terminal/index.html"), path.join(out, "index.html"));
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
  const gzip = all.reduce((n, f) => n + gzipSync(readFileSync(f), { level: 9 }).length, 0);
  return { out, files: all, raw, gzip };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { out, files: all, raw, gzip } = await buildPlain();
  const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
  for (const f of all) console.log(`${kb(statSync(f).size).padStart(9)}  ${path.relative(out, f)}`);
  console.log(`total ${kb(raw)} raw, ${kb(gzip)} gzipped, in ${path.relative(root, out)}`);
}
