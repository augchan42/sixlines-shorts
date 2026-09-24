import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { buildTable, linesFromLabels, trigram } from "../scripts/series/table.mjs";

test("line labels give the lines bottom first, ignoring 用九 and 用六", () => {
  assert.deepEqual(linesFromLabels(["初九 a", "九二 b", "九三 c", "九四 d", "九五 e", "上九 f", "用九 g"]), [1, 1, 1, 1, 1, 1]);
  assert.deepEqual(linesFromLabels(["初六 a", "九二 b", "六三 c", "六四 d", "九五 e", "上六 f"]), [0, 1, 0, 0, 1, 0]);
});

test("the upper trigram comes from lines 4 to 6", () => {
  assert.equal(trigram([0, 0, 0, 1, 1, 1]), "qian");
  assert.equal(trigram([1, 1, 1, 0, 1, 0]), "kan");
  assert.equal(trigram([0, 0, 0, 0, 0, 1]), "gen");
  assert.equal(trigram([0, 0, 0, 1, 1, 0]), "dui");
});

test("a row joins the sources", () => {
  const harvard = [
    { number: 29, lines: ["初六 a", "九二 b", "六三 c", "六四 d", "九五 e", "上六 f"] },
    { number: 30, lines: ["初九 a", "六二 b", "九三 c", "九四 d", "六五 e", "上九 f"] },
  ];
  const commentary = {
    29: { name_chinese: "坎", name_pinyin: "Kǎn", name_english: "The Abyss", judgment: { synthesis: "Danger doubled. More here." } },
    30: { name_chinese: "離", name_pinyin: "Lí", name_english: "The Clinging", judgment: { synthesis: "Fire. More." } },
  };
  const sections = [{ trigram: "kan", bpm: 100 }, { trigram: "li", bpm: 100 }];
  const [row] = buildTable({ commentary, harvard, sections, copy: {}, contentCommit: "abc123" });
  assert.deepEqual(
    { ...row, music: row.music.trigram },
    {
      number: 29, zh: "坎", pinyin: "Kǎn", name: "The Abyss", lines: [0, 1, 0, 0, 1, 0], upper: "kan",
      commentary: "Danger doubled.", music: "kan", copy: null,
      source: { sixlinesContent: "abc123" },
    },
  );
});

test("the committed table has all 64 hexagrams with the right lines", { skip: !existsSync("series/hexagrams.json") }, () => {
  const rows = JSON.parse(readFileSync("series/hexagrams.json", "utf8"));
  assert.equal(rows.length, 64);
  const lines = (n) => rows.find((r) => r.number === n).lines.join("");
  assert.equal(lines(1), "111111");
  assert.equal(lines(2), "000000");
  assert.equal(lines(29), "010010");
  assert.equal(lines(63), "101010");
});
