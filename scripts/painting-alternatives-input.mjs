// Writes series/critic/paintings/alternatives-input.json: the hexagrams whose painting is
// not among the approved painting lessons (series/critic/paintings/approved.json), each with
// its Image line, the short's copy, and the app's current painting with its blind rating,
// for the workflow that looks for better public-domain paintings.
//
//   node scripts/painting-alternatives-input.mjs
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const content = process.env.SIXLINES_CONTENT ?? path.resolve(root, "../sixlines-content");
const json = (p) => JSON.parse(readFileSync(p, "utf8"));
const dir = path.join(root, "series/critic/paintings");
const approved = json(path.join(dir, "approved.json"));
const ratings = Object.fromEntries(json(path.join(dir, "ratings.json")).map((r) => [r.number, r]));
const copy = json(path.join(root, "series/copy.json"));
const index = Object.fromEntries(json(path.join(content, "content/masterpieces/artwork_index.json")).map((h) => [h.hexagram_number, h.artworks.find((a) => a.active === "both")]));
const text = (l) => l.text.replace(/\n/g, " ");

const approvedTitles = approved.numbers.map((n) => `${index[n].title}, ${index[n].artist}`);
const hexagrams = Array.from({ length: 64 }, (_, i) => i + 1)
  .filter((n) => !approved.numbers.includes(n))
  .map((n) => {
    const c = json(path.join(content, `content/commentary/en/${n}.json`));
    const e = copy[n];
    const a = index[n];
    return {
      number: n,
      name: `${c.name_english} (${c.name_chinese} ${c.name_pinyin})`,
      image: c.image.transliteration,
      copy: { hook: text(e.hook), meaning: e.meaning.map(text), question: text(e.question) },
      current: a ? { title: a.title, artist: a.artist, lands: ratings[n]?.lands, risk: ratings[n]?.risk, why: ratings[n]?.why } : null,
    };
  });
writeFileSync(path.join(dir, "alternatives-input.json"), `${JSON.stringify({ approvedTitles, hexagrams }, null, 1)}\n`);
console.log(`wrote series/critic/paintings/alternatives-input.json (${hexagrams.length} hexagrams)`);
