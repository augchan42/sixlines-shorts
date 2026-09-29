// scripts/terminal-data.mjs
// Builds the Godot terminal's inputs from the series data: data/hexagrams.json (committed),
// and, gitignored, the fonts (Pixel Operator; Noto Sans TC subset to the non-ASCII characters
// shown) and the sounds as .ogg (scripts/sfx.mjs).
//   node scripts/terminal-data.mjs
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { makeSfx } from "./sfx.mjs";

// Bottom-first lines of each trigram; what each does, as DOES in src/scenes/Readout.tsx.
const TRIGRAMS = {
  "111": { key: "qian", zh: "乾", name: "HEAVEN", does: "STRONG" },
  "000": { key: "kun", zh: "坤", name: "EARTH", does: "YIELDING" },
  "100": { key: "zhen", zh: "震", name: "THUNDER", does: "MOVING" },
  "010": { key: "kan", zh: "坎", name: "WATER", does: "SINKING" },
  "001": { key: "gen", zh: "艮", name: "MOUNTAIN", does: "STILL" },
  "011": { key: "xun", zh: "巽", name: "WIND", does: "ENTERING" },
  "101": { key: "li", zh: "離", name: "FIRE", does: "CLINGING" },
  "110": { key: "dui", zh: "兌", name: "LAKE", does: "JOYFUL" },
};
const BANNED = /oracle|divin|fortune|predict|mystical|magical|预测|預測|占卜|算命|神諭/i;
const strings = (e) => [e.zh, e.pinyin, e.pinyin.toUpperCase(), e.name, e.upper.zh, e.upper.name, e.upper.does, e.lower.zh, e.lower.name, e.lower.does, ...e.masters.flatMap((x) => [x.zh, x.en])];

export function buildTerminalData(hexagrams, masters) {
  const out = {};
  for (const h of [...hexagrams].sort((a, b) => a.number - b.number)) {
    const key = h.lines.join("");
    const e = {
      number: h.number, zh: h.zh, pinyin: h.pinyin, name: h.name.toUpperCase(), lines: h.lines,
      lower: TRIGRAMS[key.slice(0, 3)], upper: TRIGRAMS[key.slice(3)],
      masters: masters[h.number].masters.map(({ line, zh, en }) => ({ line, zh, en })),
    };
    for (const x of e.masters) if (!x.en) throw new Error(`${h.number} L${x.line}: a master needs English beside ${x.zh}`);
    for (const s of strings(e)) if (BANNED.test(s)) throw new Error(`${h.number}: banned word in "${s}"`);
    out[key] = e;
  }
  return out;
}

// Every non-ASCII character shown; Pixel Operator has ASCII only, so these fall back to Noto.
export const displayText = (data) => [...new Set(Object.values(data).flatMap(strings).join("").replace(/[\x00-\x7f]/g, ""))].join("");

// Noto Sans TC (SIL OFL), kept in public/local (gitignored); fetched once if missing.
export function notoSource(root) {
  const noto = path.join(root, "public/local/fonts/NotoSansTC-wght.ttf");
  if (!existsSync(noto)) {
    mkdirSync(path.dirname(noto), { recursive: true });
    execFileSync("curl", ["-sfL", "-o", noto, "https://github.com/google/fonts/raw/main/ofl/notosanstc/NotoSansTC%5Bwght%5D.ttf"]);
  }
  return noto;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = path.resolve(import.meta.dirname, "..");
  const godot = path.join(root, "godot/wangbi-terminal");
  const read = (p) => JSON.parse(readFileSync(path.join(root, p), "utf8"));
  const data = buildTerminalData(read("series/hexagrams.json"), read("series/wangbi-masters.json").hexagrams);
  mkdirSync(path.join(godot, "data"), { recursive: true });
  writeFileSync(path.join(godot, "data/hexagrams.json"), JSON.stringify(data, null, 1) + "\n");
  mkdirSync(path.join(godot, "fonts"), { recursive: true });
  copyFileSync(path.join(root, "public/fonts/PixelOperator-Bold.ttf"), path.join(godot, "fonts/PixelOperator-Bold.ttf"));
  // A character Noto lacks fails here.
  execFileSync("pyftsubset", [notoSource(root), `--text=${displayText(data)}`, "--no-ignore-missing-unicodes", `--output-file=${path.join(godot, "fonts/NotoSansTC-subset.ttf")}`]);
  for (const s of ["tick", "relay", "sweep", "warble", "winddown", "bed"]) makeSfx(s, path.join(godot, "sfx", `${s}.ogg`));
  console.log(`wrote ${Object.keys(data).length} hexagrams, fonts and sounds into godot/wangbi-terminal`);
}
