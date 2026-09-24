// Records a critic agent's review of a rendered short (out/critic/NN-trigram/review.json,
// written against series/critic/rubric.md) as series/critic/NN.json, with the hashes of the
// short, the stills and brief it saw (sheet.json), the rubric and the model, then prints a table.
//
//   node scripts/series-critic.mjs --model sonnet 1 2 29 ...
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";

const root = path.resolve(import.meta.dirname, "..");
const { values: a, positionals } = parseArgs({ options: { model: { type: "string" } }, allowPositionals: true });
if (!a.model || !positionals.length) {
  console.error("usage: node scripts/series-critic.mjs --model MODEL N [N ...]");
  process.exit(1);
}
const rubric = path.join(root, "series/critic/rubric.md");
const rubricSha = createHash("sha256").update(readFileSync(rubric)).digest("hex");

const KEYS = ["hook", "copy", "legibility", "visuals", "music fit", "showcase", "ending"];
const rows = [];
for (const n of positionals.map(Number)) {
  const nn = String(n).padStart(2, "0");
  const dir = readdirSync(path.join(root, "out/critic")).find((d) => d.startsWith(`${nn}-`));
  const review = path.join(root, "out/critic", dir ?? "", "review.json");
  if (!dir || !existsSync(review)) throw new Error(`no review for ${n}`);
  const r = JSON.parse(readFileSync(review, "utf8"));
  const sheet = JSON.parse(readFileSync(path.join(root, "out/critic", dir, "sheet.json"), "utf8"));
  const record = { hexagram: n, model: a.model, rubric: { path: "series/critic/rubric.md", sha256: rubricSha }, sheet, review: r };
  writeFileSync(path.join(root, "series/critic", `${nn}.json`), JSON.stringify(record, null, 1) + "\n");
  rows.push([n, dir.slice(3), r.overall, ...KEYS.map((k) => r.criteria[k] ?? "–")]);
}

console.log(`| # | track | overall | ${KEYS.join(" | ")} |`);
console.log(`|${"---|".repeat(KEYS.length + 3)}`);
for (const r of rows) console.log(`| ${r.join(" | ")} |`);
