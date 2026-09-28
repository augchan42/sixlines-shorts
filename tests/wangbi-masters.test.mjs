// tests/wangbi-masters.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const m = JSON.parse(readFileSync(new URL("../series/wangbi-masters.json", import.meta.url), "utf8")).hexagrams;
const copy = JSON.parse(readFileSync(new URL("../series/copy.json", import.meta.url), "utf8"));
const lines = (n) => m[n].masters.map((x) => x.line);

test("all 64 hexagrams are checked", () => {
  assert.deepEqual(Object.keys(m).map(Number).sort((a, b) => a - b), Array.from({ length: 64 }, (_, i) => i + 1));
  for (const [n, h] of Object.entries(m)) assert.ok(h.checked, `${n} has no checked note`);
});

test("each master is a line 1-6 with its phrase, English and where the phrase is", () => {
  for (const [n, h] of Object.entries(m))
    for (const x of h.masters) {
      assert.ok(Number.isInteger(x.line) && x.line >= 1 && x.line <= 6, `${n} line`);
      assert.match(x.zh, /主/, `${n} zh names a master`);
      assert.ok(x.en, `${n} en`);
      assert.ok(x.where, `${n} where`);
    }
});

test("the shorts' readouts and the terminal agree", () => {
  for (const [n, row] of Object.entries(copy)) {
    const master = row.lesson?.readout?.master;
    if (master) assert.ok(m[n].masters.some((x) => x.zh === master.zh), `${n}: ${master.zh}`);
  }
});

test("the extractor's mistakes are not repeated", () => {
  assert.deepEqual(lines(16), [4], "16: the master is L4, named in the note on L5");
  assert.ok(!lines(36).includes(1) && !lines(36).includes(3), "36: L1's note speaks of L6; L3 removes the dark ruler");
  assert.ok(!lines(42).includes(2), "42 L2 is the Supreme Deity");
  assert.ok(!lines(46).includes(6), "46 L6 warns against being master");
  assert.ok(!lines(39).includes(3), "39 L3 is master of the lower trigram only");
  assert.deepEqual(lines(10), [3], "10: 三為履主");
  assert.deepEqual(lines(45), [], "45: 以剛為主 is a quality, like 30");
});
