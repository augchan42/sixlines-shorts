// Builds the series table (series/hexagrams.json) from its sources. Pure: the CLI in
// scripts/series-table.mjs reads the files and writes the result.

const TRIGRAMS = { "111": "qian", "110": "dui", "101": "li", "100": "zhen", "011": "xun", "010": "kan", "001": "gen", "000": "kun" };

// Harvard-Yenching line labels ("初九 …", "六二 …"): 九 is yang, 六 is yin. Hexagrams 1 and
// 2 carry a seventh line (用九, 用六) that is not a line of the figure.
export const linesFromLabels = (labels) => labels.slice(0, 6).map((l) => (l.split(" ")[0].includes("九") ? 1 : 0));

// Bottom line first, so lines 4 to 6 are indexes 3 to 5.
export const trigram = (lines) => TRIGRAMS[lines.slice(3, 6).join("")];

const firstSentence = (text) => text.match(/^.*?[.?!](\s|$)/)?.[0].trim() ?? text;

// Each upper trigram has one or more tracks, in music/sections.json order. The first goes to
// the doubled hexagram (lower trigram the same as the upper); the others, in number order,
// take the tracks in turn from the second, so the first track is not heard twice in a row.
// A section with `for` is kept for those hexagrams and out of the turns; such a hexagram
// still counts its turn, so no other hexagram's track moves.
const trackFor = (sections, lines) => {
  const turn = {};
  return (n) => {
    const upper = trigram(lines[n]);
    const tracks = sections.filter((s) => s.trigram === upper && !s.for);
    const kept = sections.find((s) => s.for?.includes(n));
    if (!tracks.length) return undefined;
    if (lines[n].slice(0, 3).join("") === lines[n].slice(3).join("")) return kept ?? tracks[0];
    turn[upper] = (turn[upper] ?? 0) + 1;
    return kept ?? tracks[turn[upper] % tracks.length];
  };
};

export const buildTable = ({ commentary, harvard, sections, copy, contentCommit }) => {
  const lines = Object.fromEntries(harvard.map((h) => [h.number, linesFromLabels(h.lines)]));
  const music = trackFor(sections, lines);
  const numbers = harvard.map((h) => h.number).sort((a, b) => a - b);
  const byNumber = Object.fromEntries(numbers.filter((n) => commentary[n]).map((n) => [n, music(n)]));
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
        music: byNumber[n],
        copy: copy[n] ?? null,
        source: { sixlinesContent: contentCommit },
      };
    });
};
