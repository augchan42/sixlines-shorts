// Writes series/critic/paintings/brief.md: for each hexagram with a painting in the app's
// Library, the hexagram's name, its Image line and the short's two meaning lines, and the
// painting's title, artist and year, with the app's Art screenshot to look at. The app's
// own reasoning for each pairing is left out: the rater judges whether the link lands
// without it.
//
//   node scripts/painting-brief.mjs      (SIXLINES_CONTENT, SIXLINES_IOS default to ../)
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const content = process.env.SIXLINES_CONTENT ?? path.resolve(root, "../sixlines-content");
const ios = process.env.SIXLINES_IOS ?? path.resolve(root, "../sixlines-ios");
const json = (p) => JSON.parse(readFileSync(path.join(content, p), "utf8"));
const copy = JSON.parse(readFileSync(path.join(root, "series/copy.json"), "utf8"));
// Written into the brief relative to this repo, so the committed file names no home folder.
const iosInBrief = path.relative(root, ios);

const entries = json("content/masterpieces/artwork_index.json").flatMap(({ hexagram_number: n, artworks }) => {
  const a = artworks.find((x) => x.active === "both");
  if (!a) return [];
  const c = json(`content/commentary/en/${n}.json`);
  return [
    [
      `## ${n}. ${c.name_english} (${c.name_chinese} ${c.name_pinyin})`,
      "",
      `- Image: ${c.image.transliteration}`,
      `- Meaning: ${copy[n].meaning.map((m) => m.text.replace(/\n/g, " ")).join(" ")}`,
      `- Painting: *${a.title}*, ${a.artist}${a.year ? `, ${a.year}` : ""}`,
      `- Screenshot: ${iosInBrief}/gallery-library/matrix/library-art-matrix-${n}.png`,
      "",
    ].join("\n"),
  ];
});

writeFileSync(
  path.join(root, "series/critic/paintings/brief.md"),
  `# Paintings paired with hexagrams\n\n${entries.length} hexagrams of the I-Ching each have a painting paired with them in an app.\n\n${entries.join("\n")}`,
);
console.log(`wrote series/critic/paintings/brief.md (${entries.length} pairings)`);
