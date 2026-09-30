import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { edges, neighbours, opposite, path } from "../src/lib/cube.ts";
import { value } from "../src/lib/diagram.ts";

// The structure shorts (docs/superpowers/specs/2026-09-30-structure-shorts-design.md).
const rows = JSON.parse(readFileSync(new URL("../series/hexagrams.json", import.meta.url), "utf8"));
const v = (n) => value(rows.find((r) => r.number === n).lines);

test("each hexagram has six neighbours one line away; the cube has 192 edges", () => {
  for (let x = 0; x < 64; x++) {
    const ns = neighbours(x);
    assert.equal(ns.length, 6);
    for (const y of ns) assert.equal((x ^ y).toString(2).replace(/0/g, "").length, 1);
  }
  assert.equal(edges().length, 192);
});

test("the opposite corner changes every line: Qian to Kun, six steps, one line at a time", () => {
  assert.equal(opposite(v(1)), v(2));
  const p = path(v(1), v(2));
  assert.equal(p.length, 7);
  for (let i = 1; i < p.length; i++) assert.ok(neighbours(p[i - 1]).includes(p[i]));
});

test("the Zuo zhuan's Guan zhi Pi: Guan (20) and Pi (12) are neighbours, by line 4", () => {
  assert.ok(neighbours(v(20)).includes(v(12)));
  // Line 4 counted from the bottom; the bottom line is the most significant bit.
  assert.equal(v(20) ^ v(12), 1 << (6 - 4));
});

test("King Wen's 32 pairs: 28 turned upside down, 4 with every line flipped", () => {
  const lines = (n) => rows.find((r) => r.number === n).lines;
  const flipped = [];
  let turned = 0;
  for (let a = 1; a < 64; a += 2) {
    const [x, y] = [lines(a), lines(a + 1)];
    const rev = [...x].reverse();
    if (rev.join("") !== x.join("") && rev.join("") === y.join("")) turned++;
    else if (y.every((l, i) => l === 1 - x[i])) flipped.push(a);
  }
  assert.equal(turned, 28);
  assert.deepEqual(flipped, [1, 27, 29, 61]);
});
