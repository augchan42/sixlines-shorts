import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { seriesPlan } from "../src/prototypes/seriesPlan.ts";

const sections = JSON.parse(readFileSync("music/sections.json", "utf8")).sections;
const byName = Object.fromEntries(sections.map((s) => [s.trigram, s]));

test("the meaning goes before the drop with an 8-beat hexagram when it fits", () => {
  const p = seriesPlan(102, 14.12);
  assert.equal(p.mode, "before");
  assert.deepEqual([p.hexagram, p.meaning, p.question, p.drop, p.showcase, p.cta, p.end], [4, 12, 20, 24, 24, 44, 51]);
});

test("Gen gets a 6-beat hexagram", () => {
  const p = seriesPlan(82.5, byName.gen.drop);
  assert.equal(p.mode, "short-hexagram");
  assert.deepEqual([p.hexagram, p.meaning, p.question, p.drop, p.end], [4, 10, 16, 20, 47]);
});

test("Kun's meaning and question follow the drop", () => {
  const p = seriesPlan(90, byName.kun.drop);
  assert.equal(p.mode, "after");
  assert.deepEqual([p.hexagram, p.drop, p.meaning, p.question, p.showcase, p.cta, p.end], [4, 12, 12, 20, 24, 44, 51]);
});

test("every chosen section keeps the minimums and stays within 35 s", () => {
  for (const s of sections) {
    const p = seriesPlan(s.bpm, s.drop);
    const sec = (beats) => (beats * 60) / s.bpm;
    assert.ok(sec(p.end) <= 35, `${s.trigram}: ${sec(p.end)} s`);
    assert.ok(sec(p.questionLength) >= 2 && sec(p.meaningLength / 2) >= 2, `${s.trigram}: text under 2 s`);
    assert.ok(sec(5) >= 2, `${s.trigram}: screens under 2 s`);
  }
});
