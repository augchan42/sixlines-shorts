// Builds the series table (series/hexagrams.json) from its sources. Pure: the CLI in
// scripts/series-table.mjs reads the files and writes the result.

const TRIGRAMS = { "111": "qian", "110": "dui", "101": "li", "100": "zhen", "011": "xun", "010": "kan", "001": "gen", "000": "kun" };

// Harvard-Yenching line labels ("初九 …", "六二 …"): 九 is yang, 六 is yin. Hexagrams 1 and
// 2 carry a seventh line (用九, 用六) that is not a line of the figure.
export const linesFromLabels = (labels) => labels.slice(0, 6).map((l) => (l.split(" ")[0].includes("九") ? 1 : 0));

// Bottom line first, so lines 4 to 6 are indexes 3 to 5.
export const trigram = (lines) => TRIGRAMS[lines.slice(3, 6).join("")];

const firstSentence = (text) => text.match(/^.*?[.?!](\s|$)/)?.[0].trim() ?? text;

export const buildTable = ({ commentary, harvard, sections, copy, contentCommit }) => {
  const lines = Object.fromEntries(harvard.map((h) => [h.number, linesFromLabels(h.lines)]));
  const music = Object.fromEntries(sections.map((s) => [s.trigram, s]));
  return harvard
    .map((h) => h.number)
    .filter((n) => commentary[n])
    .map((n) => {
      const c = commentary[n];
      const upper = trigram(lines[n]);
      return {
        number: n,
        zh: c.name_chinese,
        pinyin: c.name_pinyin,
        name: c.name_english,
        lines: lines[n],
        upper,
        commentary: firstSentence(c.judgment.synthesis),
        music: music[upper],
        copy: copy[n] ?? null,
        source: { sixlinesContent: contentCommit },
      };
    });
};
