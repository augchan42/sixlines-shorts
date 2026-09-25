// Fetches a character's stroke data (Make Me a Hanzi, via hanzi-writer-data; Arphic Public
// License) to public/local/hanzi/, which is gitignored, for blender/character.py; or renders a
// hexagram's character lesson from its settings in series/characters.json.
//
//   node scripts/character.mjs 困 [井 ...]
//   node scripts/character.mjs --render 42 [--still FRAME] [--preview]
//       writes out/characters/42-益.mp4 (or 42-益-FRAME.png)
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { characterFlags } from "./character-args.mjs";

const root = path.resolve(import.meta.dirname, "..");
const dir = path.join(root, "public/local/hanzi");
const blender = process.env.BLENDER ?? "/Applications/Blender.app/Contents/MacOS/Blender";

async function fetchStrokes(ch) {
  mkdirSync(dir, { recursive: true });
  const res = await fetch(`https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/${encodeURIComponent(ch)}.json`);
  if (!res.ok) throw new Error(`${ch}: ${res.status}`);
  const data = await res.json();
  writeFileSync(path.join(dir, `${ch}.json`), JSON.stringify(data));
  console.log(`wrote public/local/hanzi/${ch}.json (${data.medians.length} strokes)`);
}

const { values: a, positionals } = parseArgs({
  allowPositionals: true,
  options: { render: { type: "string" }, still: { type: "string" }, preview: { type: "boolean", default: false } },
});

if (a.render) {
  const { characters } = JSON.parse(readFileSync(path.join(root, "series/characters.json"), "utf8"));
  const c = characters.find((x) => x.number === Number(a.render));
  if (!c) (console.error(`no character for hexagram ${a.render} in series/characters.json`), process.exit(1));
  const data = path.join(dir, `${c.char}.json`);
  if (!existsSync(data)) await fetchStrokes(c.char);
  const name = `${c.number}-${c.char}${a.still ? `-${a.still}` : ""}${a.preview ? "-preview" : ""}`;
  const out = path.join(root, "out/characters", `${name}.${a.still ? "png" : "mp4"}`);
  mkdirSync(path.dirname(out), { recursive: true });
  console.log(`rendering ${path.relative(root, out)}`);
  const run = spawnSync(
    blender,
    [
      "-b", "--factory-startup", "--python-exit-code", "1", "-P", path.join(root, "blender/character.py"), "--",
      "--data", data, "--bpm", String(c.bpm), "--beats", String(c.beats), "--out", out,
      ...characterFlags(c.args),
      ...(a.still ? ["--still", a.still] : []),
      ...(a.preview ? ["--preview"] : []),
    ],
    { stdio: ["ignore", "ignore", "inherit"] },
  );
  process.exit(run.status ?? 1);
} else {
  for (const ch of positionals) await fetchStrokes(ch);
}
