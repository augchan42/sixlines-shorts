// Renders the app demo walkthrough (series/demo/walkthrough.json): node scripts/demo.mjs
// out/demo/walkthrough/ gets short.mp4, share.mp4 and manifest.json; the manifest is also
// copied to series/renders/demo/walkthrough.json for committing. An earlier render moves to
// out/demo/versions/walkthrough/<time>-<commit>/ first.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { shareBitrate, versionDir } from "./series/render-lib.mjs";

const root = path.resolve(import.meta.dirname, "..");
const pub = (f) => path.join(root, "public", f);
const shaAbs = (f) => createHash("sha256").update(readFileSync(f)).digest("hex");
const run = (cmd, args) => execFileSync(cmd, args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const name = "walkthrough";
const propsFile = path.join(root, "series/demo", `${name}.json`);
const props = JSON.parse(readFileSync(propsFile, "utf8"));
const commit = run("git", ["rev-parse", "HEAD"]).trim();
const clean = run("git", ["status", "--porcelain"]).trim() === "";

// Every file the render reads, checked against the hash recorded for it where there is one.
const inputs = [props.music, ...Object.values(props.takes).map((t) => t.file), ...props.shots.filter((s) => s.clip).map((s) => s.clip)];
const problems = [];
for (const f of inputs) if (!existsSync(pub(f))) problems.push(`${f} is missing`);
for (const t of Object.values(props.takes)) {
  if (existsSync(pub(t.file)) && shaAbs(pub(t.file)) !== t.sha256) problems.push(`${t.file} is not the recorded take (sha256 differs)`);
}
if (problems.length) throw new Error(problems.join("\n  "));

const dir = path.join(root, "out/demo", name);
if (existsSync(path.join(dir, "manifest.json"))) {
  const kept = path.join(root, versionDir("out/demo", name, JSON.parse(readFileSync(path.join(dir, "manifest.json"), "utf8"))));
  mkdirSync(path.dirname(kept), { recursive: true });
  renameSync(dir, kept);
  console.log(`kept the earlier render in ${path.relative(root, kept)}`);
}
mkdirSync(dir, { recursive: true });
const short = path.join(dir, "short.mp4");
const share = path.join(dir, "share.mp4");
console.log("rendering");
run("npx", ["remotion", "render", "src/index.ts", "Demo", short, `--props=${propsFile}`, "--log=error"]);

// The share copy: yuv420p, faststart, under 25 MB, for Instagram and Threads.
const seconds = Number(run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", short]).trim());
const kbps = shareBitrate(seconds);
const enc = (pass, out) => [
  "-v", "error", "-y", "-i", short, "-vf", "scale=in_range=full:out_range=tv,format=yuv420p",
  "-c:v", "libx264", "-b:v", `${kbps}k`, "-pass", String(pass), "-passlogfile", path.join(dir, "x264"),
  ...(pass === 1 ? ["-an", "-f", "mp4", out] : ["-c:a", "aac", "-b:a", "128k", "-ar", "44100", "-movflags", "+faststart", out]),
];
run("ffmpeg", enc(1, "/dev/null"));
run("ffmpeg", enc(2, share));

const files = Object.fromEntries(inputs.map((f) => [f, shaAbs(pub(f))]));
files[`out/demo/${name}/short.mp4`] = shaAbs(short);
files[`out/demo/${name}/share.mp4`] = shaAbs(share);
const manifest = { demo: name, rendered: new Date().toISOString(), commit, clean, seconds, shareKbps: kbps, props, files };
writeFileSync(path.join(dir, "manifest.json"), `${JSON.stringify(manifest, null, 1)}\n`);
const records = path.join(root, "series/renders/demo");
mkdirSync(records, { recursive: true });
copyFileSync(path.join(dir, "manifest.json"), path.join(records, `${name}.json`));
console.log(`${path.relative(root, share)} (${seconds.toFixed(1)} s)`);
