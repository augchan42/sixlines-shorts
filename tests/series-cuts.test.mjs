import assert from "node:assert/strict";
import test from "node:test";
import { CUT_STYLE, seriesCuts } from "../src/lib/seriesCuts.ts";
import { seriesPlan } from "../src/lib/seriesPlan.ts";

// Qian's timing (meaning before the drop) and Kun's (meaning from the drop).
const before = seriesPlan(102, 14.12);
const after = seriesPlan(90, 8.05);
const screenBeats = (p) => (p.cta - p.showcase) / 4;
const screenChanges = (p) => [1, 2, 3].map((i) => p.showcase + i * screenBeats(p));
const kindAt = (cuts, beat) => cuts.find((c) => c.beat === beat)?.kind;
const whips = (cuts) => cuts.filter((c) => c.kind.startsWith("whip"));

test("the tracks' energy classes pick the cut style", () => {
  assert.deepEqual(CUT_STYLE, {
    kun: "calm", gen: "calm", qian: "steady", li: "steady", zhen: "building", kan: "building", xun: "building", dui: "driving",
  });
});

test("every style has one cut per beat and zooms into the drop", () => {
  for (const style of ["calm", "steady", "building", "driving"]) {
    for (const p of [before, after]) {
      const { cuts } = seriesCuts(style, p, 4);
      const beats = cuts.map((c) => c.beat);
      assert.equal(new Set(beats).size, beats.length, `${style}: two cuts on one beat`);
      assert.equal(kindAt(cuts, p.drop), "zoom", style);
    }
  }
});

test("calm cuts dip slowly, without whips, shake or flash", () => {
  for (const p of [before, after]) {
    const c = seriesCuts("calm", p, 4);
    assert.deepEqual(whips(c.cuts), []);
    for (const cut of c.cuts.filter((x) => x.beat !== p.drop)) {
      assert.equal(cut.kind, "dip");
      assert.ok(cut.beats >= 0.5, "a dip lasts at least a beat");
    }
    assert.deepEqual(c.shakes, []);
    assert.deepEqual(c.flashes, []);
    assert.deepEqual(c.glitches, []);
  }
});

test("steady wipes a line between screens, punches the text cuts and shakes lightly", () => {
  const c = seriesCuts("steady", before, 4);
  for (const b of screenChanges(before)) assert.equal(kindAt(c.cuts, b), "line");
  assert.deepEqual(whips(c.cuts), []);
  assert.deepEqual(c.hits, [before.meaning, before.meaning + before.meaningLength / 2, before.question]);
  assert.ok(c.shakes.every((s) => s.strength <= 20));
  assert.deepEqual(c.flashes, []);
});

test("building dips before the question, whips from it, and hits the drop with flash, glitch and shake", () => {
  const c = seriesCuts("building", before, 4);
  assert.equal(kindAt(c.cuts, before.meaning), "dip");
  assert.equal(kindAt(c.cuts, before.meaning + before.meaningLength / 2), "dip");
  assert.ok(kindAt(c.cuts, before.question).startsWith("whip"));
  for (const b of screenChanges(before)) assert.ok(kindAt(c.cuts, b).startsWith("whip"));
  assert.deepEqual(c.flashes, [before.drop]);
  assert.deepEqual(c.glitches, [before.drop]);
  assert.deepEqual(c.shakes, [{ beat: before.drop, strength: 45, beats: 1 }]);
});

test("driving whips throughout and glitches the drop and every screen change", () => {
  const c = seriesCuts("driving", before, 4);
  assert.ok(kindAt(c.cuts, before.meaning).startsWith("whip"));
  assert.ok(kindAt(c.cuts, before.question).startsWith("whip"));
  assert.deepEqual(c.glitches, [before.drop, ...screenChanges(before)]);
  assert.deepEqual(c.flashes, [before.drop]);
});
