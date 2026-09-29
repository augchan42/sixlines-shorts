// tests/terminal-plain-reading.test.mjs
// The plain web terminal's rules (web/terminal/reading.js, plot.js) against the same cases as the
// Godot build's tests/run.gd.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as Reading from "../web/terminal/reading.js";
import { DIST, Plot, SCALE_PX, lineZ, project } from "../web/terminal/plot.js";

const data = JSON.parse(readFileSync(new URL("../godot/wangbi-terminal/data/hexagrams.json", import.meta.url), "utf8"));
const army = [0, 1, 0, 0, 0, 0]; // 7 師
const TAU = 2 * Math.PI;
const near = (a, b) => Math.abs(a - b) < 1e-9;

test("64 hexagrams, keyed by their lines", () => {
  assert.equal(Object.keys(data).length, 64);
  assert.ok(Reading.key(army) === "010000" && data["010000"].number === 7);
  assert.deepEqual(Reading.linesOf(data, 7), army);
  assert.deepEqual(Reading.linesOf(data, 65), []);
});

test("辯位 places", () => {
  assert.ok(Reading.place(army, 1) === "NO FIXED PLACE" && Reading.place(army, 6) === "NO FIXED PLACE", "1 and 6");
  assert.equal(Reading.place(army, 2), "NOT CORRECT", "7 L2 is yang in a yin place");
  assert.equal(Reading.place(army, 4), "CORRECT", "7 L4 is yin in a yin place");
  assert.equal(Reading.place(army, 5), "NOT CORRECT", "7 L5 is yin in a yang place");
});

test("centres, partners, answering", () => {
  assert.ok(Reading.isCentre(2) && Reading.isCentre(5) && !Reading.isCentre(3));
  assert.ok(Reading.partner(1) === 4 && Reading.partner(5) === 2 && Reading.partner(6) === 3);
  assert.ok(Reading.answers(army, 2) && Reading.answers(army, 5), "7: L2 answers L5");
  assert.ok(!Reading.answers(army, 1), "7: L1 and L4, both yin, do not answer");
});

test("rows, title, masters, trigrams", () => {
  assert.equal(Reading.logRow(army, 2), "L2  YANG  NOT CORRECT  CENTRE  ANSWERS L5");
  assert.equal(Reading.logRow(army, 1), "L1  YIN   NO FIXED PLACE");
  assert.equal(Reading.title(data["010000"]), "7  師 SHĪ  THE ARMY");
  assert.deepEqual(Reading.masterLines(data["010000"]), [2]);
  assert.deepEqual(Reading.masterLines(data["101001"]), [5]);
  assert.deepEqual(Reading.masterLines(data["110111"]), [3]);
  assert.deepEqual(Reading.trigramRows(data["010000"]), ["UPPER  坤 EARTH, YIELDING", "LOWER  坎 WATER, SINKING"]);
});

test("flips in a row read as the final lines; turns end square", () => {
  const l = Reading.flip(Reading.flip(Reading.flip(army, 2), 2), 5);
  assert.deepEqual(army, [0, 1, 0, 0, 0, 0], "flip leaves its input alone");
  assert.equal(Reading.key(l), "010010");
  assert.ok(near(Reading.turnTarget(0), TAU) && near(Reading.turnTarget(TAU * 1.4), TAU * 2));
});

test("a dragged turn settles to the nearest whole turn", () => {
  assert.ok(near(Reading.nearestSquare(0.35), 0));
  assert.ok(near(Reading.nearestSquare(TAU - 0.35), TAU));
  assert.ok(near(Reading.nearestSquare(TAU * 2.5), TAU * 3));
});

test("the plot's projection, with and without tilt", () => {
  const [x, y] = project([1, 0, 2], 0, 0);
  assert.ok(near(x, 1 * SCALE_PX * (DIST / DIST)) && near(y, -2 * SCALE_PX));
  const tilted = project([0, 0, 2], 0, Math.PI / 2);
  assert.ok(Math.abs(tilted[1]) < 0.01, "a 90-degree tilt swings a purely vertical point level");
  assert.ok(Math.abs(tilted[0]) < 0.01, "tilt alone does not move a point off the vertical axis");
});

test("several masters, and none", () => {
  const two = { masters: [{ line: 2, zh: "甲之主", en: "A" }, { line: 5, zh: "乙之主", en: "B" }] };
  assert.deepEqual(Reading.masterLines(two), [2, 5]);
  assert.deepEqual(Reading.wangbiRows(two), ["L2  甲之主  A", "L5  乙之主  B"]);
  assert.deepEqual(Reading.wangbiRows({ masters: [] }), [Reading.NO_MASTER]);
  assert.deepEqual(Reading.masterLines({ masters: [] }), []);
});

test("a tap a quarter in from each line's left end finds that line, yin or yang, and a far tap none", () => {
  const plot = new Plot(540, 560);
  plot.lines = army;
  plot.turn = 0.7;
  const ctx = new Proxy({}, { get: (_, k) => (k in _ ? _[k] : () => {}), set: () => true });
  plot.draw(ctx);
  for (let n = 1; n <= 6; n++) {
    const [x, y] = project([-1.55, 0, lineZ(n - 1)], plot.turn, plot.tilt);
    assert.equal(plot.lineAt(540 + x, 560 + y), n);
  }
  assert.equal(plot.lineAt(540, 1500), 0);
});
