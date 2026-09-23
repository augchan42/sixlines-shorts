// Copies brand assets and app screenshots from ../sixlines-ios and downloads
// hexagram art from the CDN into public/assets/ (gitignored).
//
//   npm run assets
//   npm run assets -- --music ~/Downloads/some-short.mov   # also extract a music track to public/local/

import { execFileSync } from "node:child_process";
import { copyFile, mkdir, writeFile, access } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const ios = process.env.SIXLINES_IOS ?? path.resolve(root, "../sixlines-ios");
const out = path.join(root, "public/assets");
const cdn = "https://cdn.sixlines.online";

const copies = {
  "icon.png": "Resources/brand/sixlines-logo-1024.png",
  "screen-reading.png": "fastlane/screenshots_raw/en-US/iPhone 17 Pro Max-03_Reading.png",
  "screen-verse.png": "fastlane/screenshots_raw/en-US/iPhone 17 Pro Max-03_ReadingVerse.png",
  "screen-ask.png": "fastlane/screenshots_raw/en-US/iPhone 17 Pro Max-02_Ask.png",
  "screen-records.png": "fastlane/screenshots_raw/en-US/iPhone 17 Pro Max-06_RecordsStorefront.png",
};

// Yilin art keys are "{hexagram}-{changed hexagram}".
const downloads = {
  "ink-1-1.webp": "yilin-inkbrush/1-1.webp",
  "ink-1-9.webp": "yilin-inkbrush/1-9.webp",
  "ink-1-44.webp": "yilin-inkbrush/1-44.webp",
  "stipple-1-1.webp": "yilin-stipple/1-1.webp",
  "stipple-1-9.webp": "yilin-stipple/1-9.webp",
};

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

const musicFlag = process.argv.indexOf("--music");
if (musicFlag !== -1) {
  const src = process.argv[musicFlag + 1].replace(/^~/, homedir());
  const dir = path.join(root, "public/local");
  await mkdir(dir, { recursive: true });
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", src, "-vn", "-c:a", "aac", "-b:a", "192k", path.join(dir, "music.m4a")]);
  console.log("extracted public/local/music.m4a");
}
