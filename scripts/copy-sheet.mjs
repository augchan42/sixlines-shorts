// Writes out/copy-sheet.md for reading the copy draft: each short's text as it appears on
// screen, in order, then the caption. Rewritten entries also show the version at REF, and
// the timeline rater's score and note on it when series/critic/copy/ratings-before.json exists.
// Every entry shows its score from the newest ratings-after*.json.
//
//   node scripts/copy-sheet.mjs [REF]    (default REF: the last commit that changed the draft)
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const git = (...a) => execFileSync("git", a, { cwd: root, encoding: "utf8" });
const ref = process.argv[2] ?? git("log", "-1", "--format=%h", "--", "series/copy-draft.json").trim();
const draft = JSON.parse(readFileSync(path.join(root, "series/copy-draft.json"), "utf8"));
const old = JSON.parse(git("show", `${ref}:series/copy-draft.json`));
const names = Object.fromEntries(JSON.parse(readFileSync(path.join(root, "series/hexagrams.json"), "utf8")).map((r) => [r.number, r]));
const ratingsFile = path.join(root, "series/critic/copy/ratings-before.json");
const load = (f) => (existsSync(f) ? Object.fromEntries(JSON.parse(readFileSync(f, "utf8")).map((r) => [r.number, r])) : {});
const newest = readdirSync(path.join(root, "series/critic/copy")).filter((f) => /^ratings-after\d*\.json$/.test(f)).sort((a, b) => a.length - b.length || a.localeCompare(b)).at(-1);
const after = newest ? load(path.join(root, "series/critic/copy", newest)) : {};
const ratings = existsSync(ratingsFile) ? Object.fromEntries(JSON.parse(readFileSync(ratingsFile, "utf8")).map((r) => [r.number, r])) : {};

const screen = (t) => t.split("\n").join("  \n");
const block = (c) => [
  `**${screen(c.hook.text)}**`,
  "",
  screen(c.meaning[0].text),
  "",
  screen(c.meaning[1].text),
  "",
  `*${screen(c.question.text)}*`,
  "",
  `> ${c.caption.text}`,
];
const changed = Object.keys(draft).filter((n) => JSON.stringify(draft[n]) !== JSON.stringify(old[n]));
const out = [
  "# Copy draft",
  "",
  `${Object.keys(draft).length} shorts. Each shows the hook (bold), the two meaning lines, the question (italic) with line breaks as on screen, then the post caption. The ${changed.length} rewritten ones (marked NEW) also show the version at ${ref}.`,
  "",
];
for (const [n, c] of Object.entries(draft)) {
  const r = names[n];
  const isNew = changed.includes(n);
  const now = after[n];
  out.push(`## ${n}. ${r.name} ${r.zh}${isNew ? " — NEW" : ""}${now ? ` — ${now.score}/10` : ""}`, "", ...block(c), "");
  if (now) out.push(`Rater: ${now.weakest}`, "");
  if (isNew) {
    const rt = ratings[n];
    out.push(`<details><summary>Was${rt ? ` (rated ${rt.score}: ${rt.weakest})` : ""}</summary>`, "", ...block(old[n]), "", "</details>", "");
  }
}
mkdirSync(path.join(root, "out"), { recursive: true });
writeFileSync(path.join(root, "out/copy-sheet.md"), out.join("\n"));
console.log(`wrote out/copy-sheet.md (${changed.length} rewritten, against ${ref})`);
