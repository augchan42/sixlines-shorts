import assert from "node:assert/strict";
import test from "node:test";
import { lessonProblems } from "../scripts/series/lesson-rules.mjs";

const hex = (number, painting = null) => ({ number, painting, copy: { hook: "Hook here?", meaning: ["Meaning one", "Meaning two"], question: "What now?" } });
const input = { hexagrams: [hex(7), hex(8, { title: "Luncheon" }), hex(9), hex(10)] };
const lesson = (number, kind, text, extra = {}) => ({ number, kind, text, source: "commentary", ...extra });

test("good lessons have no problems", () => {
  const ls = [lesson(7, "lines", "Unseen water\nunder the earth."), lesson(8, "painting", "Friends at lunch,\nholding together."), lesson(10, "line", "Look like a guest,\nnot an inspector.", { line: 4 })];
  assert.deepEqual(lessonProblems(ls, input), []);
});

test("a lesson keeps the copy rules", () => {
  assert.match(lessonProblems([lesson(7, "lines", "Water under the earth:\nunseen.")], input).join(), /7: lesson: "Water under the earth:" is too wide/);
  assert.match(lessonProblems([lesson(7, "lines", "One\ntwo\nthree four")], input).join(), /3 screen lines/);
});

test("a kind is one of four, a line lesson names its line, and a painting must be on offer", () => {
  assert.match(lessonProblems([lesson(7, "tarot", "a b c")], input).join(), /7: kind "tarot"/);
  assert.match(lessonProblems([lesson(7, "line", "a b c")], input).join(), /7: a line lesson needs its line, 1 to 6/);
  assert.match(lessonProblems([lesson(7, "painting", "a b c")], input).join(), /7: no painting is on offer/);
});

test("no three neighbouring shorts have the same kind", () => {
  const ls = [7, 8, 9].map((n) => lesson(n, "judgment", "a b c"));
  assert.match(lessonProblems(ls, input).join(), /9: third judgment in a row/);
});

test("a lesson does not repeat the short's own copy", () => {
  assert.match(lessonProblems([lesson(7, "judgment", "Meaning one")], input).join(), /7: repeats the short's own copy/);
});
