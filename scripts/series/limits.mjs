// What is wrong with a music section for a short: too long, text or screens too brief to
// read, or a gap between the hexagram and the meaning. The plan tests and music/add_sections.py (through `node scripts/series/limits.mjs`,
// a JSON list of {bpm, drop} on stdin, a list of problem lists out) both use it.
import { readFileSync } from "node:fs";
import { seriesPlan } from "../../src/lib/seriesPlan.ts";

export const MAX_SECONDS = 38;
const MIN_SECONDS = 2;
// App screens per short (screensFor in src/series/props.ts).
const SCREENS = 3;

export const sectionProblems = (bpm, drop) => {
  const p = seriesPlan(bpm, drop);
  const sec = (beats) => (beats * 60) / bpm;
  const problems = [];
  if (sec(p.end) > MAX_SECONDS) problems.push(`${sec(p.end).toFixed(2)} s long`);
  if (sec(p.hexagram) < MIN_SECONDS) problems.push("hook under 2 s");
  if (p.hexagram + p.hexagramBeats !== Math.min(p.meaning, p.drop)) problems.push("gap or overlap after the hexagram");
  if (sec(p.questionLength) < MIN_SECONDS || sec(p.meaningLength / 2) < MIN_SECONDS) problems.push("text under 2 s");
  if (sec((p.cta - p.showcase) / SCREENS) < MIN_SECONDS) problems.push("screens under 2 s");
  return problems;
};

if (import.meta.main) {
  const sections = JSON.parse(readFileSync(0, "utf8"));
  console.log(JSON.stringify(sections.map((s) => sectionProblems(s.bpm, s.drop))));
}
