import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { LESSON_BEATS, planOf, seriesPlan } from "../src/lib/seriesPlan.ts";
import { TITLE_BOTTOM } from "../src/scenes/titleLayout.ts";
import { sectionProblems } from "../scripts/series/limits.mjs";

const sections = JSON.parse(readFileSync("music/sections.json", "utf8")).sections;
// Each trigram's first track, the one its doubled hexagram uses.
const byName = Object.fromEntries(sections.toReversed().map((s) => [s.trigram, s]));

test("the meaning goes before the drop with an 8-beat hexagram when it fits", () => {
  const p = seriesPlan(102, 14.12);
  assert.equal(p.mode, "before");
  assert.deepEqual([p.hexagram, p.meaning, p.question, p.drop, p.showcase, p.cta, p.credit, p.end], [4, 12, 20, 24, 24, 44, 53, 56]);
});

test("Gen gets a 6-beat hexagram", () => {
  const p = seriesPlan(82.5, byName.gen.drop);
  assert.equal(p.mode, "short-hexagram");
  assert.deepEqual([p.hexagram, p.meaning, p.question, p.drop, p.end], [4, 10, 16, 20, 52]);
});

test("Kun's meaning and question follow the drop", () => {
  const p = seriesPlan(90, byName.kun.drop);
  assert.equal(p.mode, "after");
  assert.deepEqual([p.hexagram, p.drop, p.meaning, p.question, p.showcase, p.cta, p.credit, p.end], [4, 12, 12, 20, 24, 44, 53, 56]);
});

test("above 120 bpm the text holds twice as many beats, so it still lasts 2 s", () => {
  const p = seriesPlan(147.01, 9.798);
  assert.equal(p.mode, "after");
  assert.deepEqual([p.drop, p.meaning, p.meaningLength, p.question, p.questionLength, p.showcase, p.cta, p.end], [24, 24, 16, 40, 8, 48, 68, 80]);
  const q = seriesPlan(126.01, 11.43);
  assert.equal(q.questionLength, 8);
  assert.equal(q.mode, "after");
});

test("above 120 bpm the hook holds 8 beats, so it lasts 2 s", () => {
  const p = seriesPlan(147.01, 9.798);
  assert.deepEqual([p.hexagram, p.hexagramBeats, p.drop], [8, 16, 24]);
  assert.equal(seriesPlan(120, 14).hexagram, 4);
});

test("when the meaning follows the drop, the hexagram holds until the drop", () => {
  const p = seriesPlan(100, 8.4);
  assert.equal(p.mode, "after");
  assert.deepEqual([p.hexagram, p.hexagramBeats, p.drop, p.meaning], [4, 10, 14, 14]);
});

test("every chosen section keeps the minimums and stays within 38 s", () => {
  for (const s of sections) {
    assert.deepEqual(sectionProblems(s.bpm, s.drop), [], s.file);
    const p = seriesPlan(s.bpm, s.drop);
    // The end card holds about 2 s once its last line is lit, and the credit gets a bar's end.
    assert.equal(p.credit - p.cta, 9, s.file);
    assert.equal(p.end - p.credit, 3, s.file);
  }
});

test("a section too long or too quick to read has problems", () => {
  assert.deepEqual(sectionProblems(90, 10.862), ["40.00 s long"]);
  assert.deepEqual(sectionProblems(90, 8.05), []);
});

test("the hexagram part is 8 beats, or 6 when the meaning needs the room", () => {
  assert.equal(seriesPlan(102, 14.12).hexagramBeats, 8);
  assert.equal(seriesPlan(82.5, byName.gen.drop).hexagramBeats, 6);
  assert.equal(seriesPlan(90, byName.kun.drop).hexagramBeats, 8);
});

test("the hexagram names sit above Instagram's bottom 420 px", () => {
  assert.ok(TITLE_BOTTOM >= 420, `${TITLE_BOTTOM}`);
});

test("a short with a lesson gives the drop 12 beats instead of the showcase's 20", () => {
  const p = seriesPlan(102, 14.12, LESSON_BEATS);
  assert.deepEqual([p.drop, p.showcase, p.cta, p.credit, p.end], [24, 24, 36, 45, 48]);
  assert.equal(planOf({ bpm: 102, drop: 14.12, lesson: { kind: "lines", text: "x" } }).cta, 36);
  assert.equal(planOf({ bpm: 102, drop: 14.12 }).cta, 44);
});
