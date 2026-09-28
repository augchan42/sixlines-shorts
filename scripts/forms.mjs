// Renders a character through its scripts (blender/forms.py) from series/forms/<char>.json:
// the older forms from scripts/ancient-forms.mjs, the kaishu from Make Me a Hanzi
// (scripts/character.mjs), each with its label.
//
//   node scripts/forms.mjs 馬 [--still FRAME] [--preview]
// writes out/forms/馬.mp4 (or out/forms/馬-FRAME.png). Fetch the data first:
//   node scripts/character.mjs 馬 && node scripts/ancient-forms.mjs 馬
import { existsSync, mkdirSync, readFileSync, rmSync, renameSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { parseArgs } from "node:util";

const blender = process.env.BLENDER ?? "/Applications/Blender.app/Contents/MacOS/Blender";

// blender/forms.py's arguments: forms oldest first, labels "|"-separated with "\n" kept escaped.
export function formsArgs(spec, root, out) {
  const data = spec.forms.map((f) =>
    f.hanzi ? path.join(root, "public/local/hanzi", `${spec.char}.json`) : path.join(root, "public/local/ancient", `${spec.char}-${f.key}.json`),
  );
  for (const f of spec.forms) if (f.label.includes("|")) throw new Error(`label for ${f.key} holds "|"`);
  const labels = spec.forms.map((f) => f.label.replaceAll("\n", "\\n")).join("|");
  return [
    "--forms", data.join(","), "--labels", labels, "--pixel", path.join(root, "public/fonts/PixelOperator-Bold.ttf"),
    "--bpm", String(spec.bpm), "--per", String(spec.per ?? 4), "--hold", String(spec.hold ?? 6), "--edge", spec.edge ?? "#ff6a3d", "--out", out,
  ];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const root = path.resolve(import.meta.dirname, "..");
  const { values: a, positionals } = parseArgs({ options: { still: { type: "string" }, preview: { type: "boolean" } }, allowPositionals: true });
  const char = positionals[0];
  const spec = JSON.parse(readFileSync(path.join(root, "series/forms", `${char}.json`), "utf8"));
  const name = a.still ? `${char}-${a.still}.png` : `${char}.mp4`;
  const out = path.join(root, "out/forms", name);
  // The clip takes its real name only when Blender finishes.
  const partial = path.join(root, "out/forms/partial", name);
  mkdirSync(path.dirname(partial), { recursive: true });
  rmSync(partial, { force: true });
  const extra = [...(a.still ? ["--still", a.still] : []), ...(a.preview ? ["--preview"] : [])];
  const run = spawnSync(blender, ["-b", "--factory-startup", "--python-exit-code", "1", "-P", path.join(root, "blender/forms.py"), "--", ...formsArgs(spec, root, partial), ...extra], {
    stdio: ["ignore", "ignore", "inherit"],
  });
  if (run.status !== 0 || !existsSync(partial)) (console.error(`Blender failed (exit ${run.status})`), process.exit(1));
  renameSync(partial, out);
  console.log(`wrote ${path.relative(root, out)}`);
}
