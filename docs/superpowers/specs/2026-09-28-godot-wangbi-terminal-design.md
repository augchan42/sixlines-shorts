# Wang Bi terminal in Godot: design

Status: 2026-09-28. The user answered the open questions (see Decisions); nothing is built yet.

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

1. The plot, with each line tappable.
2. A line log, one row per line from the bottom:
   `L1  YANG  --  (no place)`; `L2  YIN  CORRECT  CENTRE  ANSWERS L5`.
3. The two trigrams, named with what they do (Shuo Gua ch. 7, as `DOES` in Readout.tsx):
   `LOWER: WATER, SINKING`.
4. The hexagram: number, name, Chinese with English beside it (`7 師 THE ARMY`).
5. WANG BI: the master line and his words, Chinese with the English beside it
   (`L2 為師之主 MASTER OF THE ARMY`). The master line turns amber.
6. The prompt, in cyan: `TAP A LINE TO CHANGE IT`.

## The rules it applies

These come from Wang Bi's outline (略例, the 辯位 and 明彖 chapters). The lesson states them
already, and `series/explainers/wangbi-lesson.json` records the sources.

- Place: lines 2 and 4 are yin places; 3 and 5 are yang places. A line is CORRECT when
  its kind matches its place. Lines 1 and 6 have no yin or yang place (辯位); the log
  says so and marks them neither correct nor incorrect.
- Centre: lines 2 and 5 are the centres of their trigrams.
- Answering (應): 1 with 4, 2 with 5, 3 with 6. A pair answers when one is yin and the
  other yang.
- Master line: taken from Wang Bi's own notes, not computed. `series/wangbi.json` holds
  what he names for each hexagram (scripts/wangbi.mjs extracts it from wangBiZhu.ts).
  - Named in his line notes (26 hexagrams, 3 of them with more than one): show each,
    amber, with his words.
  - Named only in his note on the Judgment (4 hexagrams): the extractor finds the phrase
    but not the line number (for 10 it caught 言乎一卦之所以為主也, "tells what the
    hexagram takes as master", where 三為履主, "line three is master of Treading", is the
    answer). These four are read by hand, checked against chinese-classics-reference,
    and kept in `series/wangbi-masters.json` with the source phrase for each.
  - Named nowhere (34 hexagrams): the WANG BI line reads `WANG BI NAMES NO MASTER HERE`,
    and no line turns amber. Nothing else is offered in his place.

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
- Project: `godot/wangbi-terminal/` in this repo (scenes, GDScript, the font, a
  `data/` folder).
- Data: a build script, `scripts/terminal-data.mjs`, writes `godot/wangbi-terminal/data/hexagrams.json`
  from `series/hexagrams.json` (numbers, names, lines, trigrams), `series/wangbi.json`
  (masters from the line notes, zh and en) and `series/wangbi-masters.json` (the four from
  the Judgment notes). The terminal reads only that file. A test checks that its 64
  entries agree with the sources.
- Rules: one GDScript file, `reading.gd`, with pure functions: `place(line, i)`,
  `centre(i)`, `answers(lines)`, `masters(number)`. A GDScript test runs headless
  (`Godot --headless -s tests/run.gd`) and checks them against the lesson's own examples:
  7 (L2 answers L5, master L2), 22 (master L5) and 10 (master L3, from the Judgment note).
- Look: a 2D scene. The plot is drawn with `draw_line`, projected as `boxEdges` does in
  Readout.tsx. Scanlines are one full-screen shader. The glow is WorldEnvironment glow,
  or a blur shader if glow is too heavy on the web.
- Input: a tap or click on a line flips it. The keys 1 to 6 flip lines, and 0 to 9 with
  Enter jump to a hexagram by number.
- Web export: single-threaded, so the site needs no cross-origin isolation headers. Godot
  4's web build is roughly 8 to 10 MB compressed; the page loads it only when the viewer
  presses START.
- Hosting: one export, served at `/terminal` on both sites. Both are other repos, and each
  deploy needs the user's approval.
  - sixlines.day: `sixlines-site` (Next.js on Vercel), files under `public/terminal/`.
  - 8bitoracle.ai: `8bitoracle-brand` (Next.js 16), files under `public/terminal/`. This is
    the public site; `8bitoracle-next` is the app at app.8bitoracle.ai and could link to it.
    If the brand site routes pages by locale, the route must be kept out of the locale
    middleware (checked in the plan).
- Sound: the Wang Bi lesson's machine sounds, made by the same ffmpeg recipes as
  `scripts/explainer.mjs` (`makeSfx` and the teletype tick). They are generated, so there is
  no licence to track, and like all media they stay out of git: a script writes them into
  the Godot project's gitignored `sfx/` folder before a build.
  - teletype: one tick per typed character, as in the lesson.
  - relay: a click when a line flips.
  - sweep: once, as the terminal starts.
  - warble: once, when the master line turns amber.
  - winddown: when the answer stops typing.
  - bed: the quiet background, looped, off by default on the web (a SOUND key turns it on).
  The recipes move into one shared module (`scripts/sfx.mjs`) that both the explainer and the
  terminal use, so the lesson and the terminal always sound the same.
- Recording for shorts: a `--record` flag plays a scripted sequence (build 7 line by line,
  pause, flip L2, pause) at 60 fps with Godot's movie maker (`--write-movie`). This gives
  frame-exact clips without screen capture. The clips feed the shorts pipeline like the
  Blender clips do.

## Steps

1. Install the 4.7.2 export templates. Make an empty project, and check that a web export
   loads in a browser locally.
2. Read the four Judgment-note masters by hand into `series/wangbi-masters.json`, then
   write `terminal-data.mjs` and its test.
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
