// Writes series/critic/copy/brief.md: the copy draft's entries, each with its hexagram's
// name, for a context-blind rater. The rater sees only what a viewer sees.
//
//   node scripts/copy-brief.mjs
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const draft = JSON.parse(readFileSync(path.join(root, "series/copy-draft.json"), "utf8"));
const rows = Object.fromEntries(JSON.parse(readFileSync(path.join(root, "series/hexagrams.json"), "utf8")).map((r) => [r.number, r]));
const one = (t) => t.replace(/\n/g, " / ");
const out = ["# Copy for 56 shorts", ""];
for (const [n, c] of Object.entries(draft)) {
  const r = rows[n];
  out.push(
    `## ${n}. ${r.name} (${r.pinyin})`,
    "",
    `- Hook: ${one(c.hook.text)}`,
    `- Meaning 1: ${one(c.meaning[0].text)}`,
    `- Meaning 2: ${one(c.meaning[1].text)}`,
    `- Question: ${one(c.question.text)}`,
    `- Caption: ${c.caption.text}`,
    "",
  );
}
writeFileSync(path.join(root, "series/critic/copy/brief.md"), out.join("\n"));
console.log(`wrote series/critic/copy/brief.md (${Object.keys(draft).length} entries)`);
