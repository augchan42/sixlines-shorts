// Gathers what a readout lesson (src/scenes/Readout.tsx) is written from, for each hexagram
// the lesson styles give the readout (docs/research/2026-09-26-lesson-styles.md): its lines
// in or out of place, its answering pairs, a line that differs from the other five, the
// masters Wang Bi names (series/wangbi.json), his note on the Judgment, the Judgment and
// Image (sixlines-content), and the short's copy, so the lesson doesn't repeat it. Writes
// series/critic/readouts/input.json.
//
//   node --experimental-strip-types scripts/readout-input.mjs

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const content = process.env.SIXLINES_CONTENT ?? path.resolve(root, "../sixlines-content");
const json = (p) => JSON.parse(readFileSync(p, "utf8"));
const { WANG_BI_ZHU } = await import(path.resolve(root, "../8bitoracle-next/src/constants/wangBiZhu.ts"));

export const READOUTS = [1, 2, 3, 4, 6, 9, 10, 13, 14, 16, 17, 20, 22, 25, 26, 31, 33, 34, 35, 37, 38, 39, 40, 41, 45, 46, 49, 52, 53, 54, 55, 57, 59, 60, 64];
const TRIGRAMS = { "111": "heaven", "000": "earth", "100": "thunder", "010": "water", "001": "mountain", "011": "wind", "101": "fire", "110": "lake" };

const rows = json(path.join(root, "series/hexagrams.json"));
const wangbi = json(path.join(root, "series/wangbi.json")).hexagrams;

const out = READOUTS.map((n) => {
  const row = rows[n - 1];
  const l = row.lines;
  const c = json(path.join(content, `content/commentary/en/${n}.json`));
  const yang = l.filter(Boolean).length;
  const sole = yang === 1 ? l.indexOf(1) : yang === 5 ? l.indexOf(0) : null;
  return {
    number: n,
    name: row.name,
    lines: l.join(""),
    trigrams: { lower: TRIGRAMS[l.slice(0, 3).join("")], upper: TRIGRAMS[l.slice(3).join("")] },
    places: l.map((v, i) => (v === (i % 2 === 0 ? 1 : 0) ? "in" : "out")),
    answering: [0, 1, 2].filter((i) => l[i] !== l[i + 3]).map((i) => `${i + 1}-${i + 4}`),
    ...(sole !== null ? { sole: { line: sole + 1, kind: yang === 1 ? "yang" : "yin" } } : {}),
    wangbi: {
      masters: wangbi[n]?.masters ?? [],
      ...(wangbi[n]?.judgment ? { judgmentMaster: wangbi[n].judgment } : {}),
      judgment: WANG_BI_ZHU[n]?.judgment?.en ?? null,
      lines: Object.fromEntries(Object.entries(WANG_BI_ZHU[n]?.lines ?? {}).map(([k, v]) => [k, v.en.slice(0, 400)])),
    },
    judgment: c.judgment.transliteration,
    image: c.image.transliteration,
    lineTexts: c.lines.map((x) => x.transliteration),
    copy: { hook: row.copy.hook.text, meaning: row.copy.meaning.map((m) => m.text), question: row.copy.question.text, lesson: row.copy.lesson?.text ?? null },
  };
});

mkdirSync(path.join(root, "series/critic/readouts"), { recursive: true });
writeFileSync(path.join(root, "series/critic/readouts/input.json"), JSON.stringify({ script: "scripts/readout-input.mjs", hexagrams: out }, null, 1) + "\n");
console.log(`${out.length} readout hexagrams`);
