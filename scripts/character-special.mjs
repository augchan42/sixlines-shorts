// Writes a special (series/specials/character-N.json) that tries a character lesson on a
// hexagram's series short: its copy from series/copy.json with the lesson replaced by the
// character in series/characters.json, and the sentence series/lessons.json gives it (the
// character's own sentence if lessons.json has none for it). The series short is left alone.
//
//   node scripts/character-special.mjs 42 [47 ...]
// then  node scripts/character.mjs --special character-42  and  npm run series -- --special character-42
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const json = (f) => JSON.parse(readFileSync(path.join(root, f), "utf8"));
const copy = json("series/copy.json");
const { characters } = json("series/characters.json");
const lessons = json("series/lessons.json");

for (const n of process.argv.slice(2).map(Number)) {
  const c = characters.find((x) => x.number === n);
  if (!c || !copy[n]) (console.error(`hexagram ${n} needs copy and a character`), process.exit(1));
  const chosen = lessons.find((l) => l.number === n && l.kind === "character");
  const special = {
    hexagram: n,
    occasion: `A try of the character lesson on ${n} ${c.char}: the series short's copy, with the lesson replaced by the character.`,
    copy: {
      ...copy[n],
      lesson: {
        kind: "character",
        text: chosen?.text ?? c.sentence,
        source: chosen?.source ?? `series/characters.json#${n}: ${c.story}`,
        character: { char: c.char, beats: c.beats, args: c.args },
      },
    },
  };
  const out = `series/specials/character-${n}.json`;
  writeFileSync(path.join(root, out), `${JSON.stringify(special, null, 1)}\n`);
  console.log(`wrote ${out}`);
}
