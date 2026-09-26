// Puts the chosen lessons (series/lessons.json) into the shorts' copy (series/copy.json), so the
// next render of those shorts shows them. Then run npm run series:table.
//
//   node scripts/lesson-apply.mjs 1,4,5[,...]
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { lessonCopy } from "./series/lesson-copy.mjs";

const root = path.resolve(import.meta.dirname, "..");
const json = (f) => JSON.parse(readFileSync(path.join(root, f), "utf8"));
const copy = json("series/copy.json");
const lessons = json("series/lessons.json");
const { characters } = json("series/characters.json");
const exists = (f) => existsSync(path.join(root, "public", f));

for (const n of process.argv[2].split(",").map(Number)) {
  const l = lessons.find((x) => x.number === n);
  if (!l || !copy[n]) (console.error(`hexagram ${n} needs copy and a lesson`), process.exit(1));
  copy[n].lesson = lessonCopy(l, characters, { exists });
  console.log(`${n}: ${l.kind}: ${l.text.replace("\n", " / ")}`);
}
writeFileSync(path.join(root, "series/copy.json"), `${JSON.stringify(copy, null, 1)}\n`);
