// Writes series/hexagrams.json from sixlines-content, music/sections.json and
// series/copy.json.  npm run series:table   (SIXLINES_CONTENT to point elsewhere)
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { buildTable } from "./series/table.mjs";

const root = path.resolve(import.meta.dirname, "..");
const content = process.env.SIXLINES_CONTENT ?? path.resolve(root, "../sixlines-content");
const json = (p) => JSON.parse(readFileSync(p, "utf8"));

const harvard = json(path.join(content, "content/iching/harvardYenchingHexagrams.json"));
const commentary = Object.fromEntries(
  harvard.map(({ number: n }) => [n, json(path.join(content, `content/commentary/en/${n}.json`))]),
);
const copyFile = path.join(root, "series/copy.json");
const rows = buildTable({
  commentary,
  harvard,
  sections: json(path.join(root, "music/sections.json")).sections,
  copy: existsSync(copyFile) ? json(copyFile) : {},
  contentCommit: execFileSync("git", ["-C", content, "rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
});
if (rows.length !== 64) throw new Error(`expected 64 hexagrams, built ${rows.length}`);
writeFileSync(path.join(root, "series/hexagrams.json"), `${JSON.stringify(rows, null, 1)}\n`);
console.log(`wrote series/hexagrams.json (${rows.length} rows, ${rows.filter((r) => r.copy).length} with copy)`);
