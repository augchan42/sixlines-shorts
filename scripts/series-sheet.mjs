// Makes what a critic agent reviews for a rendered series short: stills at each part of the
// short and a contact sheet of them (out/critic/NN-trigram/, gitignored), and brief.md with the
// copy, the timeline in seconds, and the track's energy per bar over the short (the critic
// cannot hear the music). sheet.json records the hashes of the short and the stills.
//
//   node scripts/series-sheet.mjs 2 29 ...
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { planOf } from "../src/lib/seriesPlan.ts";

const root = path.resolve(import.meta.dirname, "..");
const sha = (f) => createHash("sha256").update(readFileSync(f)).digest("hex");
const analysis = JSON.parse(readFileSync(path.join(root, "music/analysis.json"), "utf8"));
const sections = JSON.parse(readFileSync(path.join(root, "music/sections.json"), "utf8")).sections;
// Energy classes from docs/research/2026-09-24-transitions.md, section 3.
const CLASS = { kun: "calm", gen: "calm", qian: "steady", li: "steady", zhen: "building", kan: "building", xun: "building", dui: "driving" };
const font = "/System/Library/Fonts/Supplemental/Andale Mono.ttf";
const commit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
const clean = execFileSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8" }).trim() === "";

const numbers = process.argv.slice(2).map(Number);
if (!numbers.length || numbers.some((n) => !(n >= 1 && n <= 64))) {
  console.error("usage: node scripts/series-sheet.mjs N [N ...]");
  process.exit(1);
}

for (const n of numbers) {
  const nn = String(n).padStart(2, "0");
  const dir = readdirSync(path.join(root, "out/series")).find((d) => d.startsWith(`${nn}-`));
  if (!dir) throw new Error(`no out/series/${nn}-*`);
  const short = path.join(root, "out/series", dir, "share.mp4");
  const props = JSON.parse(readFileSync(path.join(root, "out/series", dir, "props.json"), "utf8"));
  const file = path.basename(props.music);
  const section = sections.find((s) => s.file === file);
  const track = analysis.tracks.find((t) => t.file === file);
  const s = planOf(props);
  const at = (beat) => props.firstBeat + (beat * 60) / props.bpm;
  const screenBeats = (s.cta - s.showcase) / Math.max(1, props.screens.length);
  const lessonHalf = s.showcase + (s.cta - s.showcase) / 2;
  const lesson = props.lesson;
  const hexEnd = s.hexagram + s.hexagramBeats;
  const half = s.meaningLength / 2;

  const parts = [
    ["hook", 0, s.hexagram],
    ["hexagram", s.hexagram, hexEnd],
    ["meaning 1", s.meaning, s.meaning + half],
    ["meaning 2", s.meaning + half, s.meaning + s.meaningLength],
    ["question", s.question, s.question + s.questionLength],
    ...(lesson ? [[`lesson: ${lesson.kind}`, s.showcase, lessonHalf], ["lesson sentence", lessonHalf, s.cta]] : []),
    ...props.screens.map((sc, i) => [`screen ${i + 1} (${sc.caption})`, s.showcase + i * screenBeats, s.showcase + (i + 1) * screenBeats]),
    ["end card", s.cta, s.credit],
    ["credit", s.credit, s.end],
  ];
  const stills = [
    ["HOOK", at(s.hexagram / 2)],
    ["HEX 30%", at(s.hexagram + 0.3 * s.hexagramBeats)],
    ["HEX 60%", at(s.hexagram + 0.6 * s.hexagramBeats)],
    ["HEX 95%", at(s.hexagram + 0.95 * s.hexagramBeats)],
    ["MEANING 1", at(s.meaning + half / 2)],
    ["MEANING 2", at(s.meaning + 1.5 * half)],
    ["QUESTION", at(s.question + s.questionLength / 2)],
    ["DROP -0.1s", at(s.drop) - 0.1],
    ["DROP +0.2s", at(s.drop) + 0.2],
    ...(lesson ? [[`LESSON ${lesson.kind.toUpperCase()}`, at((s.showcase + lessonHalf) / 2)], ["LESSON TEXT", at(lessonHalf + 0.7 * (s.cta - lessonHalf))]] : []),
    ...props.screens.map((_, i) => [`SCREEN ${i + 1}`, at(s.showcase + (i + 0.5) * screenBeats)]),
    ["END 40%", at(s.cta + 0.4 * (s.credit - s.cta))],
    ["END 95%", at(s.cta + 0.95 * (s.credit - s.cta))],
    ["CREDIT", at(s.credit + 0.7 * (s.end - s.credit))],
  ];

  const out = path.join(root, "out/critic", dir);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  const files = stills.map(([label, t], i) => {
    const f = path.join(out, `${String(i + 1).padStart(2, "0")}.png`);
    const text = `${label.replace("%", " pct")}  ${t.toFixed(2)} s`;
    execFileSync("ffmpeg", [
      "-v", "error", "-ss", t.toFixed(3), "-i", short, "-frames:v", "1",
      "-vf", `scale=540:960,drawtext=fontfile='${font}':text='${text}':x=12:y=12:fontsize=28:fontcolor=white:box=1:boxcolor=black@0.7:boxborderw=6`,
      f,
    ]);
    return f;
  });
  const cols = 4;
  const rows = Math.ceil(files.length / cols);
  execFileSync("ffmpeg", [
    "-v", "error", "-y", "-framerate", "1", "-i", path.join(out, "%02d.png"),
    "-vf", `scale=360:640,tile=${cols}x${rows}:padding=4:color=gray`, "-frames:v", "1", path.join(out, "sheet.png"),
  ]);

  const bar = (t) => Math.floor((props.musicStart + t - track.firstBeat) / track.barSeconds);
  const seconds = at(s.end);
  const energy = [];
  for (let b = Math.max(0, bar(0)); b <= bar(seconds) && b < track.energy.length; b++) {
    const t = track.firstBeat + b * track.barSeconds - props.musicStart;
    const inPart = parts.find(([, a, z]) => t >= at(a) && t < at(z));
    energy.push(`| ${b} | ${Math.max(0, t).toFixed(1)} | ${track.energy[b].toFixed(1)} | ${inPart ? inPart[0] : ""} |`);
  }
  const brief = [
    `# Short ${n}: ${props.hexagram.name} (${props.hexagram.zh})`,
    "",
    `- Length: ${seconds.toFixed(1)} s. Timing mode: ${s.mode}.`,
    `- Music: "${track.title}", ${props.bpm} bpm, upper trigram ${section.trigram}, energy class **${CLASS[section.trigram]}**. The drop is at ${at(s.drop).toFixed(2)} s.`,
    `- End card transition: ${props.endcard.mode}.`,
    "",
    "## Copy on screen",
    "",
    `- Hook: ${JSON.stringify(props.hook)}`,
    `- Meaning 1: ${JSON.stringify(props.meaning[0])}`,
    `- Meaning 2: ${JSON.stringify(props.meaning[1])}`,
    `- Question: ${JSON.stringify(props.question)}`,
    lesson ? `- Lesson (${lesson.kind}): ${JSON.stringify(lesson.text)}` : `- Screens: ${props.screens.map((sc) => sc.caption).join(" · ")}`,
    "",
    "## Timeline",
    "",
    "| Part | From (s) | To (s) |",
    "|---|---|---|",
    ...parts.map(([name, a, z]) => `| ${name} | ${at(a).toFixed(2)} | ${at(z).toFixed(2)} |`),
    "",
    "Cuts (all on beats): zoom into the hexagram; whip-up, whip-left, whip-right through the meaning and question; zoom and a 1-beat shake on the drop; alternating whips between screens; zoom into the end card; whip-up into the credit.",
    "",
    "## Music energy per bar over the short",
    "",
    "Energy is the track's loudness per bar from music/analysis.json (higher is louder/denser).",
    "",
    "| Bar | Starts at (s) | Energy | Part |",
    "|---|---|---|---|",
    ...energy,
    "",
    "## Stills",
    "",
    ...stills.map(([label, t], i) => `- ${String(i + 1).padStart(2, "0")}.png: ${label} at ${t.toFixed(2)} s`),
    "- sheet.png: all of the above, 4 across",
    "",
  ].join("\n");
  writeFileSync(path.join(out, "brief.md"), brief);
  writeFileSync(
    path.join(out, "sheet.json"),
    JSON.stringify(
      {
        script: "scripts/series-sheet.mjs",
        commit,
        clean,
        short: { path: path.relative(root, short), sha256: sha(short) },
        files: Object.fromEntries([...files, path.join(out, "sheet.png"), path.join(out, "brief.md")].map((f) => [path.relative(root, f), sha(f)])),
      },
      null,
      1,
    ) + "\n",
  );
  console.log(`${path.relative(root, out)}: ${files.length} stills, sheet, brief`);
}
