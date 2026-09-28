// tests/terminal-data.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildTerminalData, displayText } from "../scripts/terminal-data.mjs";

const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), "utf8"));
const hexagrams = read("../series/hexagrams.json");
const masters = read("../series/wangbi-masters.json").hexagrams;
const data = buildTerminalData(hexagrams, masters);

test("64 entries keyed by their lines, bottom first", () => {
  assert.equal(Object.keys(data).length, 64);
  assert.equal(data["010000"].number, 7);
  assert.equal(data["111111"].number, 1);
});

test("trigrams are named, with what they do (Shuo Gua 7)", () => {
  assert.deepEqual(data["010000"].lower, { key: "kan", zh: "坎", name: "WATER", does: "SINKING" });
  assert.deepEqual(data["010000"].upper, { key: "kun", zh: "坤", name: "EARTH", does: "YIELDING" });
});

test("masters come from the hand-checked table", () => {
  assert.deepEqual(data["010000"].masters.map((x) => x.line), [2]);
});

test("the committed data is what the sources build", () => {
  assert.deepEqual(read("../godot/wangbi-terminal/data/hexagrams.json"), data);
});

test("the font subset covers every non-ASCII character shown, pinyin and punctuation too", () => {
  const text = displayText(data);
  for (const e of Object.values(data))
    for (const s of [e.zh, e.pinyin, e.name, e.upper.zh, e.lower.zh, ...e.masters.flatMap((x) => [x.zh, x.en])])
      for (const ch of s) if (ch.charCodeAt(0) > 127) assert.ok(text.includes(ch), ch);
  assert.ok(text.includes("，"), "16's full-width comma");
});

test("the font subset covers the uppercased pinyin shown in the title (Reading.title upper-cases it)", () => {
  const text = displayText(data);
  for (const e of Object.values(data))
    for (const ch of e.pinyin.toUpperCase()) if (ch.charCodeAt(0) > 127) assert.ok(text.includes(ch), ch);
  assert.ok(text.includes("Ī"), "7's pinyin SHĪ");
  assert.ok(text.includes("Ǎ"), "62's pinyin uppercased");
});

test("banned words and a master without English are refused", () => {
  const bad = structuredClone(masters);
  bad[7].masters[0].en = "An oracle";
  assert.throws(() => buildTerminalData(hexagrams, bad), /banned/);
  bad[7].masters[0].en = "";
  assert.throws(() => buildTerminalData(hexagrams, bad), /English/);
});
