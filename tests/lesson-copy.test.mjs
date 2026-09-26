import assert from "node:assert/strict";
import test from "node:test";
import { lessonCopy } from "../scripts/series/lesson-copy.mjs";

const character = { number: 47, char: "困", story: "A tree is walled in.", sentence: "Pressed in", bpm: 95, beats: 10, args: { stand: true } };

test("a judgment or trigram lesson keeps its kind, text and source", () => {
  const l = { number: 10, kind: "judgment", text: "Stood on a tiger's\ntail. Not bitten.", source: "input.json#judgment", why: "..." };
  assert.deepEqual(lessonCopy(l, []), { kind: "judgment", text: l.text, source: l.source });
  assert.equal(lessonCopy({ ...l, kind: "lines" }, []).kind, "lines");
});

test("a character lesson carries its drawing from series/characters.json", () => {
  const l = { number: 47, kind: "character", text: "Boxed in?\nHold to your aim.", source: "characters.json#47" };
  assert.deepEqual(lessonCopy(l, [character]).character, { char: "困", beats: 10, args: { stand: true } });
  assert.throws(() => lessonCopy({ ...l, number: 3 }, [character]), /3: no character/);
});

// The short has no picture yet for a line lesson (no screen of the line in the app), or for
// a painting lesson without its painting and Library page, so neither can go into the copy.
test("a line lesson, or a painting without its files, is refused", () => {
  assert.throws(() => lessonCopy({ number: 2, kind: "line", text: "a", source: "s" }, [], { exists: () => true }), /2: a line lesson has no picture/);
  assert.throws(() => lessonCopy({ number: 28, kind: "painting", text: "a", source: "s" }, [], { exists: () => false }), /28: .*assets\/paintings\/28\.jpg/);
  assert.equal(lessonCopy({ number: 28, kind: "painting", text: "a", source: "s" }, [], { exists: () => true }).kind, "painting");
});
