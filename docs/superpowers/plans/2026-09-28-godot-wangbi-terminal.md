# Wang Bi Terminal (Godot) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Godot 4.7.2 terminal, exported for the web, where a viewer taps a hexagram's six lines and reads it as the Wang Bi lesson does. It shows each line's place, the centres, the answering pairs, and the master line he names. It is served at `/terminal` on sixlines.day and 8bitoracle.ai, and records frame-exact clips for shorts.

**Architecture:** A build script in this repo turns the series data into one JSON file, a subset Chinese font and the lesson's generated sounds inside `godot/wangbi-terminal/`. The Godot project has one pure rules file (`reading.gd`, tested headless), one plot node, and one main scene that draws the readout and handles input. A `--record` mode plays a fixed sequence under Godot's movie maker. The web export is copied into the two sites only after the user approves.

**Tech Stack:** Godot 4.7.2 (GDScript, Compatibility renderer, single-threaded web export), Node 22 (`node --test`), ffmpeg, fonttools (`pyftsubset`).

**Spec:** `docs/superpowers/specs/2026-09-28-godot-wangbi-terminal-design.md`

## Global Constraints

- Godot binary: `/Applications/Godot.app/Contents/MacOS/Godot` (4.7.2.stable).
- Colours:
  - Phosphor green `#7dff8a`, and the same green at 0.45 alpha for dim text.
  - Amber is only for the master line, the line to look at.
  - Cyan is only for the prompt.
  - Black background. The frame stays green.
- Fonts:
  - Latin: `public/fonts/PixelOperator-Bold.ttf` (CC0).
  - Chinese: Noto Sans TC (OFL), subset to the characters used.
- Plot geometry, from `src/scenes/Readout.tsx`:
  - A line is 6.2 wide and 0.5 tall.
  - Line gap 0.3, trigram gap 0.9, yin gap 0.7, depth 0.45.
  - Camera distance 16.
- Motion: the plot turns once, slowly, when the hexagram changes. No shake, sway or punch.
- Banned words in any on-screen text: oracle, divination (and "divin-" forms), fortune, prediction, mystical, magical. In Chinese: 预测/預測, 占卜, 算命, 神諭.
- English beside every Chinese string shown.
- No master: `WANG BI NAMES NO MASTER HERE`, no amber line, nothing else.
- Never credit the lesson's working order (a lone line first, then the centres) to Wang Bi.
- Media stays out of git: generated sounds, the fonts copied or subset for Godot, exports and recordings. `godot/wangbi-terminal/.gitignore` lists them.
- Commits end with:
  - `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`
  - `Claude-Session: https://claude.ai/code/session_016Z9BbdP28sZoh3uZowjvws`
- Other repos (`sixlines-site`, `8bitoracle-brand`):
  - Only touched in Task 10, on a branch.
  - Merging and deploying need the user's approval each time.
- Line numbering:
  - Lines are numbered 1 to 6 from the bottom.
  - Arrays are bottom-first: `lines[0]` is line 1, and 1 is yang, 0 is yin.
  - Hexagram keys are the six digits bottom-first, e.g. 7 師 is `"010000"`.

## Review Focus

1. **The data or sounds are missing from the web export.** Godot only packs non-resource files that match the preset's include filter. A web build that can't find `res://data/hexagrams.json` shows an empty screen.
   - Expectation: the export preset includes `data/*.json`.
   - Test: `tests/terminal-export.test.mjs` (Task 8).
2. **Fast taps while the answer is still typing, or while the plot turns.** Expectation: the screen always shows the reading of the lines as they are now. Typing restarts, and the turn finishes smoothly.
   - Test: `reading.gd`'s `flip` is pure, and `tests/run.gd` checks that three flips in a row give the reading of the final lines (Task 4).
3. **A hexagram with several masters, or with none.** Expectation:
   - Several: every master line is amber and each gets its own WANG BI row.
   - None: the fixed sentence, and no amber.
   - Test: `tests/run.gd` checks `wangbi_rows` for a two-master fixture and a no-master fixture (Task 4).
4. **Chinese characters missing from the subset font.** A character the subset font lacks shows as a box. Expectation: every Chinese string in the data renders.
   - Test: `tests/terminal-data.test.mjs` checks that the subset text file holds every character of every `zh` string (Task 3).
5. **Sound before a tap on the web.** Browsers block audio until the viewer interacts. Expectation: nothing plays and nothing errors before START, and all sounds work after it.
   - Check by hand on a phone in Task 8. Automated browser audio tests aren't worth their cost here.

---

## File structure

In this repo:
- `scripts/sfx.mjs`: the ffmpeg recipes for the lesson's machine sounds, moved out of `scripts/explainer.mjs`. Exports `SFX` and `makeSfx(name, file)`. The explainer imports it.
- `series/wangbi-masters.json`: hand-checked masters for all 64 hexagrams.
- `scripts/terminal-data.mjs`: `buildTerminalData(hexagrams, masters)`, a pure function. Its CLI writes the data, the font subset and the sounds into the Godot project.
- `tests/sfx.test.mjs`, `tests/wangbi-masters.test.mjs`, `tests/terminal-data.test.mjs`, `tests/terminal-export.test.mjs`.

In `godot/wangbi-terminal/`:
- `project.godot`, `export_presets.cfg`, `.gitignore`.
- `reading.gd` (`class_name Reading`): pure rules and text.
- `plot.gd`: draws the wireframe hexagram and says which line a point hits.
- `main.gd` and `main.tscn`: the screen, input, typing, sound and record mode.
- `scanlines.gdshader`: the scanline overlay.
- `tests/run.gd`: the headless test runner for `reading.gd`.
- Generated and gitignored: `data/hexagrams.json` (committed, see Task 3), `fonts/`, `sfx/`, `.godot/`, `build/`.

---

### Task 1: Export templates, empty project, headless test runner

**Files:**
- Create: `godot/wangbi-terminal/project.godot`, `godot/wangbi-terminal/.gitignore`, `godot/wangbi-terminal/tests/run.gd`, `godot/wangbi-terminal/reading.gd`
- Modify: `package.json` (add `test:godot`)

**Interfaces:**
- Produces:
  - `npm run test:godot`, which exits 0 when every check passes and 1 otherwise.
  - `Reading` (class_name) with a static function `version() -> String`, to be replaced in Task 4.

- [ ] **Step 1: Install the export templates.**
  - Download `Godot_v4.7.2-stable_export_templates.tpz` from https://github.com/godotengine/godot/releases/tag/4.7.2-stable.
  - Unzip its `templates/` folder to `~/Library/Application Support/Godot/export_templates/4.7.2.stable/`.
  - Check: `ls ~/Library/Application\ Support/Godot/export_templates/4.7.2.stable/ | grep web_nothreads_release.zip` prints the file.

- [ ] **Step 2: Write the project file.**

```ini
; godot/wangbi-terminal/project.godot
config_version=5

[application]
config/name="Wang Bi Terminal"
run/main_scene="res://main.tscn"
config/features=PackedStringArray("4.7", "GL Compatibility")

[display]
window/size/viewport_width=1080
window/size/viewport_height=1920
window/stretch/mode="canvas_items"
window/stretch/aspect="keep_width"
window/handheld/orientation=1

[rendering]
renderer/rendering_method="gl_compatibility"
renderer/rendering_method.mobile="gl_compatibility"
environment/defaults/default_clear_color=Color(0, 0, 0, 1)
```

```gitignore
# godot/wangbi-terminal/.gitignore
.godot/
build/
fonts/
sfx/
*.import
```

- [ ] **Step 3: Write the failing runner and a stub `Reading`.**

```gdscript
# godot/wangbi-terminal/tests/run.gd
# Headless checks of reading.gd:
#   Godot --headless --path godot/wangbi-terminal -s res://tests/run.gd
extends SceneTree

var failed := 0

func check(ok: bool, what: String) -> void:
	if ok:
		print("ok   ", what)
	else:
		failed += 1
		printerr("FAIL ", what)

func _init() -> void:
	check(Reading.version() == "1", "Reading loads")
	quit(1 if failed else 0)
```

```gdscript
# godot/wangbi-terminal/reading.gd
class_name Reading
extends RefCounted

static func version() -> String:
	return "0"
```

- [ ] **Step 4: Add the npm script and see it fail.**
  - Add to `package.json` scripts: `"test:godot": "/Applications/Godot.app/Contents/MacOS/Godot --headless --path godot/wangbi-terminal --import && /Applications/Godot.app/Contents/MacOS/Godot --headless --path godot/wangbi-terminal -s res://tests/run.gd"`
  - Run: `npm run test:godot`
  - Expected: `FAIL Reading loads`, exit 1.

- [ ] **Step 5: Make it pass.**
  - Change `version()` to return `"1"`.
  - Run: `npm run test:godot`
  - Expected: `ok   Reading loads`, exit 0.

- [ ] **Step 6: Commit** `godot/wangbi-terminal/{project.godot,.gitignore,reading.gd,tests/run.gd}` and `package.json` with the message "Godot terminal: empty project and headless test runner".

---

### Task 2: Move the sound recipes to `scripts/sfx.mjs`

This moves code without changing it. The lesson must sound exactly the same afterwards.

**Files:**
- Create: `scripts/sfx.mjs`, `tests/sfx.test.mjs`
- Modify: `scripts/explainer.mjs`
  - Lines 50–55: the teletype tick.
  - Line 66: `const beep`.
  - Lines 80–108: `const makeSfx`.
  - Lines 109–114: the generation loop.
  - Line numbers are as of commit 2a238dd; find each block by its text if they have moved.

**Interfaces:**
- Produces:
  - `SFX: Record<string, string[]>`: the ffmpeg input and filter arguments for each sound. Keys: `teletype`, `bed`, `beacon`, `beacon-level`, `sweep`, `chatter`, `warble`, `winddown`, `hum`, `relay`, `printer`.
  - `makeSfx(name: string, file: string): void`: writes the sound to `file` (a .wav, or an .ogg, which ffmpeg picks by extension), creating folders as needed. It throws on an unknown name.

- [ ] **Step 1: Write the failing test.**

```js
// tests/sfx.test.mjs
import assert from "node:assert/strict";
import { mkdtempSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { SFX, makeSfx } from "../scripts/sfx.mjs";

test("every sound the lesson and the terminal use has a recipe", () => {
  for (const k of ["teletype", "bed", "beacon", "beacon-level", "sweep", "chatter", "warble", "winddown", "hum", "relay", "printer"]) assert.ok(Array.isArray(SFX[k]), k);
});

test("the teletype tick is the lesson's own, unchanged", () => {
  assert.deepEqual(SFX.teletype, ["-f", "lavfi", "-i", "aevalsrc=0.3*sin(2*PI*1900*t)*exp(-mod(t\\,0.04)*350):s=44100:d=20"]);
});

test("makeSfx writes a file and refuses an unknown name", () => {
  const f = path.join(mkdtempSync(path.join(tmpdir(), "sfx-")), "a", "relay.wav");
  makeSfx("relay", f);
  assert.ok(statSync(f).size > 1000);
  assert.throws(() => makeSfx("nope", f), /nope/);
});
```

- [ ] **Step 2: Run it and see it fail.**
  - Run: `node --test tests/sfx.test.mjs`
  - Expected: `Cannot find module '../scripts/sfx.mjs'`.

- [ ] **Step 3: Create `scripts/sfx.mjs` by moving the code.**
  - Copy these verbatim from `scripts/explainer.mjs` into `scripts/sfx.mjs`:
    - the comment block above `const makeSfx` (the flight look's machine sounds, from "The flight look's machine sounds" to the `"beacon": "level"` paragraph);
    - `const beep = …`;
    - the whole `makeSfx` object, renamed `SFX` and exported.
  - Add the teletype recipe as a key, then the writer:

```js
// scripts/sfx.mjs (after the moved block)
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";

// The teletype tick: a short decaying click, 25 a second (one per typed character).
SFX.teletype = ["-f", "lavfi", "-i", "aevalsrc=0.3*sin(2*PI*1900*t)*exp(-mod(t\\,0.04)*350):s=44100:d=20"];

// Writes one sound; the extension picks the format (.wav for Remotion, .ogg for Godot's web build).
export function makeSfx(name, file) {
  if (!SFX[name]) throw new Error(`no sound recipe named ${name}`);
  mkdirSync(path.dirname(file), { recursive: true });
  execFileSync("ffmpeg", ["-v", "error", "-y", ...SFX[name], file], { stdio: ["ignore", "pipe", "pipe"] });
}
```

  - Put the imports at the top of the file.

- [ ] **Step 4: Make `scripts/explainer.mjs` use it.**
  - Delete the moved lines.
  - Add `import { makeSfx } from "./sfx.mjs";`.
  - Replace the teletype block with `if (!existsSync(pub(ticks))) makeSfx("teletype", pub(ticks));` and keep `const ticks = "local/sfx/teletype.wav";`.
  - Replace the loop body with `if (!existsSync(pub(f))) makeSfx(path.basename(f, ".wav"), pub(f));`.

- [ ] **Step 5: Run the tests and check the lesson's sounds are unchanged.**
  - Run: `node --test tests/sfx.test.mjs && npm test`. Expected: all pass.
  - Then, for the sounds only (the renders are untouched), compare old and new: `mkdir -p /tmp/sfx-check && for s in relay sweep warble winddown; do node -e "import('./scripts/sfx.mjs').then(m=>m.makeSfx('$s','/tmp/sfx-check/$s.wav'))"; cmp <(ffmpeg -v error -i public/local/sfx/$s.wav -f s16le -) <(ffmpeg -v error -i /tmp/sfx-check/$s.wav -f s16le -) && echo "$s same"; done`
  - Expected: four "same" lines. `relay` and `chatter` use `random(0)`, which is deterministic in ffmpeg. If a sound differs, stop and report it; don't change a recipe.

- [ ] **Step 6: Commit** with the message "Sound recipes move to scripts/sfx.mjs, shared by the explainer and the terminal".

---

### Task 3: Hand-checked masters and the terminal's data

**Files:**
- Create: `series/wangbi-masters.json`, `tests/wangbi-masters.test.mjs`, `scripts/terminal-data.mjs`, `tests/terminal-data.test.mjs`, `godot/wangbi-terminal/data/hexagrams.json` (generated, committed: it is data, not media, and the web build needs it)

**Interfaces:**
- `series/wangbi-masters.json`:
  - Shape: `{ "about": string, "hexagrams": { "<1-64>": { "masters": [{ "line": 1-6, "zh": string, "en": string, "where": string }], "checked": string } } }`
  - `masters: []` means Wang Bi names none.
  - `where` says where the phrase is, e.g. `"note on line 2"` or `"note on the Judgment (彖)"`.
  - `checked` says how the entry was checked: `"shorts readout"` or `"chinese-classics-reference: <file>"`.
- `buildTerminalData(hexagrams, masters) -> { [key]: Entry }`:
  - `Entry = { number, zh, pinyin, name, lines, upper: Tri, lower: Tri, masters: [{line, zh, en}] }`
  - `Tri = { key, zh, name, does }`
- `chineseText(data) -> string`: every distinct Chinese character in `data`. It feeds the font subset.

- [ ] **Step 1: Seed the masters file.**
  - Write the nine masters checked for the shorts' readouts, with `checked: "shorts readout"`. The zh and en are as in `series/copy.json`:
    - 13 L2 `二為同人之主` "Line two, master of Fellowship"
    - 14 L5 `為大有之主` "Ruler of Great Possession"
    - 16 L4 `四以剛動，為豫之主` "Line four, master of Enthusiasm"
    - 20 L5 `為觀之主` "Master of Contemplation"
    - 25 L5 `為无妄之主` "Master of No Falseness"
    - 26 L5 `為畜之主` "Master of Accumulation"
    - 33 L2 `為遯之主` "Master of Retreat"
    - 59 L5 `為渙之主` "Master of Dispersion"
    - 60 L5 `為節之主` "Master of Limitation"
  - Add the lesson's own two: 7 L2 `為師之主` "Master of the army" and 22 L5 `為飾之主` "Master of adornment". Both have `checked: "Wang Bi lesson"`.

- [ ] **Step 2: Read the other 53 by hand.**
  - For each hexagram, read Wang Bi's notes (lines and Judgment) in `~/projects/chinese-classics-reference`. The zh+en text is also in `~/projects/8bitoracle-next/src/constants/wangBiZhu.ts`.
  - Start from the candidates in `series/wangbi.json` (`masters` and `judgment`), and add any master the extractor missed.
  - Record a line only where he says that line is the master of the hexagram. These don't count:
    - "master of the lower trigram" (39 L3);
    - "supports the master" (16 L3);
    - a ruler being removed (36 L3);
    - a deity (42 L2);
    - a warning against being master (46 L6).
  - Judgment-note cases to settle: 10 (`三為履主` gives L3), 13 (already seeded), 30 (`以柔順為主`), 55 (`為天下之主`).
  - Write `masters: []` where he names none. Give every entry a `checked` value.
  - This step is reading, not code. List the verdicts in the commit message.

- [ ] **Step 3: Write the failing test for the masters file.**

```js
// tests/wangbi-masters.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const m = JSON.parse(readFileSync(new URL("../series/wangbi-masters.json", import.meta.url), "utf8")).hexagrams;
const copy = JSON.parse(readFileSync(new URL("../series/copy.json", import.meta.url), "utf8"));
const BANNED = /oracle|divin|fortune|predict|mystical|magical|预测|預測|占卜|算命|神諭/i;

test("all 64 hexagrams are checked", () => {
  assert.deepEqual(Object.keys(m).map(Number).sort((a, b) => a - b), Array.from({ length: 64 }, (_, i) => i + 1));
  for (const [n, h] of Object.entries(m)) assert.ok(h.checked, `${n} has no checked note`);
});

test("each master is a line 1-6 with its phrase, an English gloss and where it is", () => {
  for (const [n, h] of Object.entries(m))
    for (const x of h.masters) {
      assert.ok(Number.isInteger(x.line) && x.line >= 1 && x.line <= 6, `${n} line`);
      assert.match(x.zh, /主/, `${n} zh names a master`);
      assert.ok(x.en && !BANNED.test(x.en), `${n} en`);
      assert.ok(x.where, `${n} where`);
    }
});

test("the shorts' readouts and the terminal agree", () => {
  for (const [n, row] of Object.entries(copy)) {
    const master = row.lesson?.readout?.master;
    if (!master) continue;
    assert.ok(m[n].masters.some((x) => x.zh === master.zh), `${n}: ${master.zh}`);
  }
});

test("the extractor's false matches are not masters", () => {
  assert.ok(!m[16].masters.some((x) => x.line === 3), "16 L3 supports the master");
  assert.ok(!m[36].masters.some((x) => x.line === 3), "36 L3 removes the dark ruler");
  assert.ok(!m[42].masters.some((x) => x.line === 2), "42 L2 is the Supreme Deity");
  assert.equal(m[10].masters[0]?.line, 3, "10: 三為履主");
});
```

  - Run: `node --test tests/wangbi-masters.test.mjs`. It fails until Step 2 is complete, then passes.

- [ ] **Step 4: Write the failing test for the terminal data.**

```js
// tests/terminal-data.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildTerminalData, chineseText } from "../scripts/terminal-data.mjs";

const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), "utf8"));
const hexagrams = read("../series/hexagrams.json");
const masters = read("../series/wangbi-masters.json").hexagrams;
const data = buildTerminalData(hexagrams, masters);

test("64 entries keyed by their lines, bottom first", () => {
  assert.equal(Object.keys(data).length, 64);
  assert.equal(data["010000"].number, 7);
  assert.equal(data["111111"].number, 1);
});

test("trigrams are named, with what they do (Shuo Gua 7)", () => {
  assert.deepEqual(data["010000"].lower, { key: "kan", zh: "坎", name: "WATER", does: "SINKING" });
  assert.deepEqual(data["010000"].upper, { key: "kun", zh: "坤", name: "EARTH", does: "YIELDING" });
});

test("masters come from the hand-checked table", () => {
  assert.deepEqual(data["010000"].masters.map((x) => x.line), [2]);
});

test("the committed data is what the sources build", () => {
  assert.deepEqual(read("../godot/wangbi-terminal/data/hexagrams.json"), data);
});

test("the font subset covers every Chinese character shown", () => {
  const text = chineseText(data);
  for (const e of Object.values(data)) for (const s of [e.zh, e.upper.zh, e.lower.zh, ...e.masters.map((x) => x.zh)]) for (const ch of s) assert.ok(text.includes(ch), ch);
});
```

  - Run: `node --test tests/terminal-data.test.mjs`
  - Expected: FAIL, module not found.

- [ ] **Step 5: Write `scripts/terminal-data.mjs`.**

```js
// scripts/terminal-data.mjs
// Builds the Godot terminal's inputs from the series data: data/hexagrams.json (committed),
// and, gitignored, the fonts (Pixel Operator; Noto Sans TC subset to the Chinese shown) and the
// lesson's machine sounds as .ogg (scripts/sfx.mjs).
//   node scripts/terminal-data.mjs
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { makeSfx } from "./sfx.mjs";

// Bottom-first lines of each trigram; what each does, as DOES in src/scenes/Readout.tsx.
const TRIGRAMS = {
  "111": { key: "qian", zh: "乾", name: "HEAVEN", does: "STRONG" },
  "000": { key: "kun", zh: "坤", name: "EARTH", does: "YIELDING" },
  "100": { key: "zhen", zh: "震", name: "THUNDER", does: "MOVING" },
  "010": { key: "kan", zh: "坎", name: "WATER", does: "SINKING" },
  "001": { key: "gen", zh: "艮", name: "MOUNTAIN", does: "STILL" },
  "011": { key: "xun", zh: "巽", name: "WIND", does: "ENTERING" },
  "101": { key: "li", zh: "離", name: "FIRE", does: "CLINGING" },
  "110": { key: "dui", zh: "兌", name: "LAKE", does: "JOYFUL" },
};

export function buildTerminalData(hexagrams, masters) {
  const out = {};
  for (const h of [...hexagrams].sort((a, b) => a.number - b.number)) {
    const key = h.lines.join("");
    out[key] = {
      number: h.number, zh: h.zh, pinyin: h.pinyin, name: h.name.toUpperCase(), lines: h.lines,
      lower: TRIGRAMS[key.slice(0, 3)], upper: TRIGRAMS[key.slice(3)],
      masters: masters[h.number].masters.map(({ line, zh, en }) => ({ line, zh, en })),
    };
  }
  return out;
}

export const chineseText = (data) => [...new Set(JSON.stringify(data).match(/\p{Script=Han}/gu))].join("");

if (import.meta.url === `file://${process.argv[1]}`) {
  const root = path.resolve(import.meta.dirname, "..");
  const godot = path.join(root, "godot/wangbi-terminal");
  const read = (p) => JSON.parse(readFileSync(path.join(root, p), "utf8"));
  const data = buildTerminalData(read("series/hexagrams.json"), read("series/wangbi-masters.json").hexagrams);
  mkdirSync(path.join(godot, "data"), { recursive: true });
  writeFileSync(path.join(godot, "data/hexagrams.json"), JSON.stringify(data, null, 1) + "\n");
  mkdirSync(path.join(godot, "fonts"), { recursive: true });
  copyFileSync(path.join(root, "public/fonts/PixelOperator-Bold.ttf"), path.join(godot, "fonts/PixelOperator-Bold.ttf"));
  // Noto Sans TC (SIL OFL), kept in public/local (gitignored), subset to the characters shown.
  const noto = path.join(root, "public/local/fonts/NotoSansTC-wght.ttf");
  if (!existsSync(noto)) {
    mkdirSync(path.dirname(noto), { recursive: true });
    execFileSync("curl", ["-sfL", "-o", noto, "https://github.com/google/fonts/raw/main/ofl/notosanstc/NotoSansTC%5Bwght%5D.ttf"]);
  }
  execFileSync("pyftsubset", [noto, `--text=${chineseText(data)}`, `--output-file=${path.join(godot, "fonts/NotoSansTC-subset.ttf")}`]);
  for (const s of ["teletype", "relay", "sweep", "warble", "winddown", "bed"]) makeSfx(s, path.join(godot, "sfx", `${s}.ogg`));
  console.log(`wrote ${Object.keys(data).length} hexagrams, fonts and sounds into godot/wangbi-terminal`);
}
```

- [ ] **Step 6: Run the CLI and all the tests.**
  - Run: `node scripts/terminal-data.mjs && node --test tests/terminal-data.test.mjs tests/wangbi-masters.test.mjs`
  - Expected: all pass.
  - Check that `godot/wangbi-terminal/fonts/NotoSansTC-subset.ttf` is under 200 KB.

- [ ] **Step 7: Commit** `series/wangbi-masters.json`, the script, both tests and `godot/wangbi-terminal/data/hexagrams.json`, with the message "Terminal data: hand-checked Wang Bi masters for all 64, and the Godot data build". The commit body lists each non-seeded verdict.

---

### Task 4: `reading.gd`, the rules and the text

**Files:**
- Modify: `godot/wangbi-terminal/reading.gd`, `godot/wangbi-terminal/tests/run.gd`

**Interfaces:**
- Consumes: `data/hexagrams.json` (Task 3).
- Produces (all static):
  - `load_data() -> Dictionary`: key to entry.
  - `key(lines: Array) -> String`
  - `flip(lines: Array, n: int) -> Array`: a new array; `n` is 1 to 6.
  - `place(lines: Array, n: int) -> String`: `"CORRECT"`, `"NOT CORRECT"` or `"NO PLACE"`.
  - `is_centre(n: int) -> bool`
  - `partner(n: int) -> int`
  - `answers(lines: Array, n: int) -> bool`
  - `log_row(lines: Array, n: int) -> String`
  - `trigram_rows(entry: Dictionary) -> Array`
  - `wangbi_rows(entry: Dictionary) -> Array`
  - `master_lines(entry: Dictionary) -> Array` (these three return plain arrays, so they compare equal to array literals)
  - `NO_MASTER := "WANG BI NAMES NO MASTER HERE"`

- [ ] **Step 1: Replace `tests/run.gd` with the rule checks.**

```gdscript
# godot/wangbi-terminal/tests/run.gd
# Headless checks of reading.gd against the lesson's own examples:
#   npm run test:godot
extends SceneTree

var failed := 0

func check(ok: bool, what: String) -> void:
	if ok:
		print("ok   ", what)
	else:
		failed += 1
		printerr("FAIL ", what)

func _init() -> void:
	var data := Reading.load_data()
	var army := [0, 1, 0, 0, 0, 0]  # 7 師
	check(data.size() == 64, "64 hexagrams load")
	check(Reading.key(army) == "010000" and data["010000"].number == 7, "7 is keyed by its lines")
	# Places (辯位): 1 and 6 have none; 2 and 4 are yin places; 3 and 5 yang places.
	check(Reading.place(army, 1) == "NO PLACE" and Reading.place(army, 6) == "NO PLACE", "1 and 6 have no place")
	check(Reading.place(army, 2) == "NOT CORRECT", "7 L2 is yang in a yin place")
	check(Reading.place(army, 4) == "CORRECT", "7 L4 is yin in a yin place")
	check(Reading.place(army, 5) == "NOT CORRECT", "7 L5 is yin in a yang place")
	check(Reading.is_centre(2) and Reading.is_centre(5) and not Reading.is_centre(3), "centres are 2 and 5")
	check(Reading.partner(1) == 4 and Reading.partner(5) == 2 and Reading.partner(6) == 3, "partners")
	check(Reading.answers(army, 2) and Reading.answers(army, 5), "7: L2 answers L5")
	check(not Reading.answers(army, 1), "7: L1 and L4, both yin, do not answer")
	check(Reading.log_row(army, 2) == "L2  YANG  NOT CORRECT  CENTRE  ANSWERS L5", "7 L2 row")
	check(Reading.log_row(army, 1) == "L1  YIN   NO PLACE", "7 L1 row")
	check(Reading.master_lines(data["010000"]) == [2], "7: master L2")
	check(Reading.master_lines(data["101001"]) == [5], "22: master L5")
	check(Reading.master_lines(data["110111"]) == [3], "10: master L3")
	check(Reading.trigram_rows(data["010000"]) == ["UPPER  坤 EARTH, YIELDING", "LOWER  坎 WATER, SINKING"], "7 trigrams")
	# Review Focus 2: flips in a row read as the final lines.
	var l := Reading.flip(Reading.flip(Reading.flip(army, 2), 2), 5)
	check(army == [0, 1, 0, 0, 0, 0], "flip leaves its input alone")
	check(Reading.key(l) == "010010", "three flips give the final lines")
	# Review Focus 3: several masters, and none.
	var two := {"masters": [{"line": 2, "zh": "甲之主", "en": "A"}, {"line": 5, "zh": "乙之主", "en": "B"}]}
	check(Reading.master_lines(two) == [2, 5], "two masters, both amber")
	check(Reading.wangbi_rows(two) == ["L2  甲之主  A", "L5  乙之主  B"], "a row for each master")
	check(Reading.wangbi_rows({"masters": []}) == [Reading.NO_MASTER] and Reading.master_lines({"masters": []}) == [], "no master: the sentence and no amber")
	quit(1 if failed else 0)
```

- [ ] **Step 2: Run it and see it fail.**
  - Run: `npm run test:godot`
  - Expected: a parse error, "Static function "load_data()" not found".

- [ ] **Step 3: Write `reading.gd`.**

```gdscript
# godot/wangbi-terminal/reading.gd
# Wang Bi's reading of a hexagram, as the lesson teaches it (略例: 辯位, 明彖). Lines are
# bottom-first arrays of 0 (yin) and 1 (yang); line numbers run 1-6 from the bottom.
class_name Reading
extends RefCounted

const NO_MASTER := "WANG BI NAMES NO MASTER HERE"

static func load_data() -> Dictionary:
	var f := FileAccess.open("res://data/hexagrams.json", FileAccess.READ)
	return JSON.parse_string(f.get_as_text())

static func key(lines: Array) -> String:
	return "".join(lines.map(func(x): return str(x)))

static func flip(lines: Array, n: int) -> Array:
	var out := lines.duplicate()
	out[n - 1] = 1 - out[n - 1]
	return out

# 辯位: the first and top lines have no yin or yang place; 3 and 5 are yang places, 2 and 4 yin.
static func place(lines: Array, n: int) -> String:
	if n == 1 or n == 6:
		return "NO PLACE"
	return "CORRECT" if lines[n - 1] == n % 2 else "NOT CORRECT"

static func is_centre(n: int) -> bool:
	return n == 2 or n == 5

static func partner(n: int) -> int:
	return n + 3 if n <= 3 else n - 3

static func answers(lines: Array, n: int) -> bool:
	return lines[n - 1] != lines[partner(n) - 1]

static func log_row(lines: Array, n: int) -> String:
	var parts := ["L%d" % n, "YANG" if lines[n - 1] == 1 else "YIN ", place(lines, n)]
	if is_centre(n):
		parts.append("CENTRE")
	if answers(lines, n):
		parts.append("ANSWERS L%d" % partner(n))
	return "  ".join(parts)

static func trigram_rows(entry: Dictionary) -> Array:
	var out := []
	for side in ["upper", "lower"]:
		var t: Dictionary = entry[side]
		out.append("%s  %s %s, %s" % [side.to_upper(), t.zh, t.name, t.does])
	return out

static func master_lines(entry: Dictionary) -> Array:
	var out := []
	for m in entry.masters:
		out.append(int(m.line))
	return out

static func wangbi_rows(entry: Dictionary) -> Array:
	var out := []
	for m in entry.masters:
		out.append("L%d  %s  %s" % [int(m.line), m.zh, m.en])
	if out.is_empty():
		out.append(NO_MASTER)
	return out
```

  - `place` compares with `n % 2` because a yang place (3, 5) has `n % 2 == 1` and a yin place (2, 4) has `n % 2 == 0`.
  - Note that `log_row` pads YIN to four characters so that the columns line up.

- [ ] **Step 4: Run it and see it pass.**
  - Run: `npm run test:godot`
  - Expected: every line `ok`, exit 0.
  - If a check on 22's or 10's key fails, print `Reading.key` of their lines from `series/hexagrams.json` and correct the test's key, not the rule.

- [ ] **Step 5: Commit** with the message "Terminal: reading.gd, Wang Bi's places, centres, answering pairs and masters, tested headless".

---

### Task 5: The screen (still), with a review by the user

**Files:**
- Create: `godot/wangbi-terminal/plot.gd`, `godot/wangbi-terminal/main.gd`, `godot/wangbi-terminal/main.tscn`, `godot/wangbi-terminal/scanlines.gdshader`

**Interfaces:**
- Consumes: everything in `Reading`.
- Produces:
  - `Plot` (Node2D):
    - `lines: Array` (set to redraw) and `amber: Array`;
    - `turn: float` (radians);
    - `line_at(point: Vector2) -> int`: 1 to 6, or 0 for no line.
  - `main.gd`:
    - `show_lines(lines: Array)`: sets the whole screen from the lines;
    - `var typing_speed := 25.0` (characters per second).

- [ ] **Step 1: Write the plot.** It projects as `boxEdges` does in `src/scenes/Readout.tsx`.

```gdscript
# godot/wangbi-terminal/plot.gd
# The hexagram as a wireframe, as the lesson's readout plots it (Readout.tsx boxEdges): each line
# a box 6.2 x 0.5 x 0.45, seen from 16 units, turned `turn` radians about the vertical.
class_name Plot
extends Node2D

const LINE_W := 6.2
const LINE_H := 0.5
const GAP := 0.3
const TRIGRAM_GAP := 0.9
const YIN_GAP := 0.7
const DEPTH := 0.45
const DIST := 16.0
const GREEN := Color("#7dff8a")
const AMBER := Color("#ffb347")

@export var scale_px := 120.0
var lines: Array = [1, 1, 1, 1, 1, 1]:
	set(v):
		lines = v
		queue_redraw()
var amber: Array = []:
	set(v):
		amber = v
		queue_redraw()
var turn := 0.0:
	set(v):
		turn = v
		queue_redraw()

static func line_z(i: int) -> float:
	var total := 6 * LINE_H + 4 * GAP + TRIGRAM_GAP
	return -total / 2 + LINE_H / 2 + i * (LINE_H + GAP) + (TRIGRAM_GAP - GAP if i >= 3 else 0.0)

func slabs() -> Array:
	var out := []
	for i in 6:
		var z := line_z(i)
		if lines[i] == 1:
			out.append([i, -LINE_W / 2, LINE_W / 2, z])
		else:
			var w := (LINE_W - YIN_GAP) / 2
			out.append([i, -LINE_W / 2, -LINE_W / 2 + w, z])
			out.append([i, LINE_W / 2 - w, LINE_W / 2, z])
	return out

func project(p: Vector3) -> Vector2:
	var rx := p.x * cos(turn) - p.y * sin(turn)
	var ry := p.x * sin(turn) + p.y * cos(turn)
	var k := DIST / (DIST + ry)
	return Vector2(rx * k, -p.z * k) * scale_px

func _draw() -> void:
	for s in slabs():
		var colour := AMBER if (s[0] + 1) in amber else GREEN
		var c := []
		for x in [s[1], s[2]]:
			for y in [-DEPTH / 2, DEPTH / 2]:
				for z in [s[3] - LINE_H / 2, s[3] + LINE_H / 2]:
					c.append(project(Vector3(x, y, z)))
		# The 12 edges of the box: corners differ in exactly one of x, y, z.
		for a in 8:
			for b in [1, 2, 4]:
				if a & b == 0:
					draw_line(c[a], c[a | b], colour, 2.0, true)

func line_at(point: Vector2) -> int:
	var local := to_local(point) / scale_px
	for i in 6:
		if absf(-local.y - line_z(i)) <= (LINE_H + GAP) / 2 and absf(local.x) <= LINE_W / 2 + 0.3:
			return i + 1
	return 0
```

  - The corner index is `x*4 + y*2 + z`, following the loop order, so the bits 4, 2 and 1 are x, y and z. This is the same edge rule as Readout.tsx.

- [ ] **Step 2: Write the scanline shader.**

```glsl
// godot/wangbi-terminal/scanlines.gdshader
shader_type canvas_item;
uniform float lines = 640.0;
uniform float strength = 0.18;
void fragment() {
	float s = step(0.5, fract(SCREEN_UV.y * lines));
	COLOR = vec4(0.0, 0.0, 0.0, strength * s);
}
```

- [ ] **Step 3: Build `main.tscn` in code, so the scene file stays trivial.**
  - `main.tscn` holds only a root `Control` (full rect) with `main.gd` attached.
  - `main.gd` builds its children in `_ready`:
    - a `ColorRect` border in green, 4 px, at a 40 px inset: the frame;
    - `Plot` at (540, 560) with `scale_px = 120`;
    - one `Label` each for the title (the hexagram), the log (6 rows, top row = L6), the trigrams, WANG BI and the prompt;
    - a full-screen `ColorRect` with the scanline shader, drawn last and ignoring the mouse.
  - Fonts: a `FontVariation` of `fonts/PixelOperator-Bold.ttf` with `fonts/NotoSansTC-subset.ttf` as its fallback, so Chinese falls through to Noto.
  - Glow: the `Label` `theme_override_constants/outline_size = 6`, with a green outline at 0.35 alpha. This is the web-safe stand-in for the text-shadow glow.

```gdscript
# godot/wangbi-terminal/main.gd (Task 5 part: layout and show_lines)
extends Control

const GREEN := Color("#7dff8a")
const DIM := Color(0.49, 1.0, 0.54, 0.45)
const AMBER := Color("#ffb347")
const CYAN := Color("#5ee7ff")
const PROMPT := "TAP A LINE TO CHANGE IT"

var data := Reading.load_data()
var lines: Array = [0, 1, 0, 0, 0, 0]
var plot := Plot.new()
var title := Label.new()
var log_label := Label.new()
var trigrams := Label.new()
var wangbi := Label.new()
var prompt := Label.new()
var typing_speed := 25.0

func font() -> FontVariation:
	var pixel := load("res://fonts/PixelOperator-Bold.ttf") as FontFile
	pixel.fallbacks = [load("res://fonts/NotoSansTC-subset.ttf")]
	var f := FontVariation.new()
	f.base_font = pixel
	return f

func label(l: Label, pos: Vector2, size: int, colour: Color) -> void:
	l.position = pos
	l.size = Vector2(1000, 0)
	l.add_theme_font_override("font", font())
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", colour)
	l.add_theme_constant_override("outline_size", 6)
	l.add_theme_color_override("font_outline_color", Color(colour, 0.35))
	add_child(l)

func _ready() -> void:
	var frame := ReferenceRect.new()
	frame.border_color = GREEN
	frame.border_width = 4
	frame.editor_only = false
	frame.position = Vector2(40, 40)
	frame.size = Vector2(1000, 1840)
	add_child(frame)
	label(title, Vector2(60, 70), 44, GREEN)
	plot.position = Vector2(540, 560)
	add_child(plot)
	label(log_label, Vector2(60, 960), 34, GREEN)
	label(trigrams, Vector2(60, 1260), 34, DIM)
	label(wangbi, Vector2(60, 1400), 34, GREEN)
	label(prompt, Vector2(60, 1780), 38, CYAN)
	var scan := ColorRect.new()
	scan.set_anchors_preset(Control.PRESET_FULL_RECT)
	scan.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var m := ShaderMaterial.new()
	m.shader = load("res://scanlines.gdshader")
	scan.material = m
	add_child(scan)
	show_lines(lines)

func show_lines(l: Array) -> void:
	lines = l
	var e: Dictionary = data[Reading.key(l)]
	title.text = "%d %s %s  %s" % [e.number, e.zh, e.pinyin, e.name]
	var rows := []
	for n in range(6, 0, -1):
		rows.append(Reading.log_row(l, n))
	log_label.text = "\n".join(rows)
	trigrams.text = "\n".join(Reading.trigram_rows(e))
	wangbi.text = "WANG BI\n" + "\n".join(Reading.wangbi_rows(e))
	plot.lines = l
	plot.amber = Reading.master_lines(e)
	prompt.text = PROMPT
```

- [ ] **Step 4: Render a still and show the user.**
  - Run: `/Applications/Godot.app/Contents/MacOS/Godot --path godot/wangbi-terminal --write-movie /tmp/terminal-still.png --fixed-fps 30 --quit-after 2`
  - Then copy the last frame into the scratchpad and send it to the user with SendUserFile.
  - Check yourself first:
    - the frame is green;
    - only 7's L2 is amber;
    - the prompt is cyan;
    - the Chinese shows (no boxes);
    - nothing overlaps.
  - Stop here until the user has seen the still. Their changes come before Task 6.

- [ ] **Step 5: Commit** with the message "Terminal: the readout screen (plot, log, trigrams, WANG BI, prompt)".

---

### Task 6: Input, typing, the one slow turn, and sound

**Files:**
- Modify: `godot/wangbi-terminal/main.gd`

**Interfaces:**
- Consumes: `Plot.line_at`, `Reading.flip`, and `show_lines` (Task 5); `sfx/*.ogg` (Task 3).
- Produces: `set_lines(l: Array)`. It is the one entry point for any change of lines (a tap, a key, or record mode).

- [ ] **Step 1: Add input, typing and the turn.** Append to `main.gd`:

```gdscript
# Input, typing and the turn. Every change goes through set_lines, so what shows is always
# the reading of the lines as they are now (Review Focus 2).
var sounds := {}
var started := false
var typed := 0.0
var tween: Tween

func sound(name: String) -> AudioStreamPlayer:
	if not sounds.has(name):
		var p := AudioStreamPlayer.new()
		p.stream = load("res://sfx/%s.ogg" % name)
		add_child(p)
		sounds[name] = p
	return sounds[name]

func play(name: String) -> void:
	if started:
		sound(name).play()

func set_lines(l: Array) -> void:
	var had := Reading.master_lines(data[Reading.key(lines)])
	show_lines(l)
	typed = 0.0
	for x in [log_label, trigrams, wangbi]:
		x.visible_characters = 0
	if tween:
		tween.kill()
	tween = create_tween()
	tween.tween_property(plot, "turn", plot.turn + TAU, 6.0).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
	play("relay")
	if Reading.master_lines(data[Reading.key(l)]) != had and not Reading.master_lines(data[Reading.key(l)]).is_empty():
		play("warble")

func _process(delta: float) -> void:
	var total := 0
	for x in [log_label, trigrams, wangbi]:
		total += x.get_total_character_count()
	if typed >= total:
		return
	var before := int(typed)
	typed = minf(typed + delta * typing_speed, total)
	var left := int(typed)
	for x in [log_label, trigrams, wangbi]:
		x.visible_characters = mini(left, x.get_total_character_count())
		left -= x.visible_characters
	if int(typed) > before:
		play("teletype")
	if typed >= total:
		play("winddown")

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		if not started:
			started = true
			play("sweep")
			return
		var n := plot.line_at(event.position)
		if n:
			set_lines(Reading.flip(lines, n))
	elif event is InputEventKey and event.pressed and event.keycode >= KEY_1 and event.keycode <= KEY_6:
		set_lines(Reading.flip(lines, event.keycode - KEY_0))
```

- [ ] **Step 2: Add the START gate.**
  - Before the first tap, the prompt reads `TAP TO START`.
  - The first tap only sets `started` and plays the sweep; after it, the prompt is `PROMPT`.
  - On the web this tap is the gesture that unlocks audio (Review Focus 5).

- [ ] **Step 3: Check it by hand in the editor window.**
  - Run: `/Applications/Godot.app/Contents/MacOS/Godot --path godot/wangbi-terminal`
  - Tap L2 of 7 five times fast. It should end with L2 yin, on 2 坤's reading: 2's master per the table (or the NO MASTER line, with no amber), and the typing restarted.
  - Press 1 to 6 on the keyboard.
  - Record what you saw in the task report.

- [ ] **Step 4: Run** `npm run test:godot` (still green), **then commit** with the message "Terminal: tap or keys flip lines; typing, one slow turn, the lesson's sounds".

---

### Task 7: Record mode for shorts

**Files:**
- Modify: `godot/wangbi-terminal/main.gd`
- Create: `scripts/terminal-record.mjs`

**Interfaces:**
- Consumes: `set_lines` (Task 6).
- Produces: `node scripts/terminal-record.mjs <name>`, which writes `out/terminal/<name>.mp4` (1080x1920, 30 fps, yuv420p, faststart, with sound).

- [ ] **Step 1: Add a scripted sequence to `main.gd`.** When the command line after `--` contains `--record`:
  - `started = true`;
  - build 7 from `[1,1,1,1,1,1]` by `set_lines` at 1.0 s steps, flipping 1, 3, 4, 5 and 6 into 7's lines;
  - hold 6 s;
  - flip L2 (to 2 坤) and hold 5 s;
  - flip L2 back and hold 5 s;
  - then `get_tree().quit()`.
  - Read the arguments with `OS.get_cmdline_user_args()`.

- [ ] **Step 2: Write the recorder.**

```js
// scripts/terminal-record.mjs
// Records the terminal's scripted sequence with Godot's movie maker (frame-exact, with sound):
//   node scripts/terminal-record.mjs 7-army   ->  out/terminal/7-army.mp4
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const name = process.argv[2];
if (!name) throw new Error("usage: terminal-record.mjs <name>");
const dir = path.join(root, "out/terminal");
mkdirSync(dir, { recursive: true });
const avi = path.join(dir, `${name}.avi`);
execFileSync("/Applications/Godot.app/Contents/MacOS/Godot", ["--path", path.join(root, "godot/wangbi-terminal"), "--write-movie", avi, "--fixed-fps", "30", "--", "--record"], { stdio: "inherit" });
execFileSync("ffmpeg", ["-v", "error", "-y", "-i", avi, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-c:a", "aac", "-movflags", "+faststart", path.join(dir, `${name}.mp4`)]);
rmSync(avi);
console.log(`wrote out/terminal/${name}.mp4`);
```

- [ ] **Step 3: Record and check.**
  - Run: `node scripts/terminal-record.mjs 7-army`
  - Check:
    - `ffprobe` shows 1080x1920, 30 fps, an audio stream, and a length of about 29 s;
    - a strip of 5 frames shows the build, the amber L2, the turn and the NO MASTER state.
  - Send the strip and the clip to the user, one SendUserFile call each.

- [ ] **Step 4: Commit** with the message "Terminal: --record mode and scripts/terminal-record.mjs for shorts".

---

### Task 8: Web export

**Files:**
- Create: `godot/wangbi-terminal/export_presets.cfg`, `tests/terminal-export.test.mjs`

**Interfaces:**
- Produces: `godot/wangbi-terminal/build/web/index.html` and its files (gitignored), with `npm run terminal:web` to build them.

- [ ] **Step 1: Write the failing test** (Review Focus 1).

```js
// tests/terminal-export.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const cfg = readFileSync(new URL("../godot/wangbi-terminal/export_presets.cfg", import.meta.url), "utf8");

test("the web preset packs the data, single-threaded", () => {
  assert.match(cfg, /platform="Web"/);
  assert.match(cfg, /include_filter="[^"]*data\/\*\.json/);
  assert.match(cfg, /variant\/thread_support=false/);
  assert.match(cfg, /export_path="build\/web\/index.html"/);
});
```

  - Run: `node --test tests/terminal-export.test.mjs`
  - Expected: FAIL (ENOENT).

- [ ] **Step 2: Write the preset.**

```ini
; godot/wangbi-terminal/export_presets.cfg
[preset.0]
name="Web"
platform="Web"
runnable=true
export_filter="all_resources"
include_filter="data/*.json"
exclude_filter="tests/*"
export_path="build/web/index.html"

[preset.0.options]
variant/extensions_support=false
variant/thread_support=false
vram_texture_compression/for_desktop=true
vram_texture_compression/for_mobile=false
html/canvas_resize_policy=2
html/focus_canvas_on_start=true
progressive_web_app/enabled=false
```

- [ ] **Step 3: Export and try it.**
  - Add `"terminal:web": "node scripts/terminal-data.mjs && mkdir -p godot/wangbi-terminal/build/web && /Applications/Godot.app/Contents/MacOS/Godot --headless --path godot/wangbi-terminal --export-release Web build/web/index.html"` to `package.json` scripts.
  - Run: `npm run terminal:web && node --test tests/terminal-export.test.mjs`
  - Serve it: `npx serve godot/wangbi-terminal/build/web -l 8060`. Open http://localhost:8060 in desktop Chrome, and on a phone on the same network.
  - Check:
    - it loads;
    - TAP TO START gives the sweep;
    - taps flip lines;
    - the Chinese renders;
    - no console errors;
    - the total transfer size, noted in the report, is expected to be about 8–10 MB compressed.

- [ ] **Step 4: Commit** with the message "Terminal: single-threaded web export preset and npm run terminal:web".

---

### Task 9: Test suite wiring and a spec check

**Files:**
- Modify: `docs/superpowers/specs/2026-09-28-godot-wangbi-terminal-design.md` (status line only)

- [ ] **Step 1: Run everything.**
  - Run: `npm test && npm run test:godot`
  - Expected: all green. Report the counts.

- [ ] **Step 2: Check the text against the copy rules.**
  - Grep every string in `main.gd`, `reading.gd` and `data/hexagrams.json` for the banned words.
  - Run: `grep -n -i -E "oracle|divin|fortune|predict|mystical|magical|预测|預測|占卜|算命|神諭" godot/wangbi-terminal/*.gd godot/wangbi-terminal/data/hexagrams.json`
  - Expected: no output.

- [ ] **Step 3: Update the spec's status line** to "Built through the web export; not yet on the sites", then commit and push `series-64`.

---

### Task 10: Put it on the two sites (stop for approval)

**Files (other repos, each on a new branch `terminal`):**
- `~/projects/sixlines-site`: `public/terminal/*` (the export), `src/middleware.ts` (matcher), `next.config.ts` (a rewrite)
- `~/projects/8bitoracle-brand`: `public/terminal/*`, `src/middleware.ts`, `next.config.mjs`

- [ ] **Step 1: Keep `/terminal` out of the locale middleware.**
  - Both matchers already skip paths with a dot, but `/terminal` itself has none, so it would redirect to `/en/terminal`.
  - Add `terminal` to each negative lookahead:
    - sixlines-site: `'/((?!api|_next|sitemaps|terminal|.*\\..*).*)'`
    - 8bitoracle-brand: `"/((?!api|go|_next|_vercel|terminal|.*\\..*).*)"`
  - Add a rewrite from `/terminal` to `/terminal/index.html` in each Next config.

- [ ] **Step 2: Copy** `godot/wangbi-terminal/build/web/*` to each `public/terminal/`, and run each site's `build` locally.
  - Check that `/terminal` serves the page and that `index.wasm` is served as `application/wasm`.

- [ ] **Step 3: Stop.**
  - Report both branches to the user, with the local check results.
  - Don't merge, push to main or deploy either site without the user's approval of that step.
