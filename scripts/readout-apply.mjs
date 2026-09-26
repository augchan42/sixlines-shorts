// Puts the readout lessons the critic passed (series/critic/readouts/drafts.json) into the
// shorts' copy (series/copy.json), in place of any earlier lesson, so the next render shows
// the readout (src/scenes/Readout.tsx). Then run npm run series:table.
//
//   node scripts/readout-apply.mjs [1,4,6,...]     # default: every draft
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const file = path.join(root, "series/copy.json");
const copy = JSON.parse(readFileSync(file, "utf8"));
const { drafts } = JSON.parse(readFileSync(path.join(root, "series/critic/readouts/drafts.json"), "utf8"));
const wanted = process.argv[2] ? new Set(process.argv[2].split(",").map(Number)) : null;

for (const d of drafts) {
  if (wanted && !wanted.has(d.number)) continue;
  if (!copy[d.number]) (console.error(`hexagram ${d.number} has no copy`), process.exit(1));
  copy[d.number].lesson = {
    kind: "lines",
    text: d.text,
    source: `series/critic/readouts/drafts.json#${d.number}`,
    readout: { mark: d.mark, finding: d.finding, ...(d.master ? { master: d.master } : {}) },
    readout_source: d.source,
  };
  console.log(`${d.number}: ${d.text.replace("\n", " / ")}`);
}
writeFileSync(file, JSON.stringify(copy, null, 1) + "\n");
