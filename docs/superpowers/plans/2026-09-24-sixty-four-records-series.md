# Sixty-Four Records Series Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render a ~30 s short for any of the 64 hexagrams with one command, from committed code and data, with a manifest that traces each render to its code, text and media.

**Architecture:** A generator builds `series/hexagrams.json` (one row per hexagram) from sixlines-content, `music/sections.json` and `series/copy.json`. `seriesProps(row, override)` turns a row into the props of one Remotion template, `src/templates/Series.tsx`, timed by `seriesPlan` from the drop. Separate scripts make the assets (Blender clips, app screens, plates), and `scripts/series.mjs` renders, encodes, captions and writes the manifest.

**Tech Stack:** Remotion 4.0.527, React, zod 4, Node 24 (`node --test`, runs `.ts` by stripping types), Blender 5.2 (existing `npm run blender`), ffmpeg/ffprobe, Xcode simulator (sixlines-ios gallery capture).

**Spec:** `docs/superpowers/specs/2026-09-24-sixty-four-records-series-design.md`

## Global Constraints

- 1080×1920, 30 fps. Total length ≤ 35 s. Text groups and app screens on screen ≥ 2 s.
- All text between y = 220 and y = 1500 (Instagram top 220 px and bottom 420 px clear).
- Badge: "N / 64 · SIXTY-FOUR RECORDS", shown until the drop.
- End card: "Cast yours free · Six Lines", then "sixlines.day".
- Copy: hook 3–7 words, meaning lines 3–6 words each, question ≤ 6 words; every line has a `source` (file#field, or `written`).
- Tone: no "AI", "should", "!", "fortune", "predict", "magic", "supernatural", "horoscope"; "I-Ching" hyphenated; 吉 is "favorable", 凶 is "adverse".
- Hashtags: 3–5, in the post caption only, never in the video.
- Nothing is thrown away: code, data, prototypes and result files are committed. Media (music, clips, screens, plates, renders) never enters git (public repo); its SHA-256 is committed.
- Share copies: yuv420p, `-movflags +faststart`, two-pass, under 25 MB.
- Every script skips files that already exist.
- Commit messages end with the attribution lines from the session's system reminder.

## Review Focus

1. **A music file that differs from the one analysed** (re-downloaded, re-encoded): the render stops and names the file, because the section times were measured on the recorded bytes. Pinned in Task 8 (`missingAssets` sha test).
2. **An override that changes tempo or drop** (e.g. a different section start): the clip name and length follow the merged values, not the table's. Pinned in Task 4 (`seriesProps` override test).
3. **One hexagram failing inside `all`** (missing screen, Blender error): the rest still render and the failures are listed at the end with a non-zero exit. Pinned in Task 8 (`renderAll` test).
4. **A meaning or question line with no line break that is too wide for the frame**: `npm test` fails before any render. Pinned in Task 3 (18-character line test).
5. **The 用九/用六 extra line in hexagrams 1 and 2**: `lines` has exactly six entries. Pinned in Task 2 (table test).

## Deviations from the spec (for review)

- **Overrides live in one file, `src/series/overrides.ts`**, not `series/overrides/N.ts`: the Remotion bundle cannot import a directory of files by number, and `tsconfig.json` only includes `src/`. One map keyed by hexagram number does the same job.
- **Plates are chosen with the copy**: each `series/copy.json` entry has `plates`, two Yilin plate keys picked to match the two meaning lines (e.g. 29: a figure walking into a storm for "keep moving", rushing water for "like water"). Never `N-N`: the verse screen already shows that plate.
- **The app screens vary** (user review, 2026-09-24: "you don't have to always use the same screenshots"): screen 1 is this hexagram's reading, screen 2 its verse, screen 3 rotates by hexagram number through today, records and journal, and screen 4 is always ask ("ASK · CAST · REFLECT").

## File structure

| File | Responsibility |
|---|---|
| `src/lib/seriesPlan.ts` (moved from `src/prototypes/`) | Beat plan from tempo and drop; adds `hexagramBeats`. |
| `scripts/series/table.mjs` | Pure: build table rows from sources. |
| `scripts/series-table.mjs` | CLI: read sources, write `series/hexagrams.json`. |
| `scripts/series/copy-rules.mjs` | Pure: list the problems in one copy entry. |
| `series/copy.json` | The copy, one entry per hexagram. |
| `src/schema.ts` | Adds `seriesSchema` / `SeriesProps`. |
| `src/series/props.ts` | Pure: row + override → `SeriesProps`. |
| `src/series/overrides.ts` | Per-hexagram overrides. |
| `src/scenes/Montage.tsx` | `HexagramTitle` moves above the bottom 420 px. |
| `src/templates/Series.tsx` | The template. |
| `src/Root.tsx` | Registers `Series`. |
| `scripts/series/render-lib.mjs` | Pure: slug, share bitrate, missing assets, clip jobs, renderAll, manifest. |
| `scripts/series/caption.mjs` | Pure: post caption. |
| `scripts/series-clips.mjs` | CLI: render missing Blender clips. |
| `scripts/series-screens.mjs` | CLI: copy app screens from the sixlines-ios gallery. |
| `scripts/series.mjs` | CLI: render, encode, caption, manifest. |
| `scripts/fetch-assets.mjs` | Skips plates already present. |
| `series/renders/NN.json`, `NN.txt` | Committed manifest and caption per render. |
| sixlines-ios `SixLinesUITests/YilinGalleryScreenshotTests.swift` | Also snapshots the reading screen. |

---

### Task 1: Move `seriesPlan` into `src/lib` and add `hexagramBeats`

**Files:**
- Move: `src/prototypes/seriesPlan.ts` → `src/lib/seriesPlan.ts`
- Modify: `src/prototypes/SeriesProto.tsx` (import path, clip length)
- Modify: `tests/series-plan.test.mjs`

**Interfaces:**
- Produces: `seriesPlan(bpm: number, drop: number): SeriesPlan` with fields `mode, hexagram, hexagramBeats, meaning, meaningLength, question, questionLength, drop, showcase, cta, end` (beats).

- [ ] **Step 1: Move the file and update imports**

```bash
git mv src/prototypes/seriesPlan.ts src/lib/seriesPlan.ts
sed -i '' 's#from "./seriesPlan"#from "../lib/seriesPlan"#' src/prototypes/SeriesProto.tsx
sed -i '' 's#../src/prototypes/seriesPlan.ts#../src/lib/seriesPlan.ts#' tests/series-plan.test.mjs
```

- [ ] **Step 2: Write the failing test** (append to `tests/series-plan.test.mjs`)

```js
test("the hexagram part is 8 beats, or 6 when the meaning needs the room", () => {
  assert.equal(seriesPlan(102, 14.12).hexagramBeats, 8);
  assert.equal(seriesPlan(82.5, byName.gen.drop).hexagramBeats, 6);
  assert.equal(seriesPlan(90, byName.kun.drop).hexagramBeats, 8);
});
```

- [ ] **Step 3: Run it and watch it fail**

Run: `node --test tests/series-plan.test.mjs`
Expected: FAIL, `undefined !== 8`.

- [ ] **Step 4: Implement.** In `src/lib/seriesPlan.ts` add `hexagramBeats: number;` to the type, `hexagramBeats: h,` to the before/short-hexagram return, and `hexagramBeats: 8,` to the `after` return. In `src/prototypes/SeriesProto.tsx` replace the body of `protoClip` with:

```ts
export const protoClip = (p: ProtoProps) => hexagramClip(p.hexagram.lines, p.bpm, seriesPlan(p.bpm, p.drop).hexagramBeats);
```

- [ ] **Step 5: Run the suite**

Run: `npm test && npm run typecheck`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/seriesPlan.ts src/prototypes tests/series-plan.test.mjs
git commit -m "Move seriesPlan to src/lib and give it the hexagram part's length"
```

---

### Task 2: The hexagram table

**Files:**
- Create: `scripts/series/table.mjs`, `scripts/series-table.mjs`, `tests/series-table.test.mjs`
- Create (generated): `series/hexagrams.json`
- Modify: `package.json` (script `series:table`)

**Interfaces:**
- Produces: `linesFromLabels(lines: string[]): (0|1)[]`, `trigram(lines): "qian"|"dui"|"li"|"zhen"|"xun"|"kan"|"gen"|"kun"`, `buildTable({ commentary, harvard, sections, copy, contentCommit }): Row[]`.
- `Row = { number, zh, pinyin, name, lines, upper, commentary, music, copy, source: { sixlinesContent } }` where `music` is the trigram's entry from `music/sections.json` and `copy` is the entry from `series/copy.json` (including its `plates`) or `null`.

- [ ] **Step 1: Write the failing tests**

```js
// tests/series-table.test.mjs
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { buildTable, linesFromLabels, trigram } from "../scripts/series/table.mjs";

test("line labels give the lines bottom first, ignoring 用九 and 用六", () => {
  assert.deepEqual(linesFromLabels(["初九 a", "九二 b", "九三 c", "九四 d", "九五 e", "上九 f", "用九 g"]), [1, 1, 1, 1, 1, 1]);
  assert.deepEqual(linesFromLabels(["初六 a", "九二 b", "六三 c", "六四 d", "九五 e", "上六 f"]), [0, 1, 0, 0, 1, 0]);
});

test("the upper trigram comes from lines 4 to 6", () => {
  assert.equal(trigram([0, 0, 0, 1, 1, 1]), "qian");
  assert.equal(trigram([1, 1, 1, 0, 1, 0]), "kan");
  assert.equal(trigram([0, 0, 0, 0, 0, 1]), "gen");
  assert.equal(trigram([0, 0, 0, 1, 1, 0]), "dui");
});

test("a row joins the sources", () => {
  const harvard = [
    { number: 29, lines: ["初六 a", "九二 b", "六三 c", "六四 d", "九五 e", "上六 f"] },
    { number: 30, lines: ["初九 a", "六二 b", "九三 c", "九四 d", "六五 e", "上九 f"] },
  ];
  const commentary = {
    29: { name_chinese: "坎", name_pinyin: "Kǎn", name_english: "The Abyss", judgment: { synthesis: "Danger doubled. More here." } },
    30: { name_chinese: "離", name_pinyin: "Lí", name_english: "The Clinging", judgment: { synthesis: "Fire. More." } },
  };
  const sections = [{ trigram: "kan", bpm: 100 }, { trigram: "li", bpm: 100 }];
  const [row] = buildTable({ commentary, harvard, sections, copy: {}, contentCommit: "abc123" });
  assert.deepEqual(
    { ...row, music: row.music.trigram },
    {
      number: 29, zh: "坎", pinyin: "Kǎn", name: "The Abyss", lines: [0, 1, 0, 0, 1, 0], upper: "kan",
      commentary: "Danger doubled.", music: "kan", copy: null,
      source: { sixlinesContent: "abc123" },
    },
  );
});

test("the committed table has all 64 hexagrams with the right lines", { skip: !existsSync("series/hexagrams.json") }, () => {
  const rows = JSON.parse(readFileSync("series/hexagrams.json", "utf8"));
  assert.equal(rows.length, 64);
  const lines = (n) => rows.find((r) => r.number === n).lines.join("");
  assert.equal(lines(1), "111111");
  assert.equal(lines(2), "000000");
  assert.equal(lines(29), "010010");
  assert.equal(lines(63), "101010");
});
```

- [ ] **Step 2: Run and watch it fail**

Run: `node --test tests/series-table.test.mjs`
Expected: FAIL, cannot find module `scripts/series/table.mjs`.

- [ ] **Step 3: Implement `scripts/series/table.mjs`**

```js
// Builds the series table (series/hexagrams.json) from its sources. Pure: the CLI in
// scripts/series-table.mjs reads the files and writes the result.

const TRIGRAMS = { "111": "qian", "110": "dui", "101": "li", "100": "zhen", "011": "xun", "010": "kan", "001": "gen", "000": "kun" };

// Harvard-Yenching line labels ("初九 …", "六二 …"): 九 is yang, 六 is yin. Hexagrams 1 and
// 2 carry a seventh line (用九, 用六) that is not a line of the figure.
export const linesFromLabels = (labels) => labels.slice(0, 6).map((l) => (l.split(" ")[0].includes("九") ? 1 : 0));

// Bottom line first, so lines 4 to 6 are indexes 3 to 5.
export const trigram = (lines) => TRIGRAMS[lines.slice(3, 6).join("")];

const firstSentence = (text) => text.match(/^.*?[.?!](\s|$)/)?.[0].trim() ?? text;

export const buildTable = ({ commentary, harvard, sections, copy, contentCommit }) => {
  const lines = Object.fromEntries(harvard.map((h) => [h.number, linesFromLabels(h.lines)]));
  const music = Object.fromEntries(sections.map((s) => [s.trigram, s]));
  return harvard
    .map((h) => h.number)
    .filter((n) => commentary[n])
    .map((n) => {
      const c = commentary[n];
      const upper = trigram(lines[n]);
      return {
        number: n,
        zh: c.name_chinese,
        pinyin: c.name_pinyin,
        name: c.name_english,
        lines: lines[n],
        upper,
        commentary: firstSentence(c.judgment.synthesis),
        music: music[upper],
        copy: copy[n] ?? null,
        source: { sixlinesContent: contentCommit },
      };
    });
};
```

- [ ] **Step 4: Implement the CLI `scripts/series-table.mjs`**

```js
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
```

Add to `package.json` scripts: `"series:table": "node scripts/series-table.mjs"`.

- [ ] **Step 5: Run the tests, generate, run again**

Run: `node --test tests/series-table.test.mjs && mkdir -p series && npm run series:table && node --test tests/series-table.test.mjs`
Expected: first run 3 pass, 1 skipped; `wrote series/hexagrams.json (64 rows, 0 with copy)`; second run 4 pass.

- [ ] **Step 6: Commit**

```bash
git add scripts/series scripts/series-table.mjs tests/series-table.test.mjs series/hexagrams.json package.json
git commit -m "Generate the series table from sixlines-content and the music sections"
```

---

### Task 3: Copy rules and the first copy entries

**Files:**
- Create: `scripts/series/copy-rules.mjs`, `tests/copy.test.mjs`, `series/copy.json`

**Interfaces:**
- Produces: `copyProblems(n: number, entry): string[]` (empty when the entry passes). Entry shape: `{ hook: {text, source}, meaning: [{text, source}, {text, source}], question: {text, source}, plates: [string, string], lineage?: string }`. `\n` in a text is a line break on screen; `plates` are Yilin keys `"N-k"` picked to match the two meaning lines.

- [ ] **Step 1: Write the failing tests**

```js
// tests/copy.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { copyProblems } from "../scripts/series/copy-rules.mjs";

const line = (text) => ({ text, source: "written" });
const entry = (over = {}) => ({
  hook: line("Can't stop overthinking?"),
  meaning: [line("Keeping Still\nsays: pause."), line("Stay with where\nyou are now.")],
  question: line("What can wait?"),
  plates: ["52-51", "52-40"],
  ...over,
});

test("a good entry has no problems", () => {
  assert.deepEqual(copyProblems(52, entry()), []);
});

test("word counts are enforced", () => {
  assert.match(copyProblems(52, entry({ hook: line("Stuck?") })).join(), /hook: 1 words/);
  assert.match(copyProblems(52, entry({ question: line("What could you honestly let wait today?") })).join(), /question: 7 words/);
});

test("a screen line over 18 characters is too wide for the frame", () => {
  assert.match(copyProblems(52, entry({ meaning: [line("Keeping Still says: pause."), line("Stay with where\nyou are now.")] })).join(), /too wide/);
});

test("the tone rules catch banned words, exclamation marks and I Ching without a hyphen", () => {
  for (const bad of ["You should rest.", "Rest now!", "The AI says so.", "Your fortune awaits.", "Ask the I Ching."]) {
    assert.notDeepEqual(copyProblems(52, entry({ question: line(bad) })), [], bad);
  }
});

test("plates are two of this hexagram's, never the one the verse screen shows", () => {
  assert.match(copyProblems(52, entry({ plates: ["52-52", "52-40"] })).join(), /52-52 is the verse screen's plate/);
  assert.match(copyProblems(52, entry({ plates: ["29-31", "52-40"] })).join(), /29-31 is not a plate of 52/);
  assert.match(copyProblems(52, entry({ plates: ["52-51"] })).join(), /plates: need two/);
});

test("every line names a source", () => {
  assert.match(copyProblems(52, entry({ hook: { text: "Can't stop overthinking?", source: "" } })).join(), /hook: no source/);
});

test("every entry in series/copy.json passes", () => {
  const copy = JSON.parse(readFileSync("series/copy.json", "utf8"));
  for (const [n, e] of Object.entries(copy)) assert.deepEqual(copyProblems(Number(n), e), [], `hexagram ${n}`);
});
```

- [ ] **Step 2: Run and watch it fail**

Run: `node --test tests/copy.test.mjs`
Expected: FAIL, cannot find module.

- [ ] **Step 3: Implement `scripts/series/copy-rules.mjs`**

```js
// The series copy rules (spec: "Copy"). Returns every problem in one entry.

// At 110 px in the code-rain font, about 18 characters fill the 940 px text column.
const MAX_LINE = 18;

const TONE = [
  [/\bAI\b/, "says AI"],
  [/\bshould\b/i, 'says "should"'],
  [/!/, "has an exclamation mark"],
  [/\b(fortunes?|predict\w*|magic\w*|supernatural|horoscopes?)\b/i, "uses fortune-telling words"],
  [/I Ching/, 'writes "I Ching" without the hyphen'],
];

const words = (text) => text.split(/\s+/).filter(Boolean).length;

export const copyProblems = (n, e) => {
  const problems = [];
  if (e.plates?.length !== 2) problems.push("plates: need two");
  for (const key of e.plates ?? []) {
    const [h, k] = key.split("-").map(Number);
    if (h !== n || !(k >= 1 && k <= 64)) problems.push(`plates: ${key} is not a plate of ${n}`);
    else if (k === n) problems.push(`plates: ${key} is the verse screen's plate`);
  }
  const parts = [
    ["hook", e.hook, 3, 7, false],
    ["meaning 1", e.meaning?.[0], 3, 6, true],
    ["meaning 2", e.meaning?.[1], 3, 6, true],
    ["question", e.question, 1, 6, true],
  ];
  for (const [name, part, min, max, onRain] of parts) {
    if (!part?.text) {
      problems.push(`${name}: missing`);
      continue;
    }
    if (!part.source) problems.push(`${name}: no source`);
    const n = words(part.text);
    if (n < min || n > max) problems.push(`${name}: ${n} words (${min}–${max})`);
    if (onRain) {
      for (const l of part.text.split("\n")) if (l.length > MAX_LINE) problems.push(`${name}: "${l}" is too wide (over ${MAX_LINE} characters)`);
    }
    for (const [re, why] of TONE) if (re.test(part.text)) problems.push(`${name}: ${why}`);
  }
  return problems;
};
```

- [ ] **Step 4: Write `series/copy.json`** with the prototyped entries (1, 2, 29, 52, 58). Plates are picked from each hexagram's 64 Yilin plates (one per transition N→k) to match the line: 1 a rider setting off (1-11), a figure walking through a gate into light (1-27); 2 a white horse (2-57), people bringing in a harvest together (2-32); 29 a figure walking into a storm (29-31), rushing water (29-60); 52 a figure sitting still by a wall (52-12), a figure sitting in a forest clearing (52-1); 58 friends at a feast (58-19), a lone swan on a dark lake (58-24)

```json
{
 "1": {
  "hook": { "text": "Waiting for a sign to start?", "source": "commentary/en/1.json#judgment.synthesis" },
  "meaning": [
   { "text": "The Creative\nsays: begin.", "source": "commentary/en/1.json#judgment.synthesis" },
   { "text": "No conditions.\nJust mean it.", "source": "commentary/en/1.json#judgment.synthesis" }
  ],
  "question": { "text": "What would you\nstart today?", "source": "written" },
  "plates": ["1-11", "1-27"]
 },
 "2": {
  "hook": { "text": "Tired of always having to lead?", "source": "commentary/en/2.json#judgment.synthesis" },
  "meaning": [
   { "text": "The Receptive\nsays: follow well.", "source": "commentary/en/2.json#judgment.synthesis" },
   { "text": "Supporting is its\nown strength.", "source": "commentary/en/2.json#image.synthesis" }
  ],
  "question": { "text": "Who could\nyou back?", "source": "written" },
  "plates": ["2-57", "2-32"]
 },
 "29": {
  "hook": { "text": "One problem after another?", "source": "commentary/en/29.json#judgment.synthesis" },
  "meaning": [
   { "text": "The Abyss says:\nkeep moving.", "source": "commentary/en/29.json#judgment.synthesis" },
   { "text": "Like water: fill\nit, flow on.", "source": "commentary/en/29.json#image.synthesis" }
  ],
  "question": { "text": "What's the next\nsmall step?", "source": "written" },
  "plates": ["29-31", "29-60"]
 },
 "52": {
  "hook": { "text": "Can't stop overthinking?", "source": "commentary/en/52.json#judgment.synthesis" },
  "meaning": [
   { "text": "Keeping Still\nsays: pause.", "source": "commentary/en/52.json#judgment.synthesis" },
   { "text": "Stay with where\nyou are now.", "source": "commentary/en/52.json#image.synthesis" }
  ],
  "question": { "text": "What can wait?", "source": "written" },
  "plates": ["52-12", "52-1"]
 },
 "58": {
  "hook": { "text": "Good news, no one to tell?", "source": "commentary/en/58.json#image.synthesis" },
  "meaning": [
   { "text": "The Joyous says:\nshare it.", "source": "commentary/en/58.json#image.synthesis" },
   { "text": "Joy kept alone\ndries up.", "source": "commentary/en/58.json#image.synthesis" }
  ],
  "question": { "text": "Who could you\ncall today?", "source": "written" },
  "plates": ["58-19", "58-24"]
 }
}
```

- [ ] **Step 5: Run, regenerate the table, run the suite**

Run: `node --test tests/copy.test.mjs && npm run series:table && npm test`
Expected: 7 pass; `wrote series/hexagrams.json (64 rows, 5 with copy)`; suite passes.

- [ ] **Step 6: Commit**

```bash
git add scripts/series/copy-rules.mjs tests/copy.test.mjs series/copy.json series/hexagrams.json
git commit -m "Check the series copy against the tone and length rules"
```

---

### Task 4: Series props and overrides

**Files:**
- Modify: `src/schema.ts` (add `seriesSchema`)
- Create: `src/series/props.ts`, `src/series/overrides.ts`, `tests/series-props.test.mjs`

**Interfaces:**
- Consumes: `seriesPlan` (Task 1), `Row` (Task 2), `hexagramClip` (`src/lib/clips.ts`).
- Produces: `SeriesProps` (below), `seriesProps(row: SeriesRow, override?: Partial<SeriesProps>): SeriesProps`, `overrides: Record<number, Partial<SeriesProps>>`.

- [ ] **Step 1: Add the schema** to the end of `src/schema.ts`

```ts
// One short of the Sixty-Four Records series (src/templates/Series.tsx), built from a row of
// series/hexagrams.json by src/series/props.ts.
export const seriesSchema = z.object({
  hexagram: hexagramSchema,
  bpm: z.number().positive(),
  firstBeat: z.number().min(0),
  music: z.string(),
  musicStart: z.number().min(0),
  // Seconds from musicStart to the drop.
  drop: z.number().positive(),
  hexagramClip: z.string(),
  hook: z.string(),
  meaning: z.tuple([z.string(), z.string()]),
  question: z.string(),
  // Paths under public/ of the plates behind the two meaning lines.
  plates: z.tuple([z.string(), z.string()]),
  screens: z.array(z.object({ src: z.string(), caption: z.string() })).length(4),
  cta: z.string(),
  url: z.string(),
});

export type SeriesProps = z.infer<typeof seriesSchema>;
```

- [ ] **Step 2: Write the failing tests**

```js
// tests/series-props.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import { seriesProps } from "../src/series/props.ts";

const line = (text) => ({ text, source: "written" });
const row = {
  number: 29, zh: "坎", pinyin: "Kǎn", name: "The Abyss", lines: [0, 1, 0, 0, 1, 0], upper: "kan",
  commentary: "Danger doubled.",
  music: { trigram: "kan", file: "pick09-synthwave.mp3", bpm: 100, start: 91.223, firstBeat: 0, drop: 14.4 },
  copy: { hook: line("One problem after another?"), meaning: [line("a b c"), line("d e f")], question: line("Next?"), plates: ["29-31", "29-60"] },
  source: { sixlinesContent: "abc" },
};

test("a row becomes the template's props", () => {
  const p = seriesProps(row);
  assert.equal(p.music, "local/music/pick09-synthwave.mp3");
  assert.equal(p.musicStart, 91.223);
  assert.equal(p.hexagramClip, "assets/3d/hexagram-010010-100bpm-8b.mp4");
  assert.deepEqual(p.plates, ["assets/yilin/stipple-29-31.webp", "assets/yilin/stipple-29-60.webp"]);
  assert.deepEqual(p.screens.map((s) => s.src), [
    "assets/screens/29/reading.png", "assets/screens/29/verse.png", "assets/matrix-records.png", "assets/matrix-ask.png",
  ]);
  assert.equal(p.url, "sixlines.day");
});

test("the third screen rotates so neighbouring shorts differ", () => {
  const third = (n) => seriesProps({ ...row, number: n }).screens[2].src;
  assert.deepEqual([third(27), third(28), third(29)], ["assets/matrix-today.png", "assets/matrix-journal.png", "assets/matrix-records.png"]);
  for (const n of [27, 28, 29]) assert.equal(seriesProps({ ...row, number: n }).screens[3].src, "assets/matrix-ask.png");
});

test("an override that changes the tempo changes the clip too", () => {
  const p = seriesProps(row, { bpm: 82.5, drop: 14.54 });
  assert.equal(p.hexagramClip, "assets/3d/hexagram-010010-82.5bpm-6b.mp4");
});

test("a row without copy cannot become a short", () => {
  assert.throws(() => seriesProps({ ...row, copy: null }), /hexagram 29 has no copy/);
});
```

- [ ] **Step 3: Run and watch it fail**

Run: `node --test tests/series-props.test.mjs`
Expected: FAIL, cannot find module `src/series/props.ts`.

- [ ] **Step 4: Implement `src/series/props.ts`**

```ts
import { hexagramClip } from "../lib/clips.ts";
import { seriesPlan } from "../lib/seriesPlan.ts";
import type { SeriesProps } from "../schema.ts";

type Line = { text: string; source: string };

// A row of series/hexagrams.json (scripts/series/table.mjs).
export type SeriesRow = {
  number: number;
  zh: string;
  pinyin: string;
  name: string;
  lines: (0 | 1)[];
  upper: string;
  commentary: string;
  music: { trigram: string; file: string; bpm: number; start: number; firstBeat: number; drop: number; sha256?: string; certificate?: { file: string; sha256: string } };
  copy: { hook: Line; meaning: [Line, Line]; question: Line; plates: [string, string]; lineage?: string } | null;
  source: { sixlinesContent: string };
};

const plate = (key: string) => `assets/yilin/stipple-${key}.webp`;

// Screen 3 rotates by hexagram number so neighbouring shorts differ; ask always closes.
const THIRD = [
  { src: "assets/matrix-today.png", caption: "YOUR DAY, READ" },
  { src: "assets/matrix-journal.png", caption: "KEEP YOUR RECORDS" },
  { src: "assets/matrix-records.png", caption: "SIXTY-FOUR RECORDS" },
];

export const seriesProps = (row: SeriesRow, override: Partial<SeriesProps> = {}): SeriesProps => {
  if (!row.copy) throw new Error(`hexagram ${row.number} has no copy in series/copy.json`);
  const n = row.number;
  const merged = {
    hexagram: { number: n, zh: row.zh, pinyin: row.pinyin, name: row.name, lines: row.lines },
    bpm: row.music.bpm,
    firstBeat: row.music.firstBeat,
    music: `local/music/${row.music.file}`,
    musicStart: row.music.start,
    drop: row.music.drop,
    hook: row.copy.hook.text,
    meaning: [row.copy.meaning[0].text, row.copy.meaning[1].text] as [string, string],
    question: row.copy.question.text,
    plates: [plate(row.copy.plates[0]), plate(row.copy.plates[1])] as [string, string],
    screens: [
      { src: `assets/screens/${n}/reading.png`, caption: "READ THE STRUCTURE" },
      { src: `assets/screens/${n}/verse.png`, caption: "THE BOOK OF CHANGES" },
      THIRD[n % THIRD.length],
      { src: "assets/matrix-ask.png", caption: "ASK · CAST · REFLECT" },
    ],
    cta: "Cast yours free · Six Lines",
    url: "sixlines.day",
    ...override,
  };
  // The clip follows the merged tempo and drop, so an override that moves either gets its own clip.
  const beats = seriesPlan(merged.bpm, merged.drop).hexagramBeats;
  return { ...merged, hexagramClip: override.hexagramClip ?? hexagramClip(merged.hexagram.lines, merged.bpm, beats) };
};
```

If `node --test` rejects the `.ts` extensions in imports, check `src/lib/clips.ts` imports in `tests/clips.test.mjs` for the working form and match it; if `tsc` rejects them, add `"allowImportingTsExtensions": true` to `tsconfig.json` (`noEmit` is already on).

- [ ] **Step 5: Implement `src/series/overrides.ts`** (empty to start: plates now live in `series/copy.json`)

```ts
import type { SeriesProps } from "../schema";

// Per-hexagram changes to the props seriesProps builds from series/hexagrams.json,
// e.g. a different music section or screen for one hexagram.
export const overrides: Record<number, Partial<SeriesProps>> = {};
```

- [ ] **Step 6: Run the tests and typecheck**

Run: `node --test tests/series-props.test.mjs && npm run typecheck`
Expected: 4 pass; typecheck clean.

- [ ] **Step 7: Commit**

```bash
git add src/schema.ts src/series tests/series-props.test.mjs tsconfig.json
git commit -m "Build series props from a table row, with per-hexagram overrides"
```

---

### Task 5: The Series template

**Files:**
- Create: `src/templates/Series.tsx`
- Modify: `src/scenes/Montage.tsx` (`HexagramTitle`), `src/Root.tsx`, `tsconfig.json` (`resolveJsonModule`)
- Test: `tests/series-plan.test.mjs` (safe-zone constant)

**Interfaces:**
- Consumes: `seriesPlan`, `SeriesProps`, `seriesSchema`, `seriesProps`, `overrides`.
- Produces: composition id `Series` (props = `SeriesProps`); `TITLE_BOTTOM` exported from `src/scenes/Montage.tsx`.

- [ ] **Step 1: Write the failing test** (append to `tests/series-plan.test.mjs`)

```js
import { TITLE_BOTTOM } from "../src/scenes/titleLayout.ts";

test("the hexagram names sit above Instagram's bottom 420 px", () => {
  assert.ok(TITLE_BOTTOM >= 420, `${TITLE_BOTTOM}`);
});
```

- [ ] **Step 2: Run and watch it fail**

Run: `node --test tests/series-plan.test.mjs`
Expected: FAIL, cannot find module `src/scenes/titleLayout.ts`.

- [ ] **Step 3: Implement.** Create `src/scenes/titleLayout.ts`:

```ts
// Distance from the bottom of the frame to the hexagram names. Instagram covers the bottom
// 420 px with its caption and buttons.
export const TITLE_BOTTOM = 440;
```

In `src/scenes/Montage.tsx` import it and change `HexagramTitle`'s `paddingBottom: 330` to `paddingBottom: TITLE_BOTTOM`.

- [ ] **Step 4: Run the test**

Run: `node --test tests/series-plan.test.mjs`
Expected: PASS.

- [ ] **Step 5: Create `src/templates/Series.tsx`** (from `src/prototypes/SeriesProto.tsx`, driven by `SeriesProps`, holding the hexagram over the rain when it ends before the drop)

```tsx
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { Camera, type Cut } from "../fx/Camera";
import { FxDefs, Grain } from "../fx/Glitch";
import { Soundtrack } from "../fx/Soundtrack";
import { fonts } from "../lib/fonts";
import { seriesPlan } from "../lib/seriesPlan";
import { beatFrame, GridContext, type Grid } from "../lib/timing";
import type { SeriesProps } from "../schema";
import { CaptionScreen } from "../scenes/CaptionScreen";
import { CodeRain } from "../scenes/CodeRain";
import { EndCard } from "../scenes/EndCard";
import { Hexagram3D } from "../scenes/Hexagram3D";
import { Hook } from "../scenes/Hook";

export const seriesFrames = (p: Pick<SeriesProps, "bpm" | "firstBeat" | "drop">, fps: number) =>
  beatFrame({ fps, bpm: p.bpm, firstBeat: p.firstBeat }, seriesPlan(p.bpm, p.drop).end);

const Badge: React.FC<{ n: number }> = ({ n }) => (
  <AbsoluteFill style={{ padding: "240px 70px 0", pointerEvents: "none" }}>
    <div style={{ fontFamily: fonts.pixel, fontSize: 44, color: "#6cff7a", textShadow: "0 0 12px #6cff7a" }}>
      {n} / 64 · SIXTY-FOUR RECORDS
    </div>
  </AbsoluteFill>
);

// One short of the Sixty-Four Records series. Parts are timed by seriesPlan from the drop.
export const Series: React.FC<SeriesProps> = (props) => {
  const { fps } = useVideoConfig();
  const grid: Grid = { fps, bpm: props.bpm, firstBeat: props.firstBeat };
  const s = seriesPlan(props.bpm, props.drop);
  const f = (b: number) => beatFrame(grid, b);
  const span = (a: number, b: number) => ({ from: f(a), durationInFrames: f(b) - f(a) });
  const half = s.meaningLength / 2;
  const hexEnd = s.hexagram + s.hexagramBeats;
  const screenBeats = (s.cta - s.showcase) / props.screens.length;
  const cuts: Cut[] = [
    { beat: s.hexagram, kind: "zoom" },
    { beat: s.meaning, kind: "whip-up" },
    { beat: s.meaning + half, kind: "whip-left" },
    { beat: s.question, kind: "whip-right" },
    { beat: s.drop, kind: "zoom" },
    ...props.screens.slice(1).map((_, i) => ({ beat: s.showcase + (i + 1) * screenBeats, kind: (i % 2 ? "whip-right" : "whip-left") as Cut["kind"] })),
    { beat: s.cta, kind: "zoom" },
  ];
  return (
    <GridContext.Provider value={grid}>
      <AbsoluteFill style={{ backgroundColor: "#000" }}>
        <FxDefs />
        <Soundtrack src={props.music} start={props.musicStart} fadeFrom={f(s.end - 2)} />
        <Camera
          cuts={cuts}
          motion={[
            { beat: -10, punch: 0, sway: 0.3 },
            { beat: s.meaning, punch: 0.03, sway: 0.4 },
            { beat: s.question, punch: 0, sway: 0.2 },
            { beat: s.drop, punch: 0.07, sway: 0.6 },
            { beat: s.cta, punch: 0, sway: 0.2 },
          ]}
          shakes={[{ beat: s.drop, strength: 45, beats: 1 }]}
        >
          <Sequence {...span(0, s.hexagram)}>
            <Hook text={props.hook} />
          </Sequence>
          <Sequence {...span(s.hexagram, hexEnd)}>
            <Hexagram3D hexagram={props.hexagram} clip={props.hexagramClip} />
          </Sequence>
          {/* After-drop timing with a drop later than the hexagram: rain until the drop. */}
          {s.mode === "after" && s.drop > hexEnd && (
            <Sequence {...span(hexEnd, s.drop)}>
              <CodeRain text="" showText={false} />
            </Sequence>
          )}
          {props.meaning.map((text, i) => (
            <Sequence key={text} {...span(s.meaning + i * half, s.meaning + (i + 1) * half)}>
              <CodeRain text={text} cuts={[{ frame: 0, src: props.plates[i] }]} />
            </Sequence>
          ))}
          <Sequence {...span(s.question, s.question + s.questionLength)}>
            <CodeRain text={props.question} />
          </Sequence>
          {props.screens.map((sc, i) => (
            <Sequence key={sc.src} {...span(s.showcase + i * screenBeats, s.showcase + (i + 1) * screenBeats)}>
              <CaptionScreen src={sc.src} caption={sc.caption} color={i % 2 ? "#ffb23f" : "#7dff8a"} seed={`cap-${i}`} />
            </Sequence>
          ))}
          <Sequence {...span(s.cta, s.end)}>
            <EndCard credit="~sixlines" cta={props.cta} url={props.url} icon="assets/icon.png" />
          </Sequence>
        </Camera>
        <Sequence from={0} durationInFrames={f(s.drop)}>
          <Badge n={props.hexagram.number} />
        </Sequence>
        <Grain />
      </AbsoluteFill>
    </GridContext.Provider>
  );
};
```

The spec's "hold the hexagram's last frame over code rain" is met by the rain alone: `Hexagram3D` ends when its clip does. If the hold looks empty on review, render the clip's last frame over the rain instead (record the change as a ruling).

- [ ] **Step 6: Register the composition.** Add `"resolveJsonModule": true` to `tsconfig.json`. In `src/Root.tsx` add:

```tsx
import table from "../series/hexagrams.json";
import { seriesSchema, type SeriesProps } from "./schema";
import { overrides } from "./series/overrides";
import { seriesProps, type SeriesRow } from "./series/props";
import { Series, seriesFrames } from "./templates/Series";

// The studio opens on 29; scripts/series.mjs passes each hexagram's props with --props.
const row29 = (table as SeriesRow[]).find((r) => r.number === 29)!;
```

and inside the fragment:

```tsx
    <Composition
      id="Series"
      component={Series}
      schema={seriesSchema}
      defaultProps={seriesProps(row29, overrides[29])}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={1}
      calculateMetadata={async ({ props }: { props: SeriesProps }) => {
        for (const file of [props.hexagramClip, props.music]) {
          const res = await fetch(staticFile(file));
          await res.body?.cancel();
          if (!res.ok) throw new Error(`${file} is missing. Run: npm run series:clips -- ${props.hexagram.number}`);
        }
        return { durationInFrames: seriesFrames(props, FPS) };
      }}
    />
```

(`seriesSchema` and `SeriesProps` join the existing `./schema` import line rather than adding a second one.)

- [ ] **Step 7: Typecheck and test**

Run: `npm run typecheck && npm test`
Expected: clean; all pass.

- [ ] **Step 8: Commit**

```bash
git add src/templates/Series.tsx src/scenes/titleLayout.ts src/scenes/Montage.tsx src/Root.tsx tsconfig.json tests/series-plan.test.mjs
git commit -m "Add the Series template and move the hexagram names out of the bottom 420 px"
```

---

### Task 6: Blender clips and plates for the series

**Files:**
- Create: `scripts/series/render-lib.mjs` (first functions), `scripts/series-clips.mjs`, `tests/series-render.test.mjs`
- Modify: `scripts/fetch-assets.mjs` (skip present plates), `package.json` (`series:clips`)

**Interfaces:**
- Consumes: `seriesProps`, `overrides`, `SeriesRow`.
- Produces: `clipJobs(propsList, exists: (publicPath) => boolean): { clip, lines, bpm, beats }[]`, `propsFor(rows, overrides, numbers): SeriesProps[]` (skips rows without copy only when asked for `all`), `parseNumbers(arg: string): number[] | "all"`.

- [ ] **Step 1: Write the failing tests**

```js
// tests/series-render.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import { clipJobs, parseNumbers } from "../scripts/series/render-lib.mjs";

test("hexagram arguments are a number, a list, or all", () => {
  assert.deepEqual(parseNumbers("29"), [29]);
  assert.deepEqual(parseNumbers("2,52"), [2, 52]);
  assert.equal(parseNumbers("all"), "all");
  assert.throws(() => parseNumbers("65"), /1 to 64/);
});

test("clip jobs skip clips that exist and never repeat one", () => {
  const p = (lines, bpm, clip) => ({ hexagram: { lines }, bpm, drop: 14.4, hexagramClip: clip });
  const jobs = clipJobs(
    [p([0, 1, 0, 0, 1, 0], 100, "a.mp4"), p([0, 1, 0, 0, 1, 0], 100, "a.mp4"), p([1, 1, 1, 1, 1, 1], 100, "b.mp4")],
    (clip) => clip === "b.mp4",
  );
  assert.deepEqual(jobs, [{ clip: "a.mp4", lines: "010010", bpm: 100, beats: 8 }]);
});
```

- [ ] **Step 2: Run and watch it fail**

Run: `node --test tests/series-render.test.mjs`
Expected: FAIL, cannot find module.

- [ ] **Step 3: Implement the start of `scripts/series/render-lib.mjs`**

```js
// Pure helpers for the series scripts (series-clips, series-screens, series).
import { seriesPlan } from "../../src/lib/seriesPlan.ts";

export const parseNumbers = (arg) => {
  if (arg === "all") return "all";
  const ns = String(arg ?? "").split(",").map(Number);
  if (!ns.length || ns.some((n) => !Number.isInteger(n) || n < 1 || n > 64)) {
    throw new Error(`hexagrams must be 1 to 64, a comma-separated list, or "all" (got ${arg})`);
  }
  return ns;
};

export const clipJobs = (propsList, exists) => {
  const seen = new Set();
  const jobs = [];
  for (const p of propsList) {
    if (seen.has(p.hexagramClip) || exists(p.hexagramClip)) continue;
    seen.add(p.hexagramClip);
    jobs.push({ clip: p.hexagramClip, lines: p.hexagram.lines.join(""), bpm: p.bpm, beats: seriesPlan(p.bpm, p.drop).hexagramBeats });
  }
  return jobs;
};
```

- [ ] **Step 4: Run the tests**

Run: `node --test tests/series-render.test.mjs`
Expected: 2 pass.

- [ ] **Step 5: Implement the CLI `scripts/series-clips.mjs`**

```js
// Renders the Blender clips the series needs, skipping any already in public/.
//   npm run series:clips -- 29 | 2,52 | all
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { overrides } from "../src/series/overrides.ts";
import { seriesProps } from "../src/series/props.ts";
import { clipJobs, parseNumbers } from "./series/render-lib.mjs";

const root = path.resolve(import.meta.dirname, "..");
const rows = JSON.parse(readFileSync(path.join(root, "series/hexagrams.json"), "utf8"));
const wanted = parseNumbers(process.argv[2]);
// Clips depend on lines and tempo only, so rows without copy still get theirs.
const withCopy = (r) => (r.copy ? r : { ...r, copy: { hook: { text: "" }, meaning: [{ text: "" }, { text: "" }], question: { text: "" } } });
const props = rows.filter((r) => wanted === "all" || wanted.includes(r.number)).map((r) => seriesProps(withCopy(r), overrides[r.number]));
const jobs = clipJobs(props, (clip) => existsSync(path.join(root, "public", clip)));
console.log(`${jobs.length} clip(s) to render`);
let failed = 0;
for (const [i, j] of jobs.entries()) {
  console.log(`[${i + 1}/${jobs.length}] ${j.clip}`);
  const run = spawnSync("node", ["scripts/blender.mjs", "--lines", j.lines, "--bpm", String(j.bpm), "--beats", String(j.beats)], { cwd: root, stdio: "inherit" });
  if (run.status !== 0) failed++;
}
if (failed) {
  console.error(`${failed} clip(s) failed; see out/blender-*.log`);
  process.exit(1);
}
```

Add to `package.json`: `"series:clips": "node scripts/series-clips.mjs"`.

- [ ] **Step 6: Make `fetch-assets` skip plates already present.** In `scripts/fetch-assets.mjs`, at the top of the `for (const [name, key] of Object.entries(downloads))` loop body, add:

```js
  try {
    await access(path.join(out, name));
    continue;
  } catch {}
```

- [ ] **Step 7: Verify both scripts**

Run: `npm run series:clips -- 29,2` then `npm run assets -- --hexagram 29`
Expected: `1 clip(s) to render` or `0 clip(s) to render` for hexagram 2 (its clip exists from the prototype); the hexagram 29 clip renders (the prototype run may have made it already). The asset run prints `fetched` only for missing plates, and a second run prints no `fetched yilin/` lines.

- [ ] **Step 8: Commit**

```bash
git add scripts/series/render-lib.mjs scripts/series-clips.mjs scripts/fetch-assets.mjs tests/series-render.test.mjs package.json
git commit -m "Render the series' Blender clips and skip plates already downloaded"
```

---

### Task 7: App screens for each hexagram

**Files:**
- Modify (sixlines-ios repo, on a branch): `SixLinesUITests/YilinGalleryScreenshotTests.swift`
- Create: `scripts/series-screens.mjs`
- Modify: `scripts/series/render-lib.mjs` (`screenFiles`), `tests/series-render.test.mjs`, `package.json` (`series:screens`)

**Interfaces:**
- Produces: `screenFiles(n, gallery): { from, to }[]` with `to` = `public/assets/screens/N/reading.png` and `.../verse.png`.

- [ ] **Step 1: Snapshot the reading screen in sixlines-ios.** In `/Users/auchan/projects/sixlines-ios`, on a new branch `gallery-reading-screens`, in `testCaptureYilinGallery` directly after the `sleep(5)` that follows `launchReading`, add:

```swift
            // The reading itself, before the verse card: the Six Lines shorts use it as
            // their "READ THE STRUCTURE" screen for this hexagram.
            snapshot("reading-\(appearance)-\(label)")
```

Commit there: `git commit -am "Snapshot the reading screen in the Yilin gallery tour"`.

- [ ] **Step 2: Write the failing test** (append to `tests/series-render.test.mjs`)

```js
import { screenFiles } from "../scripts/series/render-lib.mjs";

test("each hexagram takes its reading and verse screens from the Matrix gallery", () => {
  assert.deepEqual(screenFiles(29, "/g"), [
    { from: "/g/matrix/reading-matrix-29-29.png", to: "public/assets/screens/29/reading.png" },
    { from: "/g/matrix/yilin-matrix-29-29.png", to: "public/assets/screens/29/verse.png" },
  ]);
});
```

- [ ] **Step 3: Run and watch it fail**

Run: `node --test tests/series-render.test.mjs`
Expected: FAIL, `screenFiles` is not exported.

- [ ] **Step 4: Implement** in `scripts/series/render-lib.mjs`:

```js
// scripts/capture_gallery.sh in sixlines-ios writes gallery/<appearance>/<snapshot>.png.
export const screenFiles = (n, gallery) => [
  { from: `${gallery}/matrix/reading-matrix-${n}-${n}.png`, to: `public/assets/screens/${n}/reading.png` },
  { from: `${gallery}/matrix/yilin-matrix-${n}-${n}.png`, to: `public/assets/screens/${n}/verse.png` },
];
```

and `scripts/series-screens.mjs`:

```js
// Copies each hexagram's reading and verse screens from the sixlines-ios gallery, skipping
// any already present. Capture them first, all 64 in one run (the script clears its output):
//   cd ../sixlines-ios && APPEARANCES=matrix PAIRS="1-1,2-2,…,64-64" scripts/capture_gallery.sh yilin
//   npm run series:screens
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { screenFiles } from "./series/render-lib.mjs";

const root = path.resolve(import.meta.dirname, "..");
const gallery = path.join(process.env.SIXLINES_IOS ?? path.resolve(root, "../sixlines-ios"), "gallery");
const missing = [];
for (let n = 1; n <= 64; n++) {
  for (const { from, to } of screenFiles(n, gallery)) {
    const dest = path.join(root, to);
    if (existsSync(dest)) continue;
    if (!existsSync(from)) {
      missing.push(path.relative(root, from));
      continue;
    }
    mkdirSync(path.dirname(dest), { recursive: true });
    copyFileSync(from, dest);
    console.log(`copied   ${to}`);
  }
}
if (missing.length) console.error(`${missing.length} screen(s) not in the gallery, e.g. ${missing[0]}`);
```

Add to `package.json`: `"series:screens": "node scripts/series-screens.mjs"`.

- [ ] **Step 5: Run the tests**

Run: `node --test tests/series-render.test.mjs`
Expected: 3 pass.

- [ ] **Step 6: Capture and copy** (about 2 hours for 64 pages; run in the background)

```bash
cd /Users/auchan/projects/sixlines-ios && APPEARANCES=matrix PAIRS="$(seq -s, -f '%g-%g' 1 64 | sed 's/\([0-9]*\)-[0-9]*/\1-\1/g')" scripts/capture_gallery.sh yilin
cd /Users/auchan/projects/sixlines-shorts && npm run series:screens
```

Check the `PAIRS` value first with `echo`: it must read `1-1,2-2,…,64-64`.
Expected: `copied` lines for 128 files and no missing count. Open two of the reading screens and two of the verse screens to check that they show the right hexagram in the Matrix skin.

- [ ] **Step 7: Commit**

```bash
git add scripts/series/render-lib.mjs scripts/series-screens.mjs tests/series-render.test.mjs package.json
git commit -m "Copy each hexagram's reading and verse screens from the sixlines-ios gallery"
```

---

### Task 8: The render script, captions and manifest

**Files:**
- Modify: `scripts/series/render-lib.mjs`, `tests/series-render.test.mjs`
- Create: `scripts/series/caption.mjs`, `scripts/series.mjs`, `tests/series-caption.test.mjs`
- Modify: `package.json` (`series`), `README.md`

**Interfaces:**
- Produces: `slug(pinyin)`, `shareBitrate(seconds): number` (kbps), `missingAssets(props, row, { exists, sha256 }): string[]`, `renderAll(numbers, renderOne): Promise<{ done: number[], failures: { n, message }[] }>`, `postCaption(row): string`.

- [ ] **Step 1: Write the failing tests** (append to `tests/series-render.test.mjs`)

```js
import { missingAssets, renderAll, shareBitrate, slug } from "../scripts/series/render-lib.mjs";

test("folder names drop the tone marks", () => {
  assert.equal(slug("Kǎn"), "kan");
  assert.equal(slug("Gèn"), "gen");
});

test("the share bitrate keeps a short under 25 MB", () => {
  for (const s of [27.5, 30, 34.2]) assert.ok(((shareBitrate(s) + 128) * 1000 * s) / 8 < 24e6, `${s} s`);
  assert.equal(shareBitrate(10), 8000);
});

test("a music file that is not the analysed one stops the render", () => {
  const props = { music: "local/music/a.mp3", hexagramClip: "c.mp4", screens: [], plates: [], hexagram: { number: 29 } };
  const row = { music: { sha256: "good", certificate: { file: "a.txt", sha256: "cert" } } };
  const io = { exists: () => true, sha256: (f) => (f.endsWith("a.txt") ? "cert" : "bad") };
  assert.match(missingAssets(props, row, io).join(), /local\/music\/a.mp3 is not the analysed file/);
});

test("all mode renders the rest and lists the failures", async () => {
  const r = await renderAll([1, 2, 3], async (n) => {
    if (n === 2) throw new Error("no clip");
  });
  assert.deepEqual(r, { done: [1, 3], failures: [{ n: 2, message: "no clip" }] });
});
```

```js
// tests/series-caption.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import { postCaption } from "../scripts/series/caption.mjs";

test("the post caption names the hexagram, links the site and has 3 to 5 hashtags", () => {
  const c = postCaption({ number: 29, zh: "坎", pinyin: "Kǎn", name: "The Abyss", commentary: "Danger doubled.", copy: { lineage: "Jung called it synchronicity." } });
  assert.match(c, /^29 · 坎 Kǎn · The Abyss/);
  assert.match(c, /Danger doubled\./);
  assert.match(c, /Jung called it synchronicity\./);
  assert.match(c, /sixlines\.day/);
  const tags = c.match(/#\w+/g);
  assert.ok(tags.length >= 3 && tags.length <= 5);
});
```

- [ ] **Step 2: Run and watch them fail**

Run: `node --test tests/series-render.test.mjs tests/series-caption.test.mjs`
Expected: FAIL, missing exports and module.

- [ ] **Step 3: Implement** in `scripts/series/render-lib.mjs`:

```js
export const slug = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-");

// Video kbps for a two-pass encode that lands near 23 MB with 128k audio, capped at 8000.
export const shareBitrate = (seconds) => Math.min(8000, Math.floor((23e6 * 8) / 1000 / seconds) - 128);

// Everything the render needs that is missing or not the recorded file, each with the
// command that makes it. Paths are under public/.
export const missingAssets = (props, row, { exists, sha256 }) => {
  const n = props.hexagram.number;
  const problems = [];
  const need = (file, fix) => {
    if (!exists(file)) problems.push(`${file} is missing. Run: ${fix}`);
  };
  need(props.music, "copy the track into public/local/music/ (see music/sections.json)");
  if (exists(props.music) && row.music.sha256 && sha256(props.music) !== row.music.sha256) {
    problems.push(`${props.music} is not the analysed file (sha256 differs from music/sections.json)`);
  }
  const cert = row.music.certificate && `local/music/certificates/${row.music.certificate.file}`;
  if (cert) {
    need(cert, "download the Pixabay licence certificate (music/sections.json)");
    if (exists(cert) && sha256(cert) !== row.music.certificate.sha256) problems.push(`${cert} is not the recorded certificate`);
  }
  need(props.hexagramClip, `npm run series:clips -- ${n}`);
  for (const s of props.screens) need(s.src, "npm run series:screens");
  for (const p of props.plates) need(p, `npm run assets -- --hexagram ${n}`);
  return problems;
};

export const renderAll = async (numbers, renderOne) => {
  const done = [];
  const failures = [];
  for (const n of numbers) {
    try {
      await renderOne(n);
      done.push(n);
    } catch (e) {
      failures.push({ n, message: e.message });
    }
  }
  return { done, failures };
};
```

and `scripts/series/caption.mjs`:

```js
// The post caption for one short. Hashtags live here only, never in the video.
const TAGS = ["#iching", "#bookofchanges", "#synthwave", "#sixlines"];

export const postCaption = (row) =>
  [
    `${row.number} · ${row.zh} ${row.pinyin} · ${row.name}`,
    row.commentary,
    row.copy?.lineage,
    "Cast yours free: sixlines.day",
    TAGS.join(" "),
  ]
    .filter(Boolean)
    .join("\n\n") + "\n";
```

- [ ] **Step 4: Run the tests**

Run: `node --test tests/series-render.test.mjs tests/series-caption.test.mjs`
Expected: all pass.

- [ ] **Step 5: Implement the CLI `scripts/series.mjs`**

```js
// Renders series shorts: npm run series -- 29 | 2,52 | all
// Per short, out/series/NN-pinyin/ gets short.mp4, share.mp4, caption.txt, props.json and
// manifest.json; the manifest and caption are also copied to series/renders/ for committing.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { overrides } from "../src/series/overrides.ts";
import { seriesProps } from "../src/series/props.ts";
import { postCaption } from "./series/caption.mjs";
import { missingAssets, parseNumbers, renderAll, shareBitrate, slug } from "./series/render-lib.mjs";

const root = path.resolve(import.meta.dirname, "..");
const pub = (f) => path.join(root, "public", f);
const sha256 = (f) => createHash("sha256").update(readFileSync(pub(f))).digest("hex");
const shaAbs = (f) => createHash("sha256").update(readFileSync(f)).digest("hex");
const run = (cmd, args) => execFileSync(cmd, args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const rows = JSON.parse(readFileSync(path.join(root, "series/hexagrams.json"), "utf8"));
const wanted = parseNumbers(process.argv[2]);
const numbers = wanted === "all" ? rows.filter((r) => r.copy).map((r) => r.number) : wanted;

const renderOne = async (n) => {
  const row = rows.find((r) => r.number === n);
  const props = seriesProps(row, overrides[n]);
  const problems = missingAssets(props, row, { exists: (f) => existsSync(pub(f)), sha256 });
  if (problems.length) throw new Error(problems.join("\n  "));

  const nn = String(n).padStart(2, "0");
  const dir = path.join(root, "out/series", `${nn}-${slug(row.pinyin)}`);
  mkdirSync(dir, { recursive: true });
  const propsFile = path.join(dir, "props.json");
  writeFileSync(propsFile, JSON.stringify(props, null, 1));
  const short = path.join(dir, "short.mp4");
  const share = path.join(dir, "share.mp4");
  console.log(`[${n}] rendering`);
  run("npx", ["remotion", "render", "src/index.ts", "Series", short, `--props=${propsFile}`, "--log=error"]);

  const seconds = Number(run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", short]).trim());
  const kbps = shareBitrate(seconds);
  const enc = (pass, out) => [
    "-v", "error", "-y", "-i", short, "-vf", "scale=in_range=full:out_range=tv,format=yuv420p",
    "-c:v", "libx264", "-b:v", `${kbps}k`, "-pass", String(pass), "-passlogfile", path.join(dir, "x264"),
    ...(pass === 1 ? ["-an", "-f", "mp4", out] : ["-c:a", "aac", "-b:a", "128k", "-ar", "44100", "-movflags", "+faststart", out]),
  ];
  run("ffmpeg", enc(1, "/dev/null"));
  run("ffmpeg", enc(2, share));

  const caption = postCaption(row);
  writeFileSync(path.join(dir, "caption.txt"), caption);
  const commit = run("git", ["rev-parse", "HEAD"]).trim();
  const clean = run("git", ["status", "--porcelain"]).trim() === "";
  const files = Object.fromEntries(
    [props.music, `local/music/certificates/${row.music.certificate.file}`, props.hexagramClip, ...props.screens.map((s) => s.src), ...props.plates].map((f) => [f, sha256(f)]),
  );
  files[`out/series/${path.basename(dir)}/short.mp4`] = shaAbs(short);
  files[`out/series/${path.basename(dir)}/share.mp4`] = shaAbs(share);
  const manifest = { hexagram: n, rendered: new Date().toISOString(), commit, clean, seconds, shareKbps: kbps, props, files };
  writeFileSync(path.join(dir, "manifest.json"), `${JSON.stringify(manifest, null, 1)}\n`);
  mkdirSync(path.join(root, "series/renders"), { recursive: true });
  copyFileSync(path.join(dir, "manifest.json"), path.join(root, "series/renders", `${nn}.json`));
  copyFileSync(path.join(dir, "caption.txt"), path.join(root, "series/renders", `${nn}.txt`));
  console.log(`[${n}] ${path.relative(root, share)} (${seconds.toFixed(1)} s)`);
};

const { done, failures } = await renderAll(numbers, renderOne);
console.log(`rendered ${done.length} of ${numbers.length}`);
for (const f of failures) console.error(`hexagram ${f.n}:\n  ${f.message}`);
if (failures.length) process.exit(1);
```

Add to `package.json`: `"series": "node scripts/series.mjs"`.

- [ ] **Step 6: Render hexagram 29 end to end**

Run: `npm run series -- 29`
Expected: without screens yet, it fails listing `assets/screens/29/reading.png is missing. Run: npm run series:screens` (and the verse screen). After Task 7's capture, it prints `[29] out/series/29-kan/share.mp4 (30.6 s)`. Check `ls -la out/series/29-kan/share.mp4` is under 25 MB, and `ffprobe -v error -show_entries stream=pix_fmt out/series/29-kan/share.mp4` prints `yuv420p`.

- [ ] **Step 7: Document.** Add to `README.md` under `## Use`:

```sh
npm run series:table                            # rebuild series/hexagrams.json after editing series/copy.json
npm run series:clips -- all                     # Blender clips the series needs (hours; skips existing)
npm run series:screens                          # app screens from the sixlines-ios gallery
npm run series -- 29                            # one short → out/series/29-kan/, record in series/renders/
```

- [ ] **Step 8: Commit**

```bash
git add scripts/series scripts/series.mjs tests/series-render.test.mjs tests/series-caption.test.mjs package.json README.md series/renders
git commit -m "Render series shorts with a share copy, post caption and manifest"
```

---

### Task 9: One short per trigram, reviewed

**Files:**
- Modify: `series/copy.json`, `series/hexagrams.json` (regenerated)
- Create (committed): `series/renders/NN.json`, `NN.txt` for the rendered hexagrams

- [ ] **Step 1: Draft copy for one hexagram per trigram not yet covered**: 51 (Zhen), 57 (Xun), 30 (Li), following the spec's copy rules and the notes (plain words, one connected thought; a short observation from `practicalIntegration` where it fits). Pick each entry's two plates from its contact sheet. Add them to `series/copy.json`.

- [ ] **Step 2: Check and regenerate**

Run: `npm test && npm run series:table`
Expected: pass; `64 rows, 8 with copy`.

- [ ] **Step 3: Render the eight**

Run: `npm run series:clips -- 1,2,29,30,51,52,57,58 && npm run assets -- --hexagram 1,2,29,30,51,52,57,58 && npm run series -- 1,2,29,30,51,52,57,58`
Expected: `rendered 8 of 8`.

- [ ] **Step 4: Send the eight share copies to the user** (SendUserFile) and wait for their review. This is a stop: the batch render (Task 10) starts only after the user approves these. Record requested changes as fixes to the copy, overrides or template, each committed.

- [ ] **Step 5: Commit the records**

```bash
git add series/copy.json series/hexagrams.json series/renders
git commit -m "Render and record one series short per trigram"
```

---

### Task 10: All 64

- [ ] **Step 1: Draft the copy and plates for the remaining 56 hexagrams** in `series/copy.json`, run `npm test`, and send the full list (hexagram, hook, line 1, line 2, question) to the user as one table. Stop until the user approves it; apply their edits.

- [ ] **Step 2: Regenerate, make the assets, render**

Run: `npm run series:table && npm run series:clips -- all && npm run assets -- --hexagram $(seq -s, 1 64) && npm run series -- all`
Expected: `rendered 64 of 64` (the clips take hours; run in the background).

- [ ] **Step 3: Spot-check** four renders' manifests: `files` hashes match `shasum -a 256` of the files, `clean` is `true`.

- [ ] **Step 4: Commit**

```bash
git add series/copy.json series/hexagrams.json series/renders
git commit -m "Render all 64 Sixty-Four Records shorts"
```
