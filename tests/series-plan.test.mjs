import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { seriesPlan } from "../src/lib/seriesPlan.ts";
import { TITLE_BOTTOM } from "../src/scenes/titleLayout.ts";

const sections = JSON.parse(readFileSync("music/sections.json", "utf8")).sections;
const byName = Object.fromEntries(sections.map((s) => [s.trigram, s]));

test("the meaning goes before the drop with an 8-beat hexagram when it fits", () => {
  const p = seriesPlan(102, 14.12);
  assert.equal(p.mode, "before");
  assert.deepEqual([p.hexagram, p.meaning, p.question, p.drop, p.showcase, p.cta, p.credit, p.end], [4, 12, 20, 24, 24, 40, 49, 52]);
});

test("Gen gets a 6-beat hexagram", () => {
  const p = seriesPlan(82.5, byName.gen.drop);
  assert.equal(p.mode, "short-hexagram");
  assert.deepEqual([p.hexagram, p.meaning, p.question, p.drop, p.end], [4, 10, 16, 20, 48]);
});

test("Kun's meaning and question follow the drop", () => {
  const p = seriesPlan(90, byName.kun.drop);
  assert.equal(p.mode, "after");
  assert.deepEqual([p.hexagram, p.drop, p.meaning, p.question, p.showcase, p.cta, p.credit, p.end], [4, 12, 12, 20, 24, 40, 49, 52]);
});

test("every chosen section keeps the minimums and stays within 35 s", () => {
  for (const s of sections) {
    const p = seriesPlan(s.bpm, s.drop);
    const sec = (beats) => (beats * 60) / s.bpm;
    assert.ok(sec(p.end) <= 35, `${s.trigram}: ${sec(p.end)} s`);
    assert.ok(sec(p.questionLength) >= 2 && sec(p.meaningLength / 2) >= 2, `${s.trigram}: text under 2 s`);
    assert.ok(sec((p.cta - p.showcase) / 4) >= 2, `${s.trigram}: screens under 2 s`);
    // The end card holds about 2 s once its last line is lit, and the credit gets a bar's end.
    assert.equal(p.credit - p.cta, 9, s.trigram);
    assert.equal(p.end - p.credit, 3, s.trigram);
  }
});

test("the hexagram part is 8 beats, or 6 when the meaning needs the room", () => {
  assert.equal(seriesPlan(102, 14.12).hexagramBeats, 8);
  assert.equal(seriesPlan(82.5, byName.gen.drop).hexagramBeats, 6);
  assert.equal(seriesPlan(90, byName.kun.drop).hexagramBeats, 8);
});

test("the hexagram names sit above Instagram's bottom 420 px", () => {
  assert.ok(TITLE_BOTTOM >= 420, `${TITLE_BOTTOM}`);
});
