// Checks series/copy-draft.json against the copy rules, except plates (picked after
// approval), and captions against 1 to 2 sentences. Prints every problem; exits 1 if any.
//
//   node scripts/copy-check.mjs
import { readFileSync } from "node:fs";
import path from "node:path";
import { copyProblems } from "./series/copy-rules.mjs";

const root = path.resolve(import.meta.dirname, "..");
const draft = JSON.parse(readFileSync(path.join(root, "series/copy-draft.json"), "utf8"));
let bad = 0;
for (const [n, e] of Object.entries(draft)) {
  const problems = copyProblems(Number(n), { ...e, plates: [`${n}-1`, `${n}-2`] }).filter((p) => !p.startsWith("plates"));
  const sentences = e.caption.text.split(/(?<=[.?!])\s+/).filter(Boolean).length;
  if (sentences > 2) problems.push(`caption: ${sentences} sentences`);
  for (const p of problems) console.log(`${n}: ${p}`);
  bad += problems.length;
}
console.log(bad ? `${bad} problems` : `${Object.keys(draft).length} entries, no problems`);
process.exit(bad ? 1 : 0);
