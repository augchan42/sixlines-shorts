// Merges the approved copy draft into series/copy.json with the plates the pickers chose
// (series/critic/plates/picks-*.json), checks every entry against the copy rules, and
// deletes series/copy-draft.json. Stops without writing if any entry has a problem.
//
//   node scripts/copy-merge.mjs
import { readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { copyProblems } from "./series/copy-rules.mjs";

const root = path.resolve(import.meta.dirname, "..");
const json = (p) => JSON.parse(readFileSync(path.join(root, p), "utf8"));
const draft = json("series/copy-draft.json");
const copy = json("series/copy.json");
const dir = "series/critic/plates";
const picks = Object.fromEntries(
  readdirSync(path.join(root, dir)).filter((f) => /^picks-\d+\.json$/.test(f)).flatMap((f) => json(`${dir}/${f}`)).map((p) => [p.number, p.plates]),
);
const problems = [];
for (const [n, e] of Object.entries(draft)) {
  if (copy[n]) problems.push(`${n}: already in copy.json`);
  const entry = { hook: e.hook, meaning: e.meaning, question: e.question, plates: picks[n], caption: e.caption };
  if (entry.plates?.[0] === entry.plates?.[1]) problems.push(`${n}: the two plates are the same`);
  for (const p of copyProblems(Number(n), entry)) problems.push(`${n}: ${p}`);
  copy[n] = entry;
}
if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
const sorted = Object.fromEntries(Object.entries(copy).sort(([a], [b]) => a - b));
writeFileSync(path.join(root, "series/copy.json"), `${JSON.stringify(sorted, null, 1)}\n`);
rmSync(path.join(root, "series/copy-draft.json"));
console.log(`series/copy.json has ${Object.keys(sorted).length} entries; deleted series/copy-draft.json`);
