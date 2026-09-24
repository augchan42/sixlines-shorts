// Writes a context-blind rater's input: each short as a timeline of what is on screen and
// when, timed by seriesPlan with the hexagram's own track (series/hexagrams.json), in the
// order a viewer meets it, then the post caption. The rater sees nothing else.
//
//   node scripts/copy-brief.mjs [draft.json] [out.md]
//   (defaults: series/copy-draft.json, series/critic/copy/brief.md)
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { seriesPlan } from "../src/lib/seriesPlan.ts";

const root = path.resolve(import.meta.dirname, "..");
const [draftPath = "series/copy-draft.json", outPath = "series/critic/copy/brief.md"] = process.argv.slice(2);
const draft = JSON.parse(readFileSync(path.resolve(root, draftPath), "utf8"));
const rows = Object.fromEntries(JSON.parse(readFileSync(path.join(root, "series/hexagrams.json"), "utf8")).map((r) => [r.number, r]));

// Text types on over its first 10 to 16 frames at 30 fps.
const TYPE_ON = 0.4;
const SCREENS = ["READ THE STRUCTURE", "THE BOOK OF CHANGES", "YOUR DAY, READ", "ASK · CAST · REFLECT"];

const timeline = (n, c) => {
  const r = rows[n];
  const { bpm, firstBeat, drop } = r.music;
  const p = seriesPlan(bpm, drop);
  const t = (beat) => firstBeat + (beat * 60) / bpm;
  const at = (a, b) => `${t(a).toFixed(1)}–${t(b).toFixed(1)} s (${(t(b) - t(a)).toFixed(1)} s)`;
  const text = (s) => s.split("\n").map((l) => `    ${l}`).join("\n");
  const half = p.meaningLength / 2;
  const hexEnd = p.hexagram + p.hexagramBeats;
  const screen = (p.cta - p.showcase) / 4;
  const events = [
    [0, `${at(0, p.hexagram)}  Hook, large, typed on in ${TYPE_ON} s over black:\n${text(c.hook.text)}`],
    [p.hexagram, `${at(p.hexagram, hexEnd)}  A 3D hexagram builds line by line. As the last line lands, its names fade in:\n    ${r.zh}  ${r.pinyin}\n    ${r.name}`],
    ...c.meaning.map((m, i) => [p.meaning + i * half, `${at(p.meaning + i * half, p.meaning + (i + 1) * half)}  Over an old woodcut plate and falling code, typed on:\n${text(m.text)}`]),
    [p.question, `${at(p.question, p.question + p.questionLength)}  Over falling code, typed on:\n${text(c.question.text)}`],
    [p.drop - 0.001, `${t(p.drop).toFixed(1)} s  The music drops.`],
    ...SCREENS.map((s, i) => [p.showcase + i * screen, `${at(p.showcase + i * screen, p.showcase + (i + 1) * screen)}  An app screen for this hexagram, labelled "${s}".`]),
    [p.cta, `${at(p.cta, p.credit)}  End card: the app's name and where to get it.`],
    [p.credit, `${at(p.credit, p.end)}  Credit: "Original edit by ~DISNEYFAN".`],
  ].sort((a, b) => a[0] - b[0]);
  return [
    `## Short ${n}`,
    "",
    `Until ${t(p.drop).toFixed(1)} s a small label sits at the top: "${n} / 64 · SIXTY-FOUR RECORDS".`,
    "",
    ...events.map((e) => e[1]),
    "",
    "Post caption, under the video:",
    "",
    `    ${c.caption.text}`,
    "",
  ].join("\n");
};

const out = ["# 56 shorts, as a viewer meets them", "", ...Object.entries(draft).map(([n, c]) => timeline(Number(n), c))];
writeFileSync(path.resolve(root, outPath), out.join("\n"));
console.log(`wrote ${outPath} (${Object.keys(draft).length} shorts)`);
