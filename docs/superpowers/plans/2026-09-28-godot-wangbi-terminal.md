# Wang Bi Terminal (Godot) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

Revised 2026-09-28 after the gpt-6-astra review (`docs/research/2026-09-28-codex-terminal-review.md`). Each fix is marked "(review)" where it lands.

**Goal:** A Godot 4.7.2 terminal, exported for the web, where a viewer taps a hexagram's six lines and reads it as the Wang Bi lesson does: each line's place, the centres, the answering pairs, and the master line he names. It is served at `/terminal` on sixlines.day and 8bitoracle.ai, and records frame-exact clips for shorts.

**Architecture:**
- A build script in this repo turns the series data into one JSON file, a subset fallback font and the lesson's generated sounds, all inside `godot/wangbi-terminal/`.
- The Godot project has one pure rules file (`reading.gd`, tested headless), one plot node, and one main scene that draws the readout and handles input.
- A `--record` mode plays a fixed sequence under Godot's movie maker.
- A custom HTML shell loads the engine only after START.
- The web export goes into the two sites only after the user approves.

**Tech Stack:** Godot 4.7.2 (GDScript, Compatibility renderer, single-threaded web export), Node 22 (`node --test`), ffmpeg, fonttools (`pyftsubset`).

**Spec:** `docs/superpowers/specs/2026-09-28-godot-wangbi-terminal-design.md`

## Global Constraints

- Godot binary: `/Applications/Godot.app/Contents/MacOS/Godot` (4.7.2.stable).
- Colours:
  - Phosphor green `#7dff8a`, and the same green at 0.45 alpha for dim text.
  - Amber `#ffb347` is only for the master line, the line to look at.
  - Cyan `#5ee7ff` is only for the prompt.
  - Black background. The frame stays green.
- Fonts:
  - Latin: `public/fonts/PixelOperator-Bold.ttf` (CC0).
  - Fallback: Noto Sans TC (OFL), subset to every non-ASCII character shown (Han, full-width punctuation, pinyin tone marks). (review)
- Plot geometry, from `src/scenes/Readout.tsx`:
  - A line is 6.2 wide and 0.5 tall.
  - Line gap 0.3, trigram gap 0.9, yin gap 0.7, depth 0.45.
  - Camera distance 16.
- Motion:
  - The plot turns once, slowly (6 s, eased), when the hexagram changes, always ending square to the viewer. (review)
  - No shake, sway or punch.
- Banned words in any displayed text: oracle, divination (and "divin-" forms), fortune, prediction, mystical, magical. In Chinese: 预测/預測, 占卜, 算命, 神諭.
- English beside every Chinese string shown.
- No master: `WANG BI NAMES NO MASTER HERE`, no amber line, nothing else.
- Lines 1 and 6 read `NO FIXED PLACE`. Wang Bi denies them a fixed yin/yang place, not a position. (review)
- Never credit the lesson's working order (a lone line first, then the centres) to Wang Bi.
- Media stays out of git: generated sounds, the fonts copied or subset for Godot, exports and recordings. `godot/wangbi-terminal/.gitignore` lists them.
- Recordings for shorts: 1080x1920, 60 fps. (review)
- Commits end with:
  - `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`
  - `Claude-Session: https://claude.ai/code/session_016Z9BbdP28sZoh3uZowjvws`
- Other repos (`sixlines-site`, `8bitoracle-brand`):
  - Only touched in Task 10, on a branch named `terminal`.
  - Merging and deploying need the user's approval each time.
- Line numbering:
  - Lines are numbered 1 to 6 from the bottom.
  - Arrays are bottom-first: `lines[0]` is line 1, and 1 is yang, 0 is yin.
  - Hexagram keys are the six digits bottom-first, e.g. 7 師 is `"010000"`.

## Review Focus

1. **Taps never reach the handler.** A full-screen `Control` with the default STOP filter eats mouse events before `_unhandled_input`. (review)
   - Expectation: every tap on a line flips it.
   - Guard: every `Control` except the SOUND button has `mouse_filter = IGNORE`, and taps are read in `_input`.
   - Checked by hand in Task 6, Step 4.
2. **Fast taps while the answer is typing or the plot is turning.**
   - Expectation: the screen always shows the reading of the lines as they are now, typing restarts, and the turn ends square.
   - Test: `tests/run.gd` checks that three flips in a row give the final reading, and that `turn_target` from a mid-turn angle is the next whole turn (Task 4).
3. **A hexagram with several masters, or with none.**
   - Several: every master line is amber, and each gets its own WANG BI row.
   - None: the fixed sentence, and no amber.
   - Test: `tests/run.gd` fixtures (Task 4). Plus a still of the longest case in Task 5.
4. **A character missing from the fallback font** (Han, `，`, pinyin `ā`…) shows as a box. (review)
   - Expectation: every displayed character renders.
   - Test: `displayText` covers every non-ASCII character of every displayed string (Task 3). The CLI runs `pyftsubset --no-ignore-missing-unicodes`, so a character Noto lacks fails the build.
5. **The web page downloads the engine, or makes sound, before the viewer asks.** (review)
   - Expectation: nothing is fetched but the small HTML page until START is pressed, and sound works right after.
   - Test: `tests/terminal-export.test.mjs` checks the preset uses the custom shell and the shell only calls `startGame` from the button (Task 8). Sound is checked by hand on a phone.

---

## File structure

In this repo:
- `scripts/sfx.mjs`: the ffmpeg recipes for the lesson's machine sounds, moved out of `scripts/explainer.mjs`, plus a one-click `tick` for the terminal. Exports `SFX` and `makeSfx(name, file)`.
- `series/wangbi-masters.json`: hand-checked masters for all 64 hexagrams.
- `scripts/terminal-data.mjs`: pure `buildTerminalData(hexagrams, masters)` and `displayText(data)`. Its CLI writes the data, fonts and sounds into the Godot project.
- `scripts/terminal-record.mjs`: records the `--record` sequence to `out/terminal/<name>.mp4`.
- `tests/sfx.test.mjs`, `tests/wangbi-masters.test.mjs`, `tests/terminal-data.test.mjs`, `tests/terminal-export.test.mjs`.

In `godot/wangbi-terminal/`:
- `project.godot`, `export_presets.cfg`, `shell.html`, `.gitignore`.
- `reading.gd` (`class_name Reading`): pure rules and text.
- `plot.gd` (`class_name Plot`): draws the wireframe hexagram and hit-tests the projected lines.
- `main.gd` and `main.tscn`: the screen, input, typing, sound and record mode.
- `scanlines.gdshader`: the scanline overlay.
- `tests/run.gd`: the headless test runner.
- `data/hexagrams.json`: generated by Task 3, and committed.
- Gitignored: `fonts/`, `sfx/`, `.godot/`, `build/`.

---

### Task 1: Export templates, empty project, headless test runner, web smoke test

**Files:**
- Create:
  - `godot/wangbi-terminal/project.godot`
  - `godot/wangbi-terminal/.gitignore`
  - `godot/wangbi-terminal/tests/run.gd`
  - `godot/wangbi-terminal/reading.gd`
  - `godot/wangbi-terminal/main.tscn`
  - `godot/wangbi-terminal/main.gd`
  - `godot/wangbi-terminal/export_presets.cfg`
- Modify: `package.json` (add `test:godot` and `terminal:web`)

**Interfaces:**
- Produces:
  - `npm run test:godot`, which exits 0 when every check passes and 1 otherwise.
  - `npm run terminal:web`, which writes `godot/wangbi-terminal/build/web/index.html` and its files.
  - `Reading.version() -> String`, replaced in Task 4.

- [ ] **Step 1: Install the export templates.**
  - Download `Godot_v4.7.2-stable_export_templates.tpz` from https://github.com/godotengine/godot/releases/tag/4.7.2-stable.
  - Unzip its `templates/` folder to `~/Library/Application Support/Godot/export_templates/4.7.2.stable/`.
  - Check: `ls ~/Library/Application\ Support/Godot/export_templates/4.7.2.stable/ | grep web_nothreads_release.zip` prints the file.

- [ ] **Step 2: Write the project files.**

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
window/stretch/aspect="keep"
window/handheld/orientation=1

[rendering]
renderer/rendering_method="gl_compatibility"
renderer/rendering_method.mobile="gl_compatibility"
environment/defaults/default_clear_color=Color(0, 0, 0, 1)
```

  - `aspect="keep"` letterboxes the whole 1080x1920 portrait on a desktop browser instead of cropping it. (review)

```gitignore
# godot/wangbi-terminal/.gitignore
.godot/
build/
fonts/
sfx/
*.import
```

```text
; godot/wangbi-terminal/main.tscn
[gd_scene load_steps=2 format=3]

[ext_resource type="Script" path="res://main.gd" id="1"]

[node name="Main" type="Control"]
layout_mode = 3
anchors_preset = 15
anchor_right = 1.0
anchor_bottom = 1.0
mouse_filter = 2
script = ExtResource("1")
```

```gdscript
# godot/wangbi-terminal/main.gd (placeholder until Task 5)
extends Control
```

- [ ] **Step 3: Write the web preset now, so the web export is proven first.** (review)

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

- [ ] **Step 4: Write the failing runner and a stub `Reading`.**

```gdscript
# godot/wangbi-terminal/tests/run.gd
# Headless checks:  npm run test:godot
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

- [ ] **Step 5: Add the npm scripts and see the runner fail.**
  - Add to `package.json` scripts:
    - `"test:godot": "/Applications/Godot.app/Contents/MacOS/Godot --headless --path godot/wangbi-terminal --import && /Applications/Godot.app/Contents/MacOS/Godot --headless --path godot/wangbi-terminal -s res://tests/run.gd"`
    - `"terminal:web": "mkdir -p godot/wangbi-terminal/build/web && /Applications/Godot.app/Contents/MacOS/Godot --headless --path godot/wangbi-terminal --export-release Web build/web/index.html"` (Task 3 prefixes it with the data build).
  - Run: `npm run test:godot`
  - Expected: `FAIL Reading loads`, exit 1.

- [ ] **Step 6: Make it pass.**
  - Change `version()` to return `"1"`.
  - Run: `npm run test:godot`. Expected: `ok   Reading loads`, exit 0.

- [ ] **Step 7: Web smoke test.**
  - Run: `npm run terminal:web && npx serve godot/wangbi-terminal/build/web -l 8060`
  - Open http://localhost:8060 in Chrome. A black page must load with no console errors.
  - Note the total transfer size in the report. That's the real engine cost, so there's no need to assume 8–10 MB.

- [ ] **Step 8: Commit** the project files and `package.json` with the message "Godot terminal: empty project, headless test runner, web export proven".

---

### Task 2: Move the sound recipes to `scripts/sfx.mjs`, add a one-click tick

This moves code without changing it: the lesson must sound exactly the same afterwards. The terminal needs one click per typed character. The lesson's `teletype` is a 20 s train of clicks, so a separate `tick` is added. (review)

**Files:**
- Create: `scripts/sfx.mjs`, `tests/sfx.test.mjs`
- Modify: `scripts/explainer.mjs`. As of commit 2a238dd, the blocks are:
  - lines 50–55: the teletype tick;
  - line 66: `const beep`;
  - lines 80–108: `const makeSfx`;
  - lines 109–114: the generation loop.
  - If the line numbers have moved, find each block by its text.

**Interfaces:**
- Produces:
  - `SFX: Record<string, string[]>`: the ffmpeg input and filter arguments for each sound. Keys: `teletype`, `tick`, `bed`, `beacon`, `beacon-level`, `sweep`, `chatter`, `warble`, `winddown`, `hum`, `relay`, `printer`.
  - `makeSfx(name: string, file: string): void`: writes the sound, with the format taken from the extension (.wav or .ogg). It creates folders as needed and throws on an unknown name.

- [ ] **Step 1: Write the failing test.**

```js
// tests/sfx.test.mjs
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { SFX, makeSfx } from "../scripts/sfx.mjs";

const dir = mkdtempSync(path.join(tmpdir(), "sfx-"));
const seconds = (f) => Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f], { encoding: "utf8" }));

test("every sound the lesson and the terminal use has a recipe", () => {
  for (const k of ["teletype", "tick", "bed", "beacon", "beacon-level", "sweep", "chatter", "warble", "winddown", "hum", "relay", "printer"]) assert.ok(Array.isArray(SFX[k]), k);
});

test("the teletype train is the lesson's own, unchanged", () => {
  assert.deepEqual(SFX.teletype, ["-f", "lavfi", "-i", "aevalsrc=0.3*sin(2*PI*1900*t)*exp(-mod(t\\,0.04)*350):s=44100:d=20"]);
});

test("the terminal's tick is one click of the same sound", () => {
  const f = path.join(dir, "tick.ogg");
  makeSfx("tick", f);
  assert.ok(seconds(f) < 0.1);
});

test("makeSfx writes a file into new folders and refuses an unknown name", () => {
  const f = path.join(dir, "a", "relay.wav");
  makeSfx("relay", f);
  assert.ok(statSync(f).size > 1000);
  assert.throws(() => makeSfx("nope", f), /nope/);
});
```

- [ ] **Step 2: Run it and see it fail.**
  - Run: `node --test tests/sfx.test.mjs`
  - Expected: `Cannot find module '../scripts/sfx.mjs'`.

- [ ] **Step 3: Create `scripts/sfx.mjs` by moving the code.**
  - Copy these verbatim from `scripts/explainer.mjs`:
    - the comment block above `const makeSfx` (from "The flight look's machine sounds" to the `"beacon": "level"` paragraph);
    - `const beep = …`;
    - the whole `makeSfx` object, renamed and exported as `export const SFX = {…}`.
  - Then add:

```js
// scripts/sfx.mjs (the imports go at the top of the file)
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";

// The teletype tick: a short decaying click, 25 a second (one per typed character), 20 s long.
SFX.teletype = ["-f", "lavfi", "-i", "aevalsrc=0.3*sin(2*PI*1900*t)*exp(-mod(t\\,0.04)*350):s=44100:d=20"];
// One click of it, for the terminal to play once per typed character.
SFX.tick = ["-f", "lavfi", "-i", "aevalsrc=0.3*sin(2*PI*1900*t)*exp(-t*350):s=44100:d=0.04"];

// Writes one sound; the extension picks the format (.wav for Remotion, .ogg for Godot's web build).
export function makeSfx(name, file) {
  if (!SFX[name]) throw new Error(`no sound recipe named ${name}`);
  mkdirSync(path.dirname(file), { recursive: true });
  execFileSync("ffmpeg", ["-v", "error", "-y", ...SFX[name], file], { stdio: ["ignore", "pipe", "pipe"] });
}
```

- [ ] **Step 4: Make `scripts/explainer.mjs` use it.**
  - Delete the moved lines and add `import { makeSfx } from "./sfx.mjs";`.
  - Keep `const ticks = "local/sfx/teletype.wav";`, followed by `if (!existsSync(pub(ticks))) makeSfx("teletype", pub(ticks));`.
  - The flight loop body becomes `if (!existsSync(pub(f))) makeSfx(path.basename(f, ".wav"), pub(f));`.

- [ ] **Step 5: Run the tests, and check the lesson's sounds are unchanged.**
  - Run: `node --test tests/sfx.test.mjs && npm test`. Expected: all pass.
  - Compare the old and new sounds:

```bash
mkdir -p /tmp/sfx-check
for s in teletype relay sweep warble winddown bed; do
  node -e "import('./scripts/sfx.mjs').then(m=>m.makeSfx('$s','/tmp/sfx-check/$s.wav'))"
  cmp <(ffmpeg -v error -i public/local/sfx/$s.wav -f s16le -) <(ffmpeg -v error -i /tmp/sfx-check/$s.wav -f s16le -) && echo "$s same"
done
```

  - Expected: six "same" lines. If one differs, stop and report it. Don't change a recipe to make it match.

- [ ] **Step 6: Commit** with the message "Sound recipes move to scripts/sfx.mjs, shared by the explainer and the terminal; a one-click tick".

---

### Task 3: Hand-checked masters and the terminal's data

**Files:**
- Create:
  - `series/wangbi-masters.json`
  - `tests/wangbi-masters.test.mjs`
  - `scripts/terminal-data.mjs`
  - `tests/terminal-data.test.mjs`
  - `godot/wangbi-terminal/data/hexagrams.json` (generated, and committed: it is data, not media)
- Modify: `package.json` (`terminal:web` runs the data build first)

**Interfaces:**
- `series/wangbi-masters.json` shape: `{ "about": string, "hexagrams": { "<1-64>": { "masters": [{ "line": 1-6, "zh": string, "en": string, "where": string }], "checked": string } } }`
  - `line` is the master line.
  - `where` is where the phrase stands, which can be a different line's note: 16's master is L4, and the phrase is in the note on line 5. (review)
  - `masters: []` means Wang Bi names none.
- `buildTerminalData(hexagrams, masters) -> { [key]: Entry }`:
  - `Entry = { number, zh, pinyin, name, lines, upper: Tri, lower: Tri, masters: [{line, zh, en}] }`
  - `Tri = { key, zh, name, does }`
  - It throws if any displayed string holds a banned word, or if a master lacks English. (review)
- `displayText(data) -> string`: every distinct non-ASCII character in the displayed strings, including pinyin and full-width punctuation. It feeds the font subset. (review)

- [ ] **Step 1: Seed the masters file.**
  - Copy the nine readout masters exactly as in `series/copy.json`, with `checked: "shorts readout"`. Fill `where` from `~/projects/8bitoracle-next/src/constants/wangBiZhu.ts`:

| # | Master | zh | en |
|---|---|---|---|
| 13 | L2 | 二為同人之主 | Line two, master of Fellowship |
| 14 | L5 | 為大有之主 | Ruler of Great Possession |
| 16 | L4 | 四以剛動，為豫之主 | Line four, master of Enthusiasm |
| 20 | L5 | 為觀之主 | Master of Contemplation |
| 25 | L5 | 為无妄之主 | Master of No Falseness |
| 26 | L5 | 為畜之主 | Master of Accumulation |
| 33 | L2 | 為遯之主 | Master of Retreat |
| 59 | L5 | 為渙之主 | Master of Dispersion |
| 60 | L5 | 為節之主 | Master of Limitation |

  - 16's phrase is in the note on line 5, so its `where` is `"note on line 5"`.
  - Add the lesson's own two, with `checked: "Wang Bi lesson"`:
    - 7 L2 `為師之主` "Master of the army"
    - 22 L5 `為飾之主` "Master of adornment"

- [ ] **Step 2: Read the other 53 by hand.**
  - For each hexagram, read Wang Bi's notes on the lines and on the Judgment:
    - `~/projects/chinese-classics-reference/src/data/zhouyi-zhushu/hexagrams/<nn>-*.json`;
    - `~/projects/8bitoracle-next/src/constants/wangBiZhu.ts`.
  - Start from the candidates in `series/wangbi.json` (`masters` and `judgment`), and add any master the extractor missed.
  - The extractor assigns the note's own line number, so read which line the phrase is about. 36's line 1 note speaks of line 6. (review)
  - Record a line only where he says that line is master of the hexagram. These don't count:
    - master of one trigram (39 L3);
    - "supports the master" (16 L3);
    - a ruler being removed (36 L3);
    - a deity (42 L2);
    - a warning against being master (46 L6).
  - Settle these Judgment-note cases:
    - 10: `三為履主` gives L3, which the extractor missed.
    - 13: in `judgment` but never promoted to a master; already seeded.
    - 30: `以柔順為主`.
    - 55: `為天下之主`.
  - Source checks in the review support 27 L6 and 64 L5.
  - Write `masters: []` where he names none. Every entry gets `checked: "chinese-classics-reference: <file>"`.
  - This step is reading, not code. List each verdict in the commit message.

- [ ] **Step 3: Write the masters test.**

```js
// tests/wangbi-masters.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const m = JSON.parse(readFileSync(new URL("../series/wangbi-masters.json", import.meta.url), "utf8")).hexagrams;
const copy = JSON.parse(readFileSync(new URL("../series/copy.json", import.meta.url), "utf8"));
const lines = (n) => m[n].masters.map((x) => x.line);

test("all 64 hexagrams are checked", () => {
  assert.deepEqual(Object.keys(m).map(Number).sort((a, b) => a - b), Array.from({ length: 64 }, (_, i) => i + 1));
  for (const [n, h] of Object.entries(m)) assert.ok(h.checked, `${n} has no checked note`);
});

test("each master is a line 1-6 with its phrase, English and where the phrase is", () => {
  for (const [n, h] of Object.entries(m))
    for (const x of h.masters) {
      assert.ok(Number.isInteger(x.line) && x.line >= 1 && x.line <= 6, `${n} line`);
      assert.match(x.zh, /主/, `${n} zh names a master`);
      assert.ok(x.en, `${n} en`);
      assert.ok(x.where, `${n} where`);
    }
});

test("the shorts' readouts and the terminal agree", () => {
  for (const [n, row] of Object.entries(copy)) {
    const master = row.lesson?.readout?.master;
    if (master) assert.ok(m[n].masters.some((x) => x.zh === master.zh), `${n}: ${master.zh}`);
  }
});

test("the extractor's mistakes are not repeated", () => {
  assert.deepEqual(lines(16), [4], "16: the master is L4, named in the note on L5");
  assert.ok(!lines(36).includes(1) && !lines(36).includes(3), "36: L1's note speaks of L6; L3 removes the dark ruler");
  assert.ok(!lines(42).includes(2), "42 L2 is the Supreme Deity");
  assert.ok(!lines(46).includes(6), "46 L6 warns against being master");
  assert.ok(!lines(39).includes(3), "39 L3 is master of the lower trigram only");
  assert.deepEqual(lines(10), [3], "10: 三為履主");
});
```

  - Run: `node --test tests/wangbi-masters.test.mjs`. It fails until Step 2 is complete, then passes.

- [ ] **Step 4: Write the failing test for the terminal data.**

```js
// tests/terminal-data.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildTerminalData, displayText } from "../scripts/terminal-data.mjs";

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

test("the font subset covers every non-ASCII character shown, pinyin and punctuation too", () => {
  const text = displayText(data);
  for (const e of Object.values(data))
    for (const s of [e.zh, e.pinyin, e.name, e.upper.zh, e.lower.zh, ...e.masters.flatMap((x) => [x.zh, x.en])])
      for (const ch of s) if (ch.charCodeAt(0) > 127) assert.ok(text.includes(ch), ch);
  assert.ok(text.includes("，"), "16's full-width comma");
});

test("banned words and a master without English are refused", () => {
  const bad = structuredClone(masters);
  bad[7].masters[0].en = "An oracle";
  assert.throws(() => buildTerminalData(hexagrams, bad), /banned/);
  bad[7].masters[0].en = "";
  assert.throws(() => buildTerminalData(hexagrams, bad), /English/);
});
```

  - Run: `node --test tests/terminal-data.test.mjs`
  - Expected: FAIL, module not found.

- [ ] **Step 5: Write `scripts/terminal-data.mjs`.**

```js
// scripts/terminal-data.mjs
// Builds the Godot terminal's inputs from the series data: data/hexagrams.json (committed),
// and, gitignored, the fonts (Pixel Operator; Noto Sans TC subset to the non-ASCII characters
// shown) and the sounds as .ogg (scripts/sfx.mjs).
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
const BANNED = /oracle|divin|fortune|predict|mystical|magical|预测|預測|占卜|算命|神諭/i;
const strings = (e) => [e.zh, e.pinyin, e.name, e.upper.zh, e.upper.name, e.upper.does, e.lower.zh, e.lower.name, e.lower.does, ...e.masters.flatMap((x) => [x.zh, x.en])];

export function buildTerminalData(hexagrams, masters) {
  const out = {};
  for (const h of [...hexagrams].sort((a, b) => a.number - b.number)) {
    const key = h.lines.join("");
    const e = {
      number: h.number, zh: h.zh, pinyin: h.pinyin, name: h.name.toUpperCase(), lines: h.lines,
      lower: TRIGRAMS[key.slice(0, 3)], upper: TRIGRAMS[key.slice(3)],
      masters: masters[h.number].masters.map(({ line, zh, en }) => ({ line, zh, en })),
    };
    for (const x of e.masters) if (!x.en) throw new Error(`${h.number} L${x.line}: a master needs English beside ${x.zh}`);
    for (const s of strings(e)) if (BANNED.test(s)) throw new Error(`${h.number}: banned word in "${s}"`);
    out[key] = e;
  }
  return out;
}

// Every non-ASCII character shown; Pixel Operator has ASCII only, so these fall back to Noto.
export const displayText = (data) => [...new Set(Object.values(data).flatMap(strings).join("").replace(/[\x00-\x7f]/g, ""))].join("");

if (import.meta.url === `file://${process.argv[1]}`) {
  const root = path.resolve(import.meta.dirname, "..");
  const godot = path.join(root, "godot/wangbi-terminal");
  const read = (p) => JSON.parse(readFileSync(path.join(root, p), "utf8"));
  const data = buildTerminalData(read("series/hexagrams.json"), read("series/wangbi-masters.json").hexagrams);
  mkdirSync(path.join(godot, "data"), { recursive: true });
  writeFileSync(path.join(godot, "data/hexagrams.json"), JSON.stringify(data, null, 1) + "\n");
  mkdirSync(path.join(godot, "fonts"), { recursive: true });
  copyFileSync(path.join(root, "public/fonts/PixelOperator-Bold.ttf"), path.join(godot, "fonts/PixelOperator-Bold.ttf"));
  // Noto Sans TC (SIL OFL), kept in public/local (gitignored). A character it lacks fails here.
  const noto = path.join(root, "public/local/fonts/NotoSansTC-wght.ttf");
  if (!existsSync(noto)) {
    mkdirSync(path.dirname(noto), { recursive: true });
    execFileSync("curl", ["-sfL", "-o", noto, "https://github.com/google/fonts/raw/main/ofl/notosanstc/NotoSansTC%5Bwght%5D.ttf"]);
  }
  execFileSync("pyftsubset", [noto, `--text=${displayText(data)}`, "--no-ignore-missing-unicodes", `--output-file=${path.join(godot, "fonts/NotoSansTC-subset.ttf")}`]);
  for (const s of ["tick", "relay", "sweep", "warble", "winddown", "bed"]) makeSfx(s, path.join(godot, "sfx", `${s}.ogg`));
  console.log(`wrote ${Object.keys(data).length} hexagrams, fonts and sounds into godot/wangbi-terminal`);
}
```

- [ ] **Step 6: Run the CLI and the tests.**
  - Change `terminal:web` in `package.json` to begin with `node scripts/terminal-data.mjs && `.
  - Run: `node scripts/terminal-data.mjs && node --test tests/terminal-data.test.mjs tests/wangbi-masters.test.mjs`
  - Expected: all pass, and `fonts/NotoSansTC-subset.ttf` is under 200 KB.

- [ ] **Step 7: Commit** the masters file, the script, both tests, the data and `package.json`, with the message "Terminal data: hand-checked Wang Bi masters for all 64, and the Godot data build". The commit body lists each non-seeded verdict.

---

### Task 4: `reading.gd`, the rules and the text

**Files:**
- Modify: `godot/wangbi-terminal/reading.gd`, `godot/wangbi-terminal/tests/run.gd`

**Interfaces:**
- Consumes: `res://data/hexagrams.json` (Task 3).
- Produces (all static; array results are plain `Array`):
  - `load_data() -> Dictionary`
  - `key(lines) -> String`
  - `lines_of(data, number: int) -> Array`: `[]` if no such number.
  - `flip(lines, n) -> Array`
  - `place(lines, n) -> String`: `"CORRECT"`, `"NOT CORRECT"` or `"NO FIXED PLACE"`.
  - `is_centre(n) -> bool`
  - `partner(n) -> int`
  - `answers(lines, n) -> bool`
  - `log_row(lines, n) -> String`
  - `title(entry) -> String`
  - `trigram_rows(entry) -> Array`
  - `wangbi_rows(entry) -> Array`
  - `master_lines(entry) -> Array`
  - `turn_target(turn: float) -> float`
  - `NO_MASTER`

- [ ] **Step 1: Replace `tests/run.gd` with the rule checks.**

```gdscript
# godot/wangbi-terminal/tests/run.gd
# Headless checks of reading.gd against the lesson's own examples:  npm run test:godot
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
	check(Reading.lines_of(data, 7) == army and Reading.lines_of(data, 65) == [], "number to lines")
	# 辯位: 1 and 6 have no fixed yin/yang place; 2 and 4 are yin places; 3 and 5 yang places.
	check(Reading.place(army, 1) == "NO FIXED PLACE" and Reading.place(army, 6) == "NO FIXED PLACE", "1 and 6")
	check(Reading.place(army, 2) == "NOT CORRECT", "7 L2 is yang in a yin place")
	check(Reading.place(army, 4) == "CORRECT", "7 L4 is yin in a yin place")
	check(Reading.place(army, 5) == "NOT CORRECT", "7 L5 is yin in a yang place")
	check(Reading.is_centre(2) and Reading.is_centre(5) and not Reading.is_centre(3), "centres are 2 and 5")
	check(Reading.partner(1) == 4 and Reading.partner(5) == 2 and Reading.partner(6) == 3, "partners")
	check(Reading.answers(army, 2) and Reading.answers(army, 5), "7: L2 answers L5")
	check(not Reading.answers(army, 1), "7: L1 and L4, both yin, do not answer")
	check(Reading.log_row(army, 2) == "L2  YANG  NOT CORRECT  CENTRE  ANSWERS L5", "7 L2 row")
	check(Reading.log_row(army, 1) == "L1  YIN   NO FIXED PLACE", "7 L1 row")
	check(Reading.title(data["010000"]) == "7  師 SHĪ  THE ARMY", "7 title")
	check(Reading.master_lines(data["010000"]) == [2], "7: master L2")
	check(Reading.master_lines(data["101001"]) == [5], "22: master L5")
	check(Reading.master_lines(data["110111"]) == [3], "10: master L3")
	check(Reading.trigram_rows(data["010000"]) == ["UPPER  坤 EARTH, YIELDING", "LOWER  坎 WATER, SINKING"], "7 trigrams")
	# Review Focus 2: flips in a row read as the final lines; an interrupted turn ends square.
	var l := Reading.flip(Reading.flip(Reading.flip(army, 2), 2), 5)
	check(army == [0, 1, 0, 0, 0, 0], "flip leaves its input alone")
	check(Reading.key(l) == "010010", "three flips give the final lines")
	check(is_equal_approx(Reading.turn_target(0.0), TAU) and is_equal_approx(Reading.turn_target(TAU * 1.4), TAU * 2), "turns end square")
	# Review Focus 3: several masters, and none.
	var two := {"masters": [{"line": 2, "zh": "甲之主", "en": "A"}, {"line": 5, "zh": "乙之主", "en": "B"}]}
	check(Reading.master_lines(two) == [2, 5], "two masters, both amber")
	check(Reading.wangbi_rows(two) == ["L2  甲之主  A", "L5  乙之主  B"], "a row for each master")
	check(Reading.wangbi_rows({"masters": []}) == [Reading.NO_MASTER] and Reading.master_lines({"masters": []}) == [], "no master: the sentence and no amber")
	quit(1 if failed else 0)
```

  - The title check assumes `series/hexagrams.json` has pinyin `"Shī"` and name `"The Army"` for 7. If not, print the entry and correct the expected string, not the rule.

- [ ] **Step 2: Run it and see it fail.**
  - Run: `npm run test:godot`
  - Expected: an error that `load_data` is not found.

- [ ] **Step 3: Write `reading.gd`.**

```gdscript
# godot/wangbi-terminal/reading.gd
# The lesson's structural reading of a hexagram, after Wang Bi: places (略例·辯位), answering
# pairs (應, 略例·明卦適變通爻), and the master he names in his notes (hand-checked,
# series/wangbi-masters.json). Lines are bottom-first arrays of 0 (yin) and 1 (yang);
# line numbers run 1-6 from the bottom.
class_name Reading
extends RefCounted

const NO_MASTER := "WANG BI NAMES NO MASTER HERE"

static func load_data() -> Dictionary:
	var f := FileAccess.open("res://data/hexagrams.json", FileAccess.READ)
	return JSON.parse_string(f.get_as_text())

static func key(lines: Array) -> String:
	return "".join(lines.map(func(x): return str(int(x))))

static func lines_of(data: Dictionary, number: int) -> Array:
	for e in data.values():
		if int(e.number) == number:
			return e.lines.map(func(x): return int(x))
	return []

static func flip(lines: Array, n: int) -> Array:
	var out := lines.duplicate()
	out[n - 1] = 1 - int(out[n - 1])
	return out

# 辯位: the first and top lines have no fixed yin or yang place; 3 and 5 are yang places, 2 and 4 yin.
static func place(lines: Array, n: int) -> String:
	if n == 1 or n == 6:
		return "NO FIXED PLACE"
	return "CORRECT" if int(lines[n - 1]) == n % 2 else "NOT CORRECT"

static func is_centre(n: int) -> bool:
	return n == 2 or n == 5

static func partner(n: int) -> int:
	return n + 3 if n <= 3 else n - 3

static func answers(lines: Array, n: int) -> bool:
	return int(lines[n - 1]) != int(lines[partner(n) - 1])

static func log_row(lines: Array, n: int) -> String:
	var parts := ["L%d" % n, "YANG" if int(lines[n - 1]) == 1 else "YIN ", place(lines, n)]
	if is_centre(n):
		parts.append("CENTRE")
	if answers(lines, n):
		parts.append("ANSWERS L%d" % partner(n))
	return "  ".join(parts)

static func title(entry: Dictionary) -> String:
	return "%d  %s %s  %s" % [int(entry.number), entry.zh, String(entry.pinyin).to_upper(), entry.name]

static func trigram_rows(entry: Dictionary) -> Array:
	var out := []
	for side in ["upper", "lower"]:
		var t: Dictionary = entry[side]
		out.append("%s  %s %s, %s" % [side.to_upper(), t.zh, t.name, t.does])
	return out

static func master_lines(entry: Dictionary) -> Array:
	return entry.masters.map(func(m): return int(m.line))

static func wangbi_rows(entry: Dictionary) -> Array:
	var out: Array = entry.masters.map(func(m): return "L%d  %s  %s" % [int(m.line), m.zh, m.en])
	if out.is_empty():
		out.append(NO_MASTER)
	return out

# The next whole turn from any angle, so an interrupted turn still ends square to the viewer.
static func turn_target(turn: float) -> float:
	return (floor(turn / TAU + 1e-6) + 1.0) * TAU
```

  - `place` compares with `n % 2` because a yang place (3, 5) has `n % 2 == 1` and a yin place (2, 4) has `n % 2 == 0`.
  - JSON numbers load as floats, which is why the code casts with `int()`.

- [ ] **Step 4: Run it and see it pass.**
  - Run: `npm run test:godot`
  - Expected: every line `ok`, exit 0.

- [ ] **Step 5: Commit** with the message "Terminal: reading.gd, the lesson's places, centres, answering pairs and Wang Bi's masters, tested headless".

---

### Task 5: The screen (still), with a review by the user

**Files:**
- Create: `godot/wangbi-terminal/plot.gd` and `godot/wangbi-terminal/scanlines.gdshader`
- Replace: `godot/wangbi-terminal/main.gd`

**Interfaces:**
- Consumes: `Reading` (Task 4).
- Produces:
  - `Plot` (Node2D):
    - `lines: Array` and `amber: Array` (setting either redraws);
    - `turn: float` (radians);
    - `line_at(global_point: Vector2) -> int`: 1 to 6, or 0. It hit-tests the projected shapes as drawn, including mid-turn. (review)
  - `main.gd`: `show_lines(lines: Array)` sets every text and the plot from the lines.

- [ ] **Step 1: Write the plot.** It projects as `boxEdges` does in `src/scenes/Readout.tsx`, and keeps each line's projected outline for hit-testing.

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
const TAP_PAD := 18.0  # px added around a line's outline, so a thin line is easy to tap

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
var outlines := {}  # line number -> Array of PackedVector2Array, in local px, as last drawn

static func line_z(i: int) -> float:
	var total := 6 * LINE_H + 4 * GAP + TRIGRAM_GAP
	return -total / 2 + LINE_H / 2 + i * (LINE_H + GAP) + (TRIGRAM_GAP - GAP if i >= 3 else 0.0)

func slabs() -> Array:
	var out := []
	for i in 6:
		var z := line_z(i)
		if int(lines[i]) == 1:
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
	outlines.clear()
	for s in slabs():
		var n: int = s[0] + 1
		var colour := AMBER if n in amber else GREEN
		var c := PackedVector2Array()
		for x in [s[1], s[2]]:
			for y in [-DEPTH / 2, DEPTH / 2]:
				for z in [s[3] - LINE_H / 2, s[3] + LINE_H / 2]:
					c.append(project(Vector3(x, y, z)))
		# Corner index is x*4 + y*2 + z; the 12 edges join corners that differ in one bit.
		for a in 8:
			for b in [1, 2, 4]:
				if a & b == 0:
					draw_line(c[a], c[a | b], colour, 2.0, true)
		var hull := Geometry2D.convex_hull(c)
		var padded := Geometry2D.offset_polygon(hull, TAP_PAD)
		outlines[n] = outlines.get(n, []) + (padded if padded.size() else [hull])

func line_at(global_point: Vector2) -> int:
	var p := to_local(global_point)
	for n in outlines:
		for poly in outlines[n]:
			if Geometry2D.is_point_in_polygon(p, poly):
				return n
	return 0
```

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

- [ ] **Step 3: Write `main.gd` (layout and `show_lines`).**
  - The screen order runs top to bottom: title, plot, log, trigrams, WANG BI, prompt. The spec now lists the same order. (review)
  - Every `Control` ignores the mouse, and taps are read in Task 6's `_input`. (review)
  - Labels wrap at 960 px. (review)

```gdscript
# godot/wangbi-terminal/main.gd
extends Control

const GREEN := Color("#7dff8a")
const DIM := Color(0.49, 1.0, 0.54, 0.45)
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
var sound_toggle := Label.new()

func font() -> Font:
	var pixel := load("res://fonts/PixelOperator-Bold.ttf") as FontFile
	pixel.fallbacks = [load("res://fonts/NotoSansTC-subset.ttf")]
	return pixel

func label(l: Label, pos: Vector2, size: int, colour: Color) -> void:
	l.position = pos
	l.size = Vector2(960, 0)
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	l.mouse_filter = Control.MOUSE_FILTER_IGNORE
	l.add_theme_font_override("font", font())
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", colour)
	l.add_theme_constant_override("outline_size", 6)
	l.add_theme_color_override("font_outline_color", Color(colour, 0.35))
	add_child(l)

func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	var frame := ReferenceRect.new()
	frame.border_color = GREEN
	frame.border_width = 4
	frame.editor_only = false
	frame.mouse_filter = Control.MOUSE_FILTER_IGNORE
	frame.position = Vector2(40, 40)
	frame.size = Vector2(1000, 1840)
	add_child(frame)
	label(title, Vector2(60, 70), 44, GREEN)
	plot.position = Vector2(540, 560)
	add_child(plot)
	label(log_label, Vector2(60, 960), 34, GREEN)
	label(trigrams, Vector2(60, 1250), 34, DIM)
	label(wangbi, Vector2(60, 1380), 34, GREEN)
	label(prompt, Vector2(60, 1770), 38, CYAN)
	label(sound_toggle, Vector2(760, 1770), 30, DIM)
	sound_toggle.size = Vector2(260, 0)
	sound_toggle.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	sound_toggle.text = "SOUND OFF"
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
	title.text = Reading.title(e)
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

  - The SOUND toggle is dim green, not cyan, because cyan is only for the prompt.

- [ ] **Step 4: Render stills and show the user.**
  - Add a temporary `--lines 010000` user argument to `_ready`. It goes through `OS.get_cmdline_user_args()` and sets `lines` before `show_lines`. Keep it: it is also useful for recordings.
  - Render three stills:
    - 7 師;
    - the hexagram with the longest title;
    - a hexagram with two masters from the table, if there is one.
  - Command: `/Applications/Godot.app/Contents/MacOS/Godot --path godot/wangbi-terminal --write-movie /tmp/terminal-7.png --fixed-fps 60 --quit-after 3 -- --lines 010000`
  - Check yourself first:
    - the frame is green;
    - only master lines are amber;
    - the prompt is cyan;
    - no boxes for Chinese or pinyin;
    - nothing overlaps or runs past the frame.
  - Join the three stills side by side, and send them to the user with SendUserFile.
  - Stop until the user has seen them. Their changes come before Task 6.

- [ ] **Step 5: Commit** with the message "Terminal: the readout screen (title, plot, log, trigrams, WANG BI, prompt)".

---

### Task 6: Input, typing, the one slow turn, sound, number entry

**Files:**
- Modify: `godot/wangbi-terminal/main.gd`

**Interfaces:**
- Consumes:
  - `Plot.line_at`, `show_lines` (Task 5);
  - `Reading.flip`, `Reading.lines_of`, `Reading.turn_target` (Task 4);
  - `sfx/*.ogg` (Task 3).
- Produces:
  - `set_lines(l: Array)`: the one entry point for any change of lines.
  - `signal reading_typed`: emitted when the whole reading has been typed.

Keys:
- `1`–`6` flip lines.
- `G` starts number entry: the prompt shows `GO TO: _`. Digits then build a number and don't flip lines, `Enter` jumps to that hexagram, and `Esc` cancels.
- `S` or a tap on SOUND toggles the looped bed. It is off by default. (review)

- [ ] **Step 1: Append to `main.gd`.**

```gdscript
# Input, typing, the turn and sound. Every change goes through set_lines, so what shows is
# always the reading of the lines as they are now (Review Focus 2).
signal reading_typed

var sounds := {}
var typed := 0.0
var typing_speed := 25.0  # characters a second, as the lesson types
var tween: Tween
var entering := ""  # digits typed after G; "" when not entering a number
var entry := false
var bed_on := false

func sound(name: String) -> AudioStreamPlayer:
	if not sounds.has(name):
		var p := AudioStreamPlayer.new()
		p.stream = load("res://sfx/%s.ogg" % name)
		add_child(p)
		sounds[name] = p
	return sounds[name]

func play(name: String) -> void:
	sound(name).play()

func set_lines(l: Array) -> void:
	var before: Array = Reading.master_lines(data[Reading.key(lines)])
	show_lines(l)
	typed = 0.0
	for x in [log_label, trigrams, wangbi]:
		x.visible_characters = 0
	if tween:
		tween.kill()
	tween = create_tween()
	tween.tween_property(plot, "turn", Reading.turn_target(plot.turn), 6.0).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
	play("relay")
	var now: Array = Reading.master_lines(data[Reading.key(l)])
	if now != before and not now.is_empty():
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
		play("tick")
	if typed >= total:
		play("winddown")
		reading_typed.emit()

func toggle_bed() -> void:
	bed_on = not bed_on
	var p := sound("bed")
	(p.stream as AudioStreamOggVorbis).loop = true
	if bed_on:
		p.play()
	else:
		p.stop()
	sound_toggle.text = "SOUND ON" if bed_on else "SOUND OFF"

func _input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		if sound_toggle.get_global_rect().grow(20).has_point(event.position):
			toggle_bed()
			return
		var n := plot.line_at(event.position)
		if n:
			set_lines(Reading.flip(lines, n))
	elif event is InputEventKey and event.pressed and not event.echo:
		if entry:
			if event.keycode >= KEY_0 and event.keycode <= KEY_9 and entering.length() < 2:
				entering += str(event.keycode - KEY_0)
			elif event.keycode == KEY_ENTER or event.keycode == KEY_KP_ENTER:
				var l := Reading.lines_of(data, int(entering)) if entering != "" else []
				entry = false
				if not l.is_empty():
					set_lines(l)
			elif event.keycode == KEY_ESCAPE:
				entry = false
			prompt.text = ("GO TO: %s_" % entering) if entry else PROMPT
		elif event.keycode == KEY_G:
			entry = true
			entering = ""
			prompt.text = "GO TO: _"
		elif event.keycode == KEY_S:
			toggle_bed()
		elif event.keycode >= KEY_1 and event.keycode <= KEY_6:
			set_lines(Reading.flip(lines, event.keycode - KEY_0))
```

- [ ] **Step 2: Play the sweep once on start.**
  - At the end of `_ready`, call `play("sweep")`.
  - On the web the engine only starts after the HTML START button (Task 8). That click is the gesture that unlocks audio, so no in-game start tap is needed. (review)

- [ ] **Step 3: Run the headless tests.**
  - Run: `npm run test:godot`. It should still be green.

- [ ] **Step 4: Check by hand in the window.**
  - Run: `/Applications/Godot.app/Contents/MacOS/Godot --path godot/wangbi-terminal`
  - Check each of these:
    - Tapping each line flips it.
    - Mid-turn, a tap on a line flips that line, not a neighbour.
    - Tapping 7's L2 five times fast ends with L2 yin, on 2 坤's reading. Typing restarts, and the turn ends square.
    - `G 2 2 Enter` goes to 22, and only L5 is amber.
    - `G 9 9 Enter` does nothing.
    - `S`, and a tap on SOUND, toggle the bed.
  - Record what you saw in the task report.

- [ ] **Step 5: Commit** with the message "Terminal: tap or keys flip lines; number entry; typing, one slow turn, the lesson's sounds; SOUND toggle".

---

### Task 7: Record mode for shorts

**Files:**
- Modify: `godot/wangbi-terminal/main.gd`
- Create: `scripts/terminal-record.mjs`

**Interfaces:**
- Consumes: `set_lines` and `reading_typed` (Task 6).
- Produces: `node scripts/terminal-record.mjs <name>`, which writes `out/terminal/<name>.mp4` (1080x1920, 60 fps, yuv420p, faststart, AAC sound).

The timeline waits for each reading to finish typing before its hold, so no hold cuts the reading short. (review)
1. Start from `[1,1,1,1,1,1]`, then flip L1, L3, L4, L5, L6 one second apart. That builds 7 師, and the typing restarts each time.
2. Wait for `reading_typed`, then hold 3 s.
3. Flip L2 (to 2 坤), wait for `reading_typed`, and hold 3 s.
4. Flip L2 back (7), wait for `reading_typed`, and hold 3 s. Then quit.

The length is measured, not assumed.

- [ ] **Step 1: Add the sequence to `main.gd`.**

```gdscript
# Record mode (-- --record): a fixed sequence for shorts, recorded by scripts/terminal-record.mjs.
func record() -> void:
	show_lines([1, 1, 1, 1, 1, 1])
	for n in [1, 3, 4, 5, 6]:
		await get_tree().create_timer(1.0).timeout
		set_lines(Reading.flip(lines, n))
	for step in [0, 2, 2]:
		if step:
			set_lines(Reading.flip(lines, step))
		await reading_typed
		await get_tree().create_timer(3.0).timeout
	get_tree().quit()
```

  - At the end of `_ready`, add: `if "--record" in OS.get_cmdline_user_args(): record()`.

- [ ] **Step 2: Write the recorder.**

```js
// scripts/terminal-record.mjs
// Records the terminal's --record sequence with Godot's movie maker (frame-exact, with sound):
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
execFileSync("/Applications/Godot.app/Contents/MacOS/Godot", ["--path", path.join(root, "godot/wangbi-terminal"), "--write-movie", avi, "--fixed-fps", "60", "--", "--record"], { stdio: "inherit" });
execFileSync("ffmpeg", ["-v", "error", "-y", "-i", avi, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-c:a", "aac", "-movflags", "+faststart", path.join(dir, `${name}.mp4`)]);
rmSync(avi);
console.log(`wrote out/terminal/${name}.mp4`);
```

- [ ] **Step 3: Record and check.**
  - Run: `node scripts/terminal-record.mjs 7-army`
  - Check that `ffprobe` shows 1080x1920, 60 fps and an audio stream. Note the length.
  - Make a strip of 5 frames: the build, 7's amber L2 held, mid-turn, 2's reading held, and 7 again.
  - Send the strip and the clip to the user, one SendUserFile call each.

- [ ] **Step 4: Commit** with the message "Terminal: --record mode and scripts/terminal-record.mjs for shorts".

---

### Task 8: Web export with a START gate

**Files:**
- Create: `godot/wangbi-terminal/shell.html`, `tests/terminal-export.test.mjs`
- Modify: `godot/wangbi-terminal/export_presets.cfg` (add the custom shell)

**Interfaces:**
- Produces: `npm run terminal:web`, which now shows only a START button until it's pressed.

- [ ] **Step 1: Write the failing test** (Review Focus 5).

```js
// tests/terminal-export.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const cfg = read("../godot/wangbi-terminal/export_presets.cfg");

test("the web preset packs the data, single-threaded, into build/web", () => {
  assert.match(cfg, /platform="Web"/);
  assert.match(cfg, /include_filter="[^"]*data\/\*\.json/);
  assert.match(cfg, /variant\/thread_support=false/);
  assert.match(cfg, /export_path="build\/web\/index.html"/);
});

test("the engine downloads only after START", () => {
  assert.match(cfg, /html\/custom_html_shell="res:\/\/shell.html"/);
  const shell = read("../godot/wangbi-terminal/shell.html");
  const start = shell.indexOf("addEventListener('click'");
  assert.ok(start > 0, "a click handler");
  assert.ok(shell.indexOf("startGame(") > start, "startGame is called inside the click handler, not on load");
});
```

  - Run: `node --test tests/terminal-export.test.mjs`
  - Expected: FAIL on the shell.

- [ ] **Step 2: Write the shell and point the preset at it.**

```html
<!-- godot/wangbi-terminal/shell.html: Godot's web shell, with the engine loaded only after START. -->
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
<title>Wang Bi Terminal</title>
<style>
html, body { margin: 0; height: 100%; background: #000; color: #7dff8a; font: 700 20px monospace; }
#canvas { display: none; width: 100%; height: 100%; }
#start { position: fixed; inset: 0; display: grid; place-items: center; text-align: center; }
#start button { background: none; border: 2px solid #7dff8a; color: #5ee7ff; font: inherit; padding: 16px 32px; cursor: pointer; }
#start p { color: rgba(125,255,138,0.45); font-size: 14px; }
</style>
$GODOT_HEAD_INCLUDE
</head>
<body>
<canvas id="canvas"></canvas>
<div id="start"><div><button id="go">START</button><p id="note">TAP A LINE TO CHANGE IT. LOADS ABOUT $SIZE.</p></div></div>
<script src="$GODOT_URL"></script>
<script>
const engine = new Engine($GODOT_CONFIG);
document.getElementById('go').addEventListener('click', () => {
  document.getElementById('note').textContent = 'LOADING…';
  document.getElementById('canvas').style.display = 'block';
  engine.startGame().then(() => document.getElementById('start').remove());
});
</script>
</body>
</html>
```

  - Replace `$SIZE` with the transfer size measured in Task 1, Step 7, for example `9 MB`. It's a literal in the file, not a Godot placeholder.
  - Add `html/custom_html_shell="res://shell.html"` to `[preset.0.options]`, and `shell.html` to `exclude_filter` so it isn't packed: `exclude_filter="tests/*,shell.html"`.

- [ ] **Step 3: Export and try it.**
  - Run: `npm run terminal:web && node --test tests/terminal-export.test.mjs`
  - Serve it: `npx serve godot/wangbi-terminal/build/web -l 8060`
  - Open it in Chrome with DevTools' network tab. Before START, only `index.html` and `index.js` load. The `.wasm` and `.pck` load after START.
  - On a phone on the same network:
    - START loads the terminal;
    - the sweep plays;
    - taps flip lines;
    - the Chinese and pinyin render;
    - SOUND works;
    - no console errors.
  - Note the size and load time in the report.

- [ ] **Step 4: Commit** with the message "Terminal: web export behind a START button; the engine loads only when asked".

---

### Task 9: Full test run and a spec check

**Files:**
- Modify: `docs/superpowers/specs/2026-09-28-godot-wangbi-terminal-design.md` (status line only)

- [ ] **Step 1: Run everything.**
  - Run: `npm test && npm run test:godot`
  - Expected: all green. Report the counts.

- [ ] **Step 2: Check the fixed on-screen text.**
  - The data is checked in Task 3; this checks the text written into the code.
  - Run: `grep -n -i -E "oracle|divin|fortune|predict|mystical|magical|预测|預測|占卜|算命|神諭" godot/wangbi-terminal/*.gd godot/wangbi-terminal/shell.html`
  - Expected: no output.

- [ ] **Step 3: Update the spec's status line** to "Built through the web export; not yet on the sites", then commit and push `series-64`.

---

### Task 10: Put it on the two sites (stop for approval)

**Files (other repos, each on a new branch `terminal`):**
- `~/projects/sixlines-site`: `public/terminal/*`, `src/middleware.ts` (matcher), `next.config.ts` (a redirect)
- `~/projects/8bitoracle-brand`: `public/terminal/*`, `src/middleware.ts`, `next.config.mjs`

- [ ] **Step 1: Keep `/terminal` out of the locale middleware.**
  - Add `terminal` to each negative lookahead:
    - sixlines-site `src/middleware.ts:179`: `'/((?!api|_next|sitemaps|terminal|.*\\..*).*)'`
    - 8bitoracle-brand `src/middleware.ts:62`: `"/((?!api|go|_next|_vercel|terminal|.*\\..*).*)"`

- [ ] **Step 2: Send `/terminal` to the page's real URL, so relative asset paths resolve.** (review)
  - The export loads `index.js`, `index.wasm` and `index.pck` relative to the page. A rewrite would keep the browser at `/terminal`, so the files would be fetched from the site root.
  - Add a redirect (not a rewrite) in each Next config:

```js
async redirects() {
  return [{ source: "/terminal", destination: "/terminal/index.html", permanent: false }];
}
```

  - If the config already has a `redirects()`, add the entry to its list.

- [ ] **Step 3: Copy and check locally.**
  - Copy `godot/wangbi-terminal/build/web/*` to each site's `public/terminal/`.
  - Run each site's `build` and `start`, then check:
    - `curl -sI localhost:3000/terminal` is a 307 to `/terminal/index.html`;
    - `/terminal/index.html`, `/terminal/index.js`, `/terminal/index.pck` and `/terminal/index.wasm` each return 200;
    - the `.wasm` is `application/wasm`;
    - START works in a browser through each server.

- [ ] **Step 4: Stop.**
  - Report both branches to the user, with the check results.
  - Don't merge, push to main or deploy either site without the user's approval of that step.
