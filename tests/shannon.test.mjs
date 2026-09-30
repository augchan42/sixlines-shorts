import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { LINE_FLIPS, ODDS_TIMES, diagramCues, value } from "../src/lib/diagram.ts";
import { COINS, YARROW, entropy } from "../src/lib/entropy.ts";

// The Six Bits short (docs/superpowers/specs/2026-09-30-shannon-six-bits-design.md): its numbers,
// computed here rather than taken on trust.
const near = (a, b) => assert.ok(Math.abs(a - b) < 0.005, `${a} vs ${b}`);

test("one fair choice of two is one bit; 64 equally likely patterns are six", () => {
  assert.equal(entropy([0.5, 0.5]), 1);
  assert.equal(entropy(Array(64).fill(1 / 64)), 6);
  // Anything less even carries less.
  assert.ok(entropy([0.75, 0.25]) < 1);
});

test("coins and yarrow both make a line yin half the time and yang half the time", () => {
  // Old yin, young yang, young yin, old yang.
  assert.equal(COINS.reduce((a, b) => a + b), 1);
  assert.equal(YARROW.reduce((a, b) => a + b), 1);
  assert.equal(COINS[0] + COINS[2], 0.5);
  assert.equal(YARROW[0] + YARROW[2], 0.5);
  assert.deepEqual(YARROW.map((p) => p * 16), [1, 5, 7, 3]);
  assert.equal(entropy([YARROW[0] + YARROW[2], YARROW[1] + YARROW[3]]), 1);
});

test("with moving lines the methods differ: 1.81 bits a line by coins, 1.75 by yarrow", () => {
  // Left out of the short (moving lines would need explaining first), kept as the reason why.
  near(entropy(COINS), 1.81);
  near(entropy(YARROW), 1.75);
});

test("page 3's hexagram, After Completion, reads 101010 = 42", () => {
  const rows = JSON.parse(readFileSync(new URL("../series/hexagrams.json", import.meta.url), "utf8"));
  assert.equal(value(rows.find((r) => r.number === 63).lines), 42);
});

test("the line clicks at each flip, slowing, then stops", () => {
  const cues = diagramCues({ kind: "line", at: 1 });
  assert.deepEqual(cues.map((c) => c.at), LINE_FLIPS(1));
  assert.ok(cues.every((c) => c.sound === "relay"));
  const gaps = LINE_FLIPS(1).slice(1).map((t, i) => t - LINE_FLIPS(1)[i]);
  assert.ok(gaps.every((g, i) => i === 0 || g >= gaps[i - 1]), "each flip no quicker than the last");
});

test("the odds bars click as each of the four grows", () => {
  const cues = diagramCues({ kind: "odds", at: 1 });
  assert.deepEqual(cues.filter((c) => c.sound === "relay").map((c) => c.at), ODDS_TIMES(1).slice(0, 4));
  assert.equal(cues.filter((c) => c.sound === "warble").length, 1);
});

const BANNED = ["oracle", "divination", "fortune", "prediction", "mystical", "magical", "預測", "预测", "占卜", "算命", "神諭"];
test("the short's copy has none of the banned words", () => {
  const script = JSON.parse(readFileSync(new URL("../series/explainers/shannon-short.json", import.meta.url), "utf8"));
  const copy = `${JSON.stringify(script.chapters)} ${script.caption}`.toLowerCase();
  for (const w of BANNED) assert.ok(!copy.includes(w), w);
});
