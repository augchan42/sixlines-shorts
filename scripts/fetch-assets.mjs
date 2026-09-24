// Copies the app icon from ../sixlines-ios, and downloads the Matrix-skin app
// screenshots from the sixlines.online/tour gallery and the stipple hexagram art
// (the Matrix skin's artwork) from the CDN, into public/assets/ (gitignored). Also
// downloads the reference shorts made in CapCut to public/local/shorts/ (gitignored,
// since their soundtracks are commercial tracks), skipping any already there.
//
//   npm run assets
//   npm run assets -- --music ~/Downloads/some-short.mov   # also extract a music track to public/local/

import { execFileSync } from "node:child_process";
import { access, copyFile, mkdir, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const ios = process.env.SIXLINES_IOS ?? path.resolve(root, "../sixlines-ios");
const out = path.join(root, "public/assets");
const cdn = "https://cdn.sixlines.online";

const copies = {
  "icon.png": "Resources/brand/sixlines-logo-1024.png",
};

// The "Matrix" world of sixlines.online/tour (manifest: sixlines-site
// src/data/tour-manifest.json). Each frame is a 1320×2868 iPhone screenshot under a
// 369px caption header, which is cropped off.
const tour = "tour/2026-09c/matrix";
const TOUR_HEADER = 369;
const screens = {
  "matrix-reading.png": "03_Reading",
  "matrix-verse.png": "03_ReadingVerse",
  "matrix-ask.png": "02_Ask",
  "matrix-records.png": "06_RecordsStorefront",
  "matrix-today.png": "tour_almanac",
  "matrix-journal.png": "tour_journal",
  "matrix-yilin-1-1.png": "yilin-matrix-1-1",
  "matrix-yilin-1-9.png": "yilin-matrix-1-9",
};

// The CapCut shorts the compositions recreate. File names carry the date and time each
// was first sent.
const shorts = ["2026-09-23-1944-short.mp4", "2026-09-23-2040-short.mp4"];

// Stipple Yilin plates, all 64 for each hexagram given with --hexagram (default 1).
// Keys are "{hexagram}-{changed hexagram}".
const hexFlag = process.argv.indexOf("--hexagram");
const hexagrams = hexFlag === -1 ? [1] : process.argv[hexFlag + 1].split(",").map(Number);
const downloads = Object.fromEntries(
  hexagrams.flatMap((h) =>
    Array.from({ length: 64 }, (_, i) => [`yilin/stipple-${h}-${i + 1}.webp`, `yilin-stipple/${h}-${i + 1}.webp`]),
  ),
);

await mkdir(path.join(out, "yilin"), { recursive: true });

for (const [name, rel] of Object.entries(copies)) {
  const src = path.join(ios, rel);
  try {
    await access(src);
  } catch {
    throw new Error(`Missing ${src}. Set SIXLINES_IOS to your sixlines-ios checkout.`);
  }
  await copyFile(src, path.join(out, name));
  console.log(`copied   ${name}`);
}

for (const [name, key] of Object.entries(downloads)) {
  try {
    await access(path.join(out, name));
    console.log(`present  ${name}`);
    continue;
  } catch {}
  const res = await fetch(`${cdn}/${key}`);
  if (!res.ok) throw new Error(`${res.status} fetching ${cdn}/${key}`);
  await writeFile(path.join(out, name), Buffer.from(await res.arrayBuffer()));
  console.log(`fetched  ${name}`);
}

for (const [name, stop] of Object.entries(screens)) {
  try {
    await access(path.join(out, name));
    console.log(`present  ${name}`);
    continue;
  } catch {}
  const url = `${cdn}/${tour}/${stop}.webp`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} fetching ${url}`);
  const tmp = path.join(out, `.${stop}.webp`);
  await writeFile(tmp, Buffer.from(await res.arrayBuffer()));
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", tmp, "-vf", `crop=iw:ih-${TOUR_HEADER}:0:${TOUR_HEADER}`, path.join(out, name)]);
  await rm(tmp);
  console.log(`fetched  ${name}`);
}

const shortsDir = path.join(root, "public/local/shorts");
await mkdir(shortsDir, { recursive: true });
for (const name of shorts) {
  const dest = path.join(shortsDir, name);
  try {
    await access(dest);
    console.log(`present  local/shorts/${name}`);
    continue;
  } catch {}
  const res = await fetch(`${cdn}/shorts/${name}`);
  if (!res.ok) throw new Error(`${res.status} fetching ${cdn}/shorts/${name}`);
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
  console.log(`fetched  local/shorts/${name}`);
}

const musicFlag = process.argv.indexOf("--music");
if (musicFlag !== -1) {
  const src = process.argv[musicFlag + 1].replace(/^~/, homedir());
  const dir = path.join(root, "public/local");
  await mkdir(dir, { recursive: true });
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", src, "-vn", "-c:a", "aac", "-b:a", "192k", path.join(dir, "music.m4a")]);
  console.log("extracted public/local/music.m4a");
}
