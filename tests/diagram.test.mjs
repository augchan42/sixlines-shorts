import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { BIT_TIMES, bitsOf, diagramCues, linesOf, ringAngle, squareCell, treeNode, value } from "../src/lib/diagram.ts";

// The order of the diagram Bouvet sent Leibniz (docs/superpowers/specs/2026-09-30-leibniz-diagram-design.md),
// checked against the woodcut and docs/research/2026-09-30-leibniz-diagram.md.
const rows = JSON.parse(readFileSync(new URL("../series/hexagrams.json", import.meta.url), "utf8"));
const byNumber = (n) => rows.find((r) => r.number === n).lines;

test("a hexagram's value: broken 0, solid 1, the bottom line the most significant bit", () => {
  // King Wen numbers: Kun 2, Bo 23, Bi 8, Gou 44, Fu 24, Guai 43, Qian 1.
  const want = { 2: 0, 23: 1, 8: 2, 44: 31, 24: 32, 43: 62, 1: 63 };
  for (const [n, v] of Object.entries(want)) assert.equal(value(byNumber(Number(n))), v, `hexagram ${n}`);
});

test("every value 0 to 63 is one hexagram, and linesOf undoes value", () => {
  assert.deepEqual(rows.map((r) => value(r.lines)).sort((a, b) => a - b), [...Array(64).keys()]);
  for (let v = 0; v < 64; v++) assert.equal(value(linesOf(v)), v);
  assert.equal(bitsOf(32), "100000");
  assert.equal(bitsOf(2), "000010");
});

// Degrees clockwise from the top of the ring, as the woodcut is printed.
test("the ring: Qian top left of centre, Gou top right, Fu bottom left, Kun bottom right", () => {
  const a = (v) => ringAngle(v);
  assert.ok(a(63) < 0 && a(63) > -10, String(a(63)));
  assert.ok(a(31) > 0 && a(31) < 10, String(a(31)));
  assert.ok(a(32) < -170 && a(32) > -180, String(a(32)));
  assert.ok(a(0) > 170 && a(0) < 180, String(a(0)));
});

test("the ring counts 0 to 31 up the right half, then 32 to 63 up the left", () => {
  for (let v = 1; v < 32; v++) assert.ok(ringAngle(v) < ringAngle(v - 1), `right ${v}`);
  for (let v = 33; v < 64; v++) assert.ok(ringAngle(v) > ringAngle(v - 1), `left ${v}`);
  // Neighbours are one sixty-fourth of the circle apart.
  assert.equal(Math.abs(ringAngle(10) - ringAngle(11)), 360 / 64);
});

test("the square: rows share a lower trigram, columns an upper; Kun top left, Qian bottom right", () => {
  assert.deepEqual(squareCell(0), { row: 0, col: 0 });
  assert.deepEqual(squareCell(63), { row: 7, col: 7 });
  // The top row, read right to left on the woodcut: 否 萃 晉 豫 觀 比 剝 坤, all with Kun below.
  const top = [12, 45, 35, 16, 20, 8, 23, 2].map((n) => squareCell(value(byNumber(n))));
  assert.deepEqual(top.map((c) => c.row), [0, 0, 0, 0, 0, 0, 0, 0]);
  assert.deepEqual(top.map((c) => c.col), [7, 6, 5, 4, 3, 2, 1, 0]);
});

test("the doubling tree: each split adds a line, and its last row is 0 to 63 left to right", () => {
  assert.deepEqual(treeNode(1, 0), [0]);
  assert.deepEqual(treeNode(1, 1), [1]);
  assert.deepEqual(treeNode(3, 5), [1, 0, 1]);
  for (let k = 0; k < 64; k++) assert.equal(value(treeNode(6, k)), k);
});

const BANNED = ["oracle", "divination", "fortune", "prediction", "mystical", "magical", "預測", "预测", "占卜", "算命", "神諭"];
test("the lesson's copy has none of the banned words", () => {
  const script = JSON.parse(readFileSync(new URL("../series/explainers/leibniz-lesson.json", import.meta.url), "utf8"));
  const copy = JSON.stringify(script.chapters).toLowerCase();
  for (const w of BANNED) assert.ok(!copy.includes(w), w);
});

// Sounds tied to what the diagram does (the user, 2026-09-30: "can we make the sound a bit more
// interesting somehow?").
test("a count clicks once per step, after a sweep and a warble as the camera arrives", () => {
  const cues = diagramCues({ count: [0, 31], at: 5, secs: 10 });
  const clicks = cues.filter((c) => c.sound === "relay");
  assert.equal(clicks.length, 31);
  assert.ok(clicks.every((c) => c.at > 5 && c.at < 15));
  assert.deepEqual(cues.filter((c) => c.sound !== "relay").map((c) => c.sound), ["sweep", "warble"]);
});

test("Bi's page clicks as each digit is written; the tree clicks per stage", () => {
  const bits = diagramCues({ kind: "bits", v: 2, weights: true, fadePlate: true }).filter((c) => c.sound === "relay");
  assert.equal(bits.length, 6);
  assert.deepEqual(bits.map((c) => c.at), BIT_TIMES(1.4));
  assert.equal(diagramCues({ kind: "bits", v: 41 }).filter((c) => c.sound === "relay").length, 0);
  assert.equal(diagramCues({ kind: "tree", at: 1, morph: 7.5 }).filter((c) => c.sound === "relay").length, 7);
  // A tree already grown (the next page) makes no sound.
  assert.equal(diagramCues({ kind: "tree", at: -10, dim: 0.35 }).length, 0);
});
