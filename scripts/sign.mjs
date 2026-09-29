// Renders a still neon sign (blender/sign.py) from series/signs/<name>.json: its characters
// traced in neon as the character lessons trace them, with label lines under them, once per
// label font the spec names.
//
//   node scripts/sign.mjs wuyue [--font pixel|goudy] [--layout stack|row] [--size 1920x1080] [--samples N]
// writes out/signs/wuyue-pixel.png, out/signs/wuyue-goudy.png (with --layout or --size, the
// name says so: out/signs/wuyue-goudy-row-1920x1080.png). Fetches missing stroke data first.
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
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
    "--out", out,
  ];
}

// out/signs/<name>-<font>[-<layout>][-<w>x<h>].png: the spec's own layout and size need no suffix.
export function signName(spec, font, over = {}) {
  const parts = [spec.name, font];
  if (over.layout && over.layout !== (spec.layout ?? "stack")) parts.push(over.layout);
  if (over.size && over.size.join("x") !== (spec.size ?? [1080, 1920]).join("x")) parts.push(over.size.join("x"));
  return `${parts.join("-")}.png`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const root = path.resolve(import.meta.dirname, "..");
  const { values: a, positionals } = parseArgs({
    allowPositionals: true,
    options: { font: { type: "string" }, layout: { type: "string" }, size: { type: "string" }, samples: { type: "string" } },
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
  };
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
    renameSync(partial, out);
    console.log(`wrote ${path.relative(root, out)} in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  }
}
