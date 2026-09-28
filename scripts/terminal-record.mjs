// scripts/terminal-record.mjs
// Records the terminal's --record sequence with Godot's movie maker (frame-exact, with sound):
//   node scripts/terminal-record.mjs 7-army   ->  out/terminal/7-army.mp4
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const name = process.argv[2];
if (!name) throw new Error("usage: terminal-record.mjs <name>");
const dir = path.join(root, "out/terminal");
mkdirSync(dir, { recursive: true });
const avi = path.join(dir, `${name}.avi`);
const godotPath = path.join(root, "godot/wangbi-terminal");
execFileSync("/Applications/Godot.app/Contents/MacOS/Godot", ["--headless", "--path", godotPath, "--import"], {
  stdio: "inherit",
});
execFileSync(
  "/Applications/Godot.app/Contents/MacOS/Godot",
  [
    "--path",
    godotPath,
    "--write-movie",
    avi,
    "--fixed-fps",
    "60",
    "--disable-vsync",
    "--resolution",
    "1080x1920",
    "--",
    "--record",
  ],
  { stdio: "inherit" },
);
execFileSync("ffmpeg", [
  "-v",
  "error",
  "-y",
  "-i",
  avi,
  "-c:v",
  "libx264",
  "-pix_fmt",
  "yuv420p",
  "-crf",
  "18",
  "-c:a",
  "aac",
  "-movflags",
  "+faststart",
  path.join(dir, `${name}.mp4`),
]);
rmSync(avi);
console.log(`wrote out/terminal/${name}.mp4`);
