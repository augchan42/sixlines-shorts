// Fetches the app screens every short shares from the sixlines-site tour (its Matrix frames,
// listed in src/data/tour-manifest.json) into public/assets/screens/tour/, cropping off the
// tour's title band so each is the plain 1320×2868 capture like the hexagram screens.
//
//   node scripts/series-tour.mjs        (SIXLINES_SITE defaults to ../sixlines-site)
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const site = process.env.SIXLINES_SITE ?? path.resolve(root, "../sixlines-site");
const manifest = JSON.parse(readFileSync(path.join(site, "src/data/tour-manifest.json"), "utf8"));
const out = path.join(root, "public/assets/screens/tour");
const HEIGHT = 2868;

// Our name for each screen (src/series/props.ts SHARED), and the tour stop it comes from.
const STOPS = { ask: "02_Ask", dates: "05_DateFinder", prove: "05_GuaFalsification", archive: "06_RecordsStorefront" };

mkdirSync(out, { recursive: true });
for (const [name, stop] of Object.entries(STOPS)) {
  const frame = manifest.frames.find((f) => f.appearance === "matrix" && f.stop === stop);
  if (!frame) throw new Error(`no matrix frame for ${stop} in tour ${manifest.slug}`);
  const res = await fetch(frame.url);
  if (!res.ok) throw new Error(`${frame.url}: ${res.status}`);
  const webp = path.join(out, `${name}.webp`);
  writeFileSync(webp, Buffer.from(await res.arrayBuffer()));
  const [w, h] = execFileSync("ffprobe", ["-v", "error", "-show_entries", "stream=width,height", "-of", "csv=p=0", webp], { encoding: "utf8" })
    .trim().split(",").map(Number);
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", webp, "-vf", `crop=${w}:${HEIGHT}:0:${h - HEIGHT}`, path.join(out, `${name}.png`)]);
  rmSync(webp);
  console.log(`wrote public/assets/screens/tour/${name}.png from ${manifest.slug} ${stop}`);
}
