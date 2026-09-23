// Copies the app icon from ../sixlines-ios, and downloads the Matrix-skin app
// screenshots from the sixlines.online/tour gallery and the stipple hexagram art
// (the Matrix skin's artwork) from the CDN, into public/assets/ (gitignored).
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

// Yilin art keys are "{hexagram}-{changed hexagram}".
const downloads = Object.fromEntries(
  ["1-1", "1-2", "1-3", "1-5", "1-9"].map((k) => [`stipple-${k}.webp`, `yilin-stipple/${k}.webp`]),
);

await mkdir(out, { recursive: true });

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
  const res = await fetch(`${cdn}/${key}`);
  if (!res.ok) throw new Error(`${res.status} fetching ${cdn}/${key}`);
  await writeFile(path.join(out, name), Buffer.from(await res.arrayBuffer()));
  console.log(`fetched  ${name}`);
}

for (const [name, stop] of Object.entries(screens)) {
  const url = `${cdn}/${tour}/${stop}.webp`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} fetching ${url}`);
  const tmp = path.join(out, `.${stop}.webp`);
  await writeFile(tmp, Buffer.from(await res.arrayBuffer()));
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", tmp, "-vf", `crop=iw:ih-${TOUR_HEADER}:0:${TOUR_HEADER}`, path.join(out, name)]);
  await rm(tmp);
  console.log(`fetched  ${name}`);
}

const musicFlag = process.argv.indexOf("--music");
if (musicFlag !== -1) {
  const src = process.argv[musicFlag + 1].replace(/^~/, homedir());
  const dir = path.join(root, "public/local");
  await mkdir(dir, { recursive: true });
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", src, "-vn", "-c:a", "aac", "-b:a", "192k", path.join(dir, "music.m4a")]);
  console.log("extracted public/local/music.m4a");
}
