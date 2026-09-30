// Renders the cube clips a structure short asks for (blender/hypercube.py): each page whose
// `show.clip` has a `scene` gets its clip at public/<clip.src> (public/local/ is gitignored).
// The corners and edges come from src/lib/cube.ts, where they are tested.
//
//   node scripts/hypercube.mjs [structure-cube] [--pages 2,3] [--still 150] [--preview] [--force]
//
// --still N writes frame N of each clip as a png beside it, to look at before a full render.
// A clip already there is kept unless --force. Set BLENDER if Blender is not in /Applications.
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { corners, edges, pathTimes } from "../src/lib/cube.ts";
import { keepIfComplete } from "./blender-output.mjs";

// The Lesson composition and blender/layout.py both run at 30 fps.
const FPS = 30;

const root = path.resolve(import.meta.dirname, "..");
const blender = process.env.BLENDER ?? "/Applications/Blender.app/Contents/MacOS/Blender";
const argv = process.argv.slice(2);
const opt = (name) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : undefined);
const values = new Set([opt("--pages"), opt("--still")].filter(Boolean));
const name = argv.find((a) => !a.startsWith("--") && !values.has(a)) ?? "structure-cube";
const only = opt("--pages")?.split(",").map(Number);
const still = opt("--still") !== undefined ? Number(opt("--still")) : undefined;
const script = JSON.parse(readFileSync(path.join(root, "series/explainers", `${name}.json`), "utf8"));
const pages = script.chapters.flatMap((c) => c.pages).filter((p) => !p.chapter);

const points = corners();
const lines = edges();
for (const [i, page] of pages.entries()) {
  const clip = page.show?.clip;
  if (!clip?.scene || (only && !only.includes(i + 1))) continue;
  const out = path.join(root, "public", clip.src);
  const target = still !== undefined ? out.replace(/\.mp4$/, `-${still}.png`) : out;
  if (existsSync(target) && !argv.includes("--force")) {
    console.log(`page ${i + 1}: ${path.relative(root, target)} is there (--force to render again)`);
    continue;
  }
  const scene = { ...clip.scene, points, edges: lines, times: pathTimes(clip.scene) };
  const sceneFile = path.join(root, "out", "hypercube", `${path.basename(out, ".mp4")}.json`);
  const partial = path.join(root, "out", "hypercube", path.basename(target));
  mkdirSync(path.dirname(sceneFile), { recursive: true });
  writeFileSync(sceneFile, JSON.stringify(scene));
  rmSync(partial, { force: true });
  console.log(`page ${i + 1}: rendering ${path.relative(root, target)}`);
  const run = spawnSync(
    blender,
    ["-b", "--factory-startup", "--python-exit-code", "1", "-P", path.join(root, "blender/hypercube.py"), "--", "--scene", sceneFile, "--out", partial, ...(still !== undefined ? ["--still", String(still)] : []), ...(argv.includes("--preview") ? ["--preview"] : [])],
    { encoding: "utf8", maxBuffer: 1 << 28 },
  );
  const log = partial.replace(/\.(mp4|png)$/, ".log");
  writeFileSync(log, `${run.stdout ?? ""}\n${run.stderr ?? ""}`);
  if (run.status !== 0 || !existsSync(partial)) {
    console.error(`Blender failed (exit ${run.status}). Log: ${path.relative(root, log)}`);
    process.exit(1);
  }
  if (still !== undefined) {
    mkdirSync(path.dirname(target), { recursive: true });
    execFileSync("mv", [partial, target]);
  } else {
    const frames = Number(execFileSync("ffprobe", ["-v", "error", "-count_frames", "-select_streams", "v:0", "-show_entries", "stream=nb_read_frames", "-of", "csv=p=0", partial], { encoding: "utf8" }).trim());
    const expected = Math.round(clip.scene.secs * FPS);
    if (!keepIfComplete({ partial, out, frames, expected })) {
      console.error(`The render had ${frames} frames; expected ${expected}. Log: ${path.relative(root, log)}`);
      process.exit(1);
    }
  }
  console.log(`wrote ${path.relative(root, target)}`);
}
