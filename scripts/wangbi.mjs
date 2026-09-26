// Finds, in Wang Bi's own annotations (周易注, the 注 layer), the lines he names as a
// hexagram's master (主), for the readout lessons to mark (src/scenes/Readout.tsx). The
// annotations are the backend's: 8bitoracle-next/src/constants/wangBiZhu.ts, generated from
// the Zhouyi zhushu (周易註疏) of the Siku quanshu. Writes series/wangbi.json with each
// hexagram's master lines and the phrase that names them, in Chinese and English, and the
// backend's commit.
//
//   node --experimental-strip-types scripts/wangbi.mjs [path/to/8bitoracle-next]

import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import path from "node:path";

const repo = path.resolve(process.argv[2] ?? path.join(import.meta.dirname, "../../8bitoracle-next"));
const file = path.join(repo, "src/constants/wangBiZhu.ts");
const { WANG_BI_ZHU } = await import(file);
const commit = execFileSync("git", ["-C", repo, "log", "-1", "--format=%H", "--", "src/constants/wangBiZhu.ts"]).toString().trim();

// The phrases in which Wang Bi names a master: 之主 ("master of …"), 為主 ("is the master"), 卦主, 主也.
const MASTER = /[^，。；：「」]{0,8}(之主|為主|卦主|主也)[^，。；]{0,4}/g;
// The English sentence carrying the same idea.
const EN = /[^.;]*\b(master|ruler|lord)\b[^.;]*/gi;

const out = {};
for (const [n, h] of Object.entries(WANG_BI_ZHU)) {
  const masters = [];
  for (const [line, t] of Object.entries(h.lines)) {
    const zh = t.zh.match(MASTER);
    if (zh) masters.push({ line: Number(line), zh, en: t.en.match(EN)?.map((s) => s.trim()) ?? [] });
  }
  const judgment = h.judgment?.zh.match(MASTER);
  out[n] = {
    name: h.nameZh,
    masters,
    ...(judgment ? { judgment: { zh: judgment, en: h.judgment.en.match(EN)?.map((s) => s.trim()) ?? [] } } : {}),
  };
}

writeFileSync(
  path.join(import.meta.dirname, "../series/wangbi.json"),
  JSON.stringify({ source: `8bitoracle-next@${commit}:src/constants/wangBiZhu.ts`, script: "scripts/wangbi.mjs", hexagrams: out }, null, 1) + "\n",
);
const named = Object.values(out).filter((h) => h.masters.length || h.judgment);
console.log(`${named.length} of 64 hexagrams: Wang Bi names a master in a line or the Judgment`);
for (const [n, h] of Object.entries(out)) {
  if (h.masters.length) console.log(n, h.name, h.masters.map((m) => `L${m.line} ${m.zh.join("|")}`).join("  "));
}
