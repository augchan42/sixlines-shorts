// Builds the review table of the lessons (series/lessons.json): each lesson's critic score
// (1-10) and how clear the cold readers found it (1-5), with every lesson that is under 8,
// that a reader scored 3 or less, or that the judge found unclear listed first for review.
//
//   node scripts/lesson-table.mjs      writes series/critic/lessons/review.md
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const dir = path.join(root, "series/critic/lessons");
const read = (f) => JSON.parse(readFileSync(path.join(dir, f), "utf8"));
const lessons = JSON.parse(readFileSync(path.join(root, "series/lessons.json"), "utf8"));
const input = read("input.json");
const coldRead = read("cold-read.json");
const coldRewrites = read("cold-rewrites.json").lessons;
const coldRead2 = read("cold-read-2.json").readings;

// Every scored draft, oldest first, so the latest score of a text wins.
const scored = [
  ...read("result.json").history,
  ...read("result-run2.json").history,
  ...read("result-run3.json").candidates,
  ...read("rescore.json").scores,
];
const scoreOf = (l) => scored.filter((d) => d.number === l.number && d.text === l.text).at(-1)?.score;

const clarityOf = (l) => {
  const rewrite = coldRewrites.find((r) => r.number === l.number && r.text === l.text);
  if (rewrite) {
    const r = coldRead2.find((x) => x.number === l.number);
    return { clear: r.clear, guessed: r.guessed, verdict: null };
  }
  const readings = coldRead.readers.map((rd) => rd.find((x) => x.number === l.number));
  const v = coldRead.verdicts.find((x) => x.number === l.number);
  return { clear: readings.map((r) => r?.clear), guessed: readings.map((r) => r?.guessed).filter((g) => g && g !== "nothing").join("; "), verdict: v?.verdict };
};

const rows = lessons.map((l) => {
  const h = input.hexagrams.find((x) => x.number === l.number);
  const score = scoreOf(l);
  const c = clarityOf(l);
  const why = [];
  if (score === undefined) why.push("not scored");
  else if (score < 8) why.push(`score ${score}`);
  if (c.clear.some((x) => x <= 3)) why.push(`a reader scored it ${Math.min(...c.clear)} for clarity`);
  if (c.verdict && c.verdict !== "clear") why.push(`judge: ${c.verdict}`);
  return { l, name: h.name.split(" · ")[1] ?? h.name, score, c, why };
});

const kind = (l) => (l.kind === "line" ? `line ${l.line}` : l.kind === "lines" ? "trigrams" : l.kind);
const text = (l) => l.text.replace("\n", " / ");
const review = rows.filter((r) => r.why.length).sort((a, b) => (a.score ?? 0) - (b.score ?? 0) || a.l.number - b.l.number);
const ranked = [...rows].sort((a, b) => (b.score ?? 0) - (a.score ?? 0) || a.l.number - b.l.number);

const md = `# Lessons for review

Built by \`node scripts/lesson-table.mjs\` from \`series/lessons.json\`. Score is the critic's,
1-10 (run 3 and later: the average of two critics). Clear is how well each of two cold
readers, who see only the sentence and the picture, understood it, 1-5.

## For your review (${review.length})

Under 8, or a reader scored it 3 or less for clarity, or the judge found it unclear.

| # | Hexagram | Kind | Lesson | Score | Clear | Why it's here | What readers had to guess |
|---|---|---|---|---|---|---|---|
${review.map((r) => `| ${r.l.number} | ${r.name} | ${kind(r.l)} | ${text(r.l)} | ${r.score ?? "-"} | ${r.c.clear.join("/")} | ${r.why.join("; ")} | ${r.c.guessed || "nothing"} |`).join("\n")}

## All 64, by score

| Rank | # | Hexagram | Kind | Lesson | Score | Clear |
|---|---|---|---|---|---|---|
${ranked.map((r, i) => `| ${i + 1} | ${r.l.number} | ${r.name} | ${kind(r.l)} | ${text(r.l)} | ${r.score ?? "-"} | ${r.c.clear.join("/")} |`).join("\n")}
`;
writeFileSync(path.join(dir, "review.md"), md);
console.log(`wrote series/critic/lessons/review.md: ${review.length} for review`);
