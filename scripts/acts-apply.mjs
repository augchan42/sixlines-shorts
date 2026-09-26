// Puts the picture lessons the critic passed (series/critic/acts/lessons-drafts.json) into the
// shorts' copy (series/copy.json), in place of any earlier lesson: the sentence, its source,
// and the Blender scene that acts it (blender/acts.py, --act NAME). Then run
// npm run series:table, and node scripts/lesson3d.mjs --series N,.. for the clips.
//
//   node scripts/acts-apply.mjs [7,11,...]     # default: every draft
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const file = path.join(root, "series/copy.json");
const copy = JSON.parse(readFileSync(file, "utf8"));
const { drafts } = JSON.parse(readFileSync(path.join(root, "series/critic/acts/lessons-drafts.json"), "utf8"));
const wanted = process.argv[2] ? new Set(process.argv[2].split(",").map(Number)) : null;

for (const d of drafts) {
  if (wanted && !wanted.has(d.number)) continue;
  if (!copy[d.number]) (console.error(`hexagram ${d.number} has no copy`), process.exit(1));
  copy[d.number].lesson = {
    kind: "lines",
    text: d.text,
    source: d.source,
    scene: { script: "acts", args: { act: d.act, rain: "public/assets/3d/rain.mp4" } },
  };
  console.log(`${d.number}: ${d.text.replace("\n", " / ")}`);
}
writeFileSync(file, JSON.stringify(copy, null, 1) + "\n");
