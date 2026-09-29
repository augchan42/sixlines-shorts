# Wang Bi terminal in Godot: design

Status: 2026-09-28. The user answered the open questions (see Decisions). Revised after the gpt-6-astra review (docs/research/2026-09-28-codex-terminal-review.md). Live at /terminal on sixlines.day and 8bitoracle.ai since 2026-09-29 (sixlines-site d1cc750, 8bitoracle-brand 5f2371f).

## What it is

A live version of the readout from the Wang Bi lesson. The viewer builds a hexagram by
tapping its six lines (yang ↔ yin), and the terminal reads it the way the lesson does:
each line's place, the two centres, which pairs answer, and the master line Wang Bi names.
It runs in a browser at /terminal on sixlines.day and on 8bitoracle.ai. Screen recordings of it become shorts.

The user asked for it on 2026-09-28 ("plan out the spec for the godot terminal") after the
Wang Bi lesson went out. It is the lesson turned into something a viewer can try.

## Who it is for, and what success looks like

- Someone who watched the Wang Bi lesson and wants to try the reading on other hexagrams.
- Success: a newcomer can tap lines, and in under a minute, see why a line is correct or not,
  which lines answer, and which line rules, without reading a manual.
- Success for us: we can record a 20 to 40 s clip of a reading for a short, with no
  editing beyond trimming.

## What it shows

The look is the lesson's readout (`src/scenes/Readout.tsx`, the MU/TH/UR terminal):

- Green phosphor (#7dff8a) on black, scanlines, a framed message area, PixelOperator.
- The frame stays green. Amber is only for the line to look at. Cyan is only for the prompt.
- The hexagram is a wireframe plot, lines laid out as `blender/layout.py` does (a line
  6.2 wide, 0.5 tall, a wider gap between the trigrams). It turns slowly, once, when the
  hexagram changes. There is no shake or other motion.

Screen, top to bottom:

1. The hexagram: number, Chinese, pinyin and English name (`7  師 SHĪ  THE ARMY`).
2. The plot, with each line tappable. Taps are hit-tested against the lines as drawn,
   including while the plot turns.
3. A line log, one row per line, top line first:
   `L1  YIN   NO FIXED PLACE`; `L2  YANG  NOT CORRECT  CENTRE  ANSWERS L5`.
4. The two trigrams, named with what they do (Shuo Gua ch. 7, as `DOES` in Readout.tsx):
   `LOWER  坎 WATER, SINKING`.
5. WANG BI: each master line and his words, Chinese with the English beside it
   (`L2  為師之主  Master of the army`). Master lines turn amber.
6. The prompt, in cyan: `TAP A LINE TO CHANGE IT`. Beside it, in dim green, `SOUND OFF`/`SOUND ON`.
   Above it, in dim green, a key legend: `1-6  FLIP A LINE  S  SOUND ON/OFF` and
   `G, NUMBER, ENTER  GO TO A HEXAGRAM`. It is hidden on touchscreens and in recordings
   (added 2026-09-29 at the user's request).

Labels wrap at a fixed width; the longest title and a hexagram with two masters are
checked in a still before anything else is built.

## The rules it applies

The terminal shows the lesson's selected structural reading, drawn from Wang Bi's outline
(略例). It is not all of his method. The lesson states these rules already, and
`series/explainers/wangbi-lesson.json` records the sources.

- Place (辯位): lines 2 and 4 are yin places; 3 and 5 are yang places. A line is CORRECT
  when its kind matches its place. Lines 1 and 6 have no fixed yin or yang place; the log
  says `NO FIXED PLACE` and marks them neither correct nor incorrect.
- Centre: lines 2 and 5 are the centres of their trigrams.
- Answering (應, discussed in 明卦適變通爻): 1 with 4, 2 with 5, 3 with 6. A pair answers
  when one is yin and the other yang.
- Master line: taken from Wang Bi's own notes, not computed, and checked by hand. The
  terminal reads one table, `series/wangbi-masters.json`: for each of the 64 hexagrams,
  the master line or lines, or none, with his phrase (zh), an English gloss, and where the
  phrase is in his text. The master line and the note it is found in are recorded
  separately: 16's master is line 4, named in the note on line 5.
  - `series/wangbi.json` (scripts/wangbi.mjs) is only the list of candidates. It matches
    phrases with 主 and files each under the note it is in, and some matches are not
    masters: on 16 line 3, 承動豫之主 is "supports the master" (the master is line 4); on
    36 line 1 the note speaks of line 6; on 36 line 3, 去闇主 is "removing the dark ruler";
    on 42 line 2, 生物之主 is the Supreme Deity; on 46 line 6 he warns against being master.
    It misses 10's master, named in the note on the Judgment (三為履主, "line three is
    master of Treading"). 13's 二為同人之主 is in its Judgment field but was never
    promoted to a line master.
  - The nine masters already checked for the shorts' readouts (`series/copy.json`, lesson
    readouts of 13, 14, 16, 20, 25, 26, 33, 59, 60) seed the table as they are.
  - Every other hexagram is read by hand in chinese-classics-reference, and each entry
    records the verdict: a line, several lines, or none.
  - Where the table says none: `WANG BI NAMES NO MASTER HERE`, and no line turns amber.
    Nothing else is offered in his place.

The lesson's working order (a lone line first, then the centres) is ours, not Wang Bi's.
The terminal never credits it to him (the rule in `wangbi-lesson.json`, "order").

## Copy rules

The same as the shorts:

- None of the banned words: oracle, divination, fortune, prediction, mystical, magical.
- No promised outcomes.
- English beside any Chinese.

The terminal reads structure. It does not answer questions about the viewer's life.

## How it is built

- Godot 4.7.2. It is installed at `/Applications/Godot.app` and runs headless. The export
  templates are not installed; they are needed for a web export (step 1 below).
- Project: `godot/wangbi-terminal/` in this repo (scenes, GDScript, a `data/` folder).
- Fonts: PixelOperator for Latin, with Noto Sans TC as the fallback, subset to every
  non-ASCII character shown: Han, full-width punctuation such as `，`, and pinyin tone
  marks. The subset build fails if Noto lacks a character.
- Data: a build script, `scripts/terminal-data.mjs`, writes `godot/wangbi-terminal/data/hexagrams.json`
  from `series/hexagrams.json` (numbers, names, lines, trigrams) and
  `series/wangbi-masters.json` (the hand-checked masters). The terminal reads only that file.
  A test checks that its 64 entries agree with the sources, and the build refuses a banned
  word or a master without English.
- Rules: one GDScript file, `reading.gd`, with pure functions (`place`, `is_centre`,
  `answers`, `master_lines` and the text rows). A GDScript test runs headless
  (`Godot --headless -s tests/run.gd`) and checks them against the lesson's own examples:
  7 (L2 answers L5, master L2), 22 (master L5) and 10 (master L3, from the Judgment note).
- Look: a 2D scene. The plot is drawn with `draw_line`, projected as `boxEdges` does in
  Readout.tsx. Scanlines are one full-screen shader. The glow is WorldEnvironment glow,
  or a blur shader if glow is too heavy on the web.
- Input: a tap or click on a line flips it. Every decorative node ignores the mouse, and
  taps are read in `_input`, so nothing swallows them. The keys 1 to 6 flip lines; G, then
  digits (including the keypad), then Enter jumps to a hexagram by number (Esc cancels);
  S turns all sound off and on (the Master bus).
- Web export: single-threaded, so the site needs no cross-origin isolation headers. A
  custom HTML shell shows only a START button; the engine, wasm and data download after
  it is pressed, and that click also unlocks audio. The download size is measured on the
  first export and printed under the button.
- Hosting: one export, served at `/terminal` on both sites. Both are other repos, and each
  deploy needs the user's approval.
  - `/terminal` redirects to `/terminal/index.html`, so the export's relative paths
    resolve; a rewrite would fetch them from the site root. Both sites' locale middleware
    must skip `terminal`.
  - sixlines.day: `sixlines-site` (Next.js on Vercel), files under `public/terminal/`.
  - 8bitoracle.ai: `8bitoracle-brand` (Next.js 16), files under `public/terminal/`. This is
    the public site; `8bitoracle-next` is the app at app.8bitoracle.ai and could link to it.
    If the brand site routes pages by locale, the route must be kept out of the locale
    middleware (checked in the plan).
- Sound: the Wang Bi lesson's machine sounds, made by the same ffmpeg recipes as
  `scripts/explainer.mjs` (`makeSfx` and the teletype tick). They are generated, so there is
  no licence to track, and like all media they stay out of git: a script writes them into
  the Godot project's gitignored `sfx/` folder before a build.
  - tick: one click per typed character. It is one click of the lesson's teletype train
    (a new short recipe), so the terminal does not restart a 20 s sound per character.
  - relay: a click when a line flips.
  - sweep: once, as the terminal starts.
  - warble: once, when the master line turns amber.
  - winddown: when the answer stops typing.
  - bed: the quiet background, looped, on by default (SOUND/S turns all sound off and back
    on again, muting the Master bus rather than just this loop; at the user's request on
    2026-09-29).
  The recipes move into one shared module (`scripts/sfx.mjs`) that both the explainer and the
  terminal use, so the lesson and the terminal always sound the same.
- Recording for shorts: a `--record` flag plays a scripted sequence (build 7 line by line,
  flip L2, flip it back, each held 3 s after its reading has finished typing) at 60 fps
  with Godot's movie maker (`--write-movie`); the clip's length is measured. This gives
  frame-exact clips without screen capture. The clips feed the shorts pipeline like the
  Blender clips do.

## Steps

1. Install the 4.7.2 export templates. Make an empty project, and check that a web export
   loads in a browser locally.
2. Check every hexagram's master by hand into `series/wangbi-masters.json`, then write
   `terminal-data.mjs` and its test.
3. Write `reading.gd` and its headless test.
4. Build the screen: plot, log, trigrams, WANG BI line, prompt. Review one still with the
   user before going further.
5. Add input and the one slow turn. Review a recording.
6. Move the sound recipes to `scripts/sfx.mjs`, add the sounds, and add the `--record` mode and one 30 s clip for a short.
7. Make the web export and try it on a phone. After approval, add it to sixlines-site and
   8bitoracle-brand, one deploy each.

## Decisions (the user, 2026-09-28)

1. Godot, not a plain web page.
2. Where Wang Bi names no master: `WANG BI NAMES NO MASTER HERE`, nothing more.
3. A `/terminal` route on sixlines.day and on 8bitoracle.ai.
4. Sound from our own library: the lesson's machine sounds.

## Other ways considered

- A plain web page (TypeScript and canvas): about 100 KB instead of about 10 MB, and could
  share code with Readout.tsx, but no 3D, no native builds, and no frame-exact recording.
  Not chosen.
- A Remotion-only version: not interactive. Not chosen.
