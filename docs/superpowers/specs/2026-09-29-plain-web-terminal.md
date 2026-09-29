# Wang Bi terminal as a plain web page: design

Status: 2026-09-29. Asked for by the user to compare against the Godot build: "deploy one
using godot, and the other using plain webpage so i can compare properly".

## What and why

The same terminal as `godot/wangbi-terminal/` (spec: 2026-09-28-godot-wangbi-terminal-design.md),
rebuilt as a static page with no engine: about 0.2 MB before the first frame instead of 9.9 MB.

- 8bitoracle.ai/terminal serves the Godot build.
- sixlines.day/terminal serves the plain page.

The user compares the two in use. Neither replaces the other until the user decides.

## Must match the Godot build

Everything a viewer sees, hears and can do matches the Godot build as of commit d099e16:

- Layout at 1080x1920 design pixels, scaled to fit the window (letterboxed, like Godot's `keep`).
  Same positions, sizes and colours as main.gd: title, plot, log, trigrams, WANG BI, legend,
  prompt, SOUND. Same frame, scanlines and glow (canvas shadowBlur or CSS).
- Same data: `godot/wangbi-terminal/data/hexagrams.json`, read as is.
- Same rules: a port of reading.gd with the same outputs, tested in node against the same
  cases as tests/run.gd.
- Same plot: the wireframe boxes projected the way plot.gd does, the one slow turn to the
  target when the hexagram changes, amber for master lines.
- Same typing (25 characters a second, a tick per character), sounds and mix
  (the MIX volumes in main.gd), sweep at start, warble on a newly amber line, winddown when
  typing ends, relay on a flip and a pad tap, the bed looped and on by default. SOUND/S mutes
  everything.
- Same input: tap a line (on release, under 12 px of movement), keys 1-6, G + number + Enter,
  Esc, S, tap the name for the number pad (DEL, 0, GO), drag to turn (±80°, a little tilt,
  1.2 s ease back square), the same legends for keyboard and touch devices.
- Same fonts: PixelOperator Bold and the Noto Sans TC subset, as woff2.
- Same copy rules: no banned words; English beside any Chinese.

## Differences allowed

- No START gate for the picture: it draws at once. Sound starts on the first tap or key
  (browsers need a gesture); until then the SOUND label still says SOUND ON.
- Sounds ship as .ogg plus .m4a (Safari), made by the same scripts/sfx.mjs recipes.
- No recording mode. Shorts keep coming from the Godot recorder.
- Keys to turn the plot, on this page only (asked for by the user on 2026-09-29): A/D or
  left/right turn it about the vertical axis, W/S or up/down tilt it. While a key is held it
  turns smoothly, about 60° a second, within the drag's clamps (±80° of turn from where the
  keys were first held, ±25° of tilt); when every turn key is released it eases back square in
  1.2 s, as after a drag. While G entry or the number pad is open these keys do nothing (digits
  only). Because S now tilts, sound moves to M (a tap on SOUND still works). The keyboard
  legend reads:
  `1-6  FLIP A LINE      M  SOUND ON/OFF` /
  `G, NUMBER, ENTER  GO TO     WASD OR DRAG  TURN IT`.
  The Godot build keeps S for sound and has no turn keys.

## Build

**As of 2026-09-29, the page itself lives in `sixlines-site`, not here.** The source (plain ES
modules, no framework: `index.html`, `main.js`, `plot.js`, `reading.js`, `turning.js`) is at
`terminal/` in that repo's root; its build script (`pnpm terminal:build`, `scripts/
terminal-build.mjs`, esbuild) writes `public/terminal/` there directly — sixlines-site owns and
serves that page, so it owns building it. The rules-port and build-output tests moved with it,
to `scripts/terminal-*.test.ts` there. See sixlines-site's ADR-047 for why.

This repo (`sixlines-shorts`) still generates the three asset kinds the page needs, since they
depend on data and tools that belong here:

- `npm run terminal:assets [out-dir]` (`scripts/terminal-assets.mjs`) writes
  `data/hexagrams.json` (the Godot build's, as is), both fonts as woff2 (Pixel Operator; the
  Noto Sans TC subset to the characters shown) and the sounds as `.ogg` and `.m4a`
  (`scripts/sfx.mjs`) into a directory — by default `~/projects/sixlines-site/terminal/assets`,
  sixlines-site's committed copy of these inputs (see that directory's README there).
- Test: `tests/terminal-assets.test.mjs` (files present, the data matches the Godot build's, no
  banned words).
- After a data or sound change: run `npm run terminal:assets` here, then `pnpm terminal:build`
  in sixlines-site, and check `git diff --stat public/terminal` there.

Hosting: sixlines-site's `public/terminal/`, replacing the Godot files that were there before.
The existing `/terminal` → `/terminal/index.html` redirect and the middleware exclusion stay.
