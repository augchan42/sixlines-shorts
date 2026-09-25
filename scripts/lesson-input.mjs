// Writes series/critic/lessons/input.json: for each hexagram, what a lesson can be drawn
// from (the Judgment, the Image and the six line texts, each with the app's commentary),
// its trigrams, the short's own copy (so the lesson does not repeat it), and the paintings
// that could open a painting lesson. Input for the lesson draft-and-critic workflow.
//
//   node scripts/lesson-input.mjs
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const content = process.env.SIXLINES_CONTENT ?? path.resolve(root, "../sixlines-content");
const json = (p) => JSON.parse(readFileSync(p, "utf8"));
const critic = path.join(root, "series/critic");
const rows = json(path.join(root, "series/hexagrams.json"));
const copy = json(path.join(root, "series/copy.json"));
const approved = json(path.join(critic, "paintings/approved.json")).numbers;
const ratings = Object.fromEntries(json(path.join(critic, "paintings/ratings.json")).map((r) => [r.number, r]));
const alternatives = json(path.join(critic, "paintings/alternatives.json")).best;
const index = Object.fromEntries(json(path.join(content, "content/masterpieces/artwork_index.json")).map((h) => [h.hexagram_number, h.artworks.find((a) => a.active === "both")]));
const TRIGRAMS = { "111": "HEAVEN 天", "000": "EARTH 地", "100": "THUNDER 雷", "010": "WATER 水", "001": "MOUNTAIN 山", "011": "WIND 風", "101": "FIRE 火", "110": "LAKE 澤" };
const text = (l) => l.text.replace(/\n/g, " / ");
// A painting is offered only where the link landed at a glance: an approved app painting
// the blind rater gave lands 4+, or a public-domain alternative the critic scored 9 with lands 5.
const paintingFor = (n) => {
  if (approved.includes(n) && ratings[n]?.lands >= 4) return { title: index[n].title, artist: index[n].artist, why: ratings[n].why };
  const a = alternatives[n];
  if (a && a.critique.score >= 9 && a.critique.lands >= 5) return { title: a.title, artist: a.artist, year: a.year, why: a.critique.feedback };
  return null;
};

const hexagrams = rows.map((r) => {
  const c = json(path.join(content, `content/commentary/en/${r.number}.json`));
  const e = copy[r.number];
  return {
    number: r.number,
    name: `${r.zh} ${r.pinyin} · ${r.name}`,
    trigrams: { upper: TRIGRAMS[r.lines.slice(3).join("")], lower: TRIGRAMS[r.lines.slice(0, 3).join("")] },
    judgment: c.judgment,
    image: c.image,
    lines: c.lines.map((l, i) => ({ line: i + 1, ...l })),
    copy: { hook: text(e.hook), meaning: e.meaning.map(text), question: text(e.question) },
    painting: paintingFor(r.number),
  };
});
writeFileSync(path.join(critic, "lessons/input.json"), `${JSON.stringify({ hexagrams }, null, 1)}\n`);
console.log(`wrote series/critic/lessons/input.json (${hexagrams.length} hexagrams, ${hexagrams.filter((h) => h.painting).length} with a painting on offer)`);
