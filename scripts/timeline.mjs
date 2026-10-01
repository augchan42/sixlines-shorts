// Renders the corridor clips the timeline short asks for (blender/timeline.py): each page whose
// `show.clip` has a `scene` gets its clip at public/<clip.src> (public/local/ is gitignored).
// The dates on the floor are the script's `dates`, one per page; the pictures above them are its
// `pictures` (page -> names in public/local/timeline, from scripts/timeline-images.mjs).
//
//   node scripts/timeline.mjs [structure-timeline] [--pages 2,3] [--still 60] [--preview] [--force]
//
// A script whose pages' clips are `flight` gets one clip for the whole short instead, timed to the
// lesson's pages (scripts/lesson-plan.mjs on its full props): a fly-through that stops at each
// date while its page is on the screen.
//
// --still N writes frame N of each clip as a png beside it, to look at before a full render.
// A clip already there is kept unless --force. Set BLENDER if Blender is not in /Applications.
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { keepIfComplete } from "./blender-output.mjs";
import { lessonPlan } from "./lesson-plan.mjs";

// The Lesson composition and blender/layout.py both run at 30 fps.
const FPS = 30;

const root = path.resolve(import.meta.dirname, "..");
const blender = process.env.BLENDER ?? "/Applications/Blender.app/Contents/MacOS/Blender";
const argv = process.argv.slice(2);
const opt = (name) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : undefined);
const values = new Set([opt("--pages"), opt("--still")].filter(Boolean));
const name = argv.find((a) => !a.startsWith("--") && !values.has(a)) ?? "structure-timeline";
const only = opt("--pages")?.split(",").map(Number);
const still = opt("--still") !== undefined ? Number(opt("--still")) : undefined;
const script = JSON.parse(readFileSync(path.join(root, "series/explainers", `${name}.json`), "utf8"));
const pages = script.chapters.flatMap((c) => c.pages).filter((p) => !p.chapter);

const flight = pages.find((p) => p.show?.clip?.flight)?.show.clip;
const jobs = [];
if (flight) {
  // The full props, as the full render will have them.
  execFileSync("node", [path.join(root, "scripts/explainer.mjs"), name, "--props-only"], { cwd: root });
  const plan = await lessonPlan(JSON.parse(readFileSync(path.join(root, "series/explainers", `${name}.props.json`), "utf8")));
  jobs.push({ label: "flight", clip: flight, frames: plan.end, scene: { flight: plan.pages.filter((t) => !t.chapter), frames: plan.end } });
} else {
  for (const [i, page] of pages.entries()) {
    const clip = page.show?.clip;
    if (!clip?.scene || (only && !only.includes(i + 1))) continue;
    jobs.push({ label: `page ${i + 1}`, clip, frames: Math.round(clip.scene.secs * FPS), scene: clip.scene });
  }
}

for (const { label, clip, frames: expected, scene: jobScene } of jobs) {
  const out = path.join(root, "public", clip.src);
  const target = still !== undefined ? out.replace(/\.mp4$/, `-${still}.png`) : out;
  if (existsSync(target) && !argv.includes("--force")) {
    console.log(`${label}: ${path.relative(root, target)} is there (--force to render again)`);
    continue;
  }
  const scene = { ...jobScene, dates: script.dates, pictures: script.pictures ?? {}, pictures_dir: path.join(root, "public/local/timeline") };
  const sceneFile = path.join(root, "out", "timeline", `${path.basename(out, ".mp4")}.json`);
  const partial = path.join(root, "out", "timeline", path.basename(target));
  mkdirSync(path.dirname(sceneFile), { recursive: true });
  writeFileSync(sceneFile, JSON.stringify(scene));
  rmSync(partial, { force: true });
  console.log(`${label}: rendering ${path.relative(root, target)}`);
  const run = spawnSync(
    blender,
    ["-b", "--factory-startup", "--python-exit-code", "1", "-P", path.join(root, "blender/timeline.py"), "--", "--scene", sceneFile, "--out", partial, ...(still !== undefined ? ["--still", String(still)] : []), ...(argv.includes("--preview") ? ["--preview"] : [])],
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
    if (!keepIfComplete({ partial, out, frames, expected })) {
      console.error(`The render had ${frames} frames; expected ${expected}. Log: ${path.relative(root, log)}`);
      process.exit(1);
    }
  }
  console.log(`wrote ${path.relative(root, target)}`);
}
