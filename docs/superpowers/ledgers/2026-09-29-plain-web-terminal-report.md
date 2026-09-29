# Plain web terminal: report

2026-09-29. Spec: `docs/superpowers/specs/2026-09-29-plain-web-terminal.md`. Reference: the Godot
build `godot/wangbi-terminal/` at d099e16.

## What was built

- `web/terminal/reading.js`: a port of reading.gd.
- `web/terminal/plot.js`: a port of plot.gd (projection with turn and tilt, the 12 edges per slab,
  amber masters, hit test on each slab's convex hull plus 18 px).
- `web/terminal/turning.js`: drag angles, and the new held-key turning (see below).
- `web/terminal/main.js`: the page. A 2D canvas at the 1080x1920 design size, letterboxed like
  Godot's `keep`, at devicePixelRatio. Same frame, labels, positions, sizes, colours, pad, scanlines
  (640 bands, 18% black, over the design area), typing (25 characters a second, one tick per frame
  that advances, winddown at the end), the 6 s sine turn on a change, the 1.2 s ease back square
  after a drag, MIX volumes, and every input in main.gd (tap on release under 12 px, 1-6,
  G + digits (number row or keypad) + Enter, Esc, tap the name for the pad with DEL/0/GO, a tap
  outside the pad cancels it, drag ±80° with ±25° tilt, SOUND tap).
- `web/terminal/index.html`: the page shell. `touch-action: none` on the canvas; fonts and data preloaded.
- `scripts/terminal-plain.mjs` (`npm run terminal:plain`): esbuild bundles and minifies main.js and
  copies the page and `data/hexagrams.json` as they are. PixelOperator Bold becomes woff2. The Noto
  Sans TC subset is cut to `displayText`, set to its default instance (wght 100, which is what Godot
  draws, since it sets no variation) and saved as woff2. Each sound is made from the sfx.mjs recipes
  as .ogg (Godot's own encoding) and .m4a (AAC 48 kb/s). The script prints every file's size and the
  raw and gzip totals. `web/terminal/build/` is gitignored.
- `scripts/sfx.mjs`: `makeSfx` takes optional encoder options. `scripts/terminal-data.mjs`: the Noto
  download is now `notoSource()`, shared by both builds.
- `godot/wangbi-terminal/tests/metrics.gd`: prints the Godot labels' positions, wrapped heights and
  character counts. The web layout rules come from its output and from screenshots.

Sound: the AudioContext is created and resumed on the first pointerdown, pointerup or keydown
(pointerup is what counts as a user gesture for touch on iOS). The sound bytes are fetched after the
first frame and decoded once the context exists. The bed then loops under the master gain, and the
sweep plays once as the start. The format is picked by `canPlayType` (ogg, else m4a). Voices match
Godot: a sound that plays again restarts, and the tick has at most two voices. SOUND and M set the
master gain to 0 or 1.

### Change asked for mid-task: keys to turn the plot (this page only)

A/D and left/right turn the plot; W/S and up/down tilt it. A held key turns it 60° a second,
limited to ±80° of turn from where the keys were first held and ±25° of tilt. When all turn keys
are up, it eases back square in 1.2 s. The keys do nothing during G entry or the pad. Sound moved
from S to M. The keyboard legend is now "1-6  FLIP A LINE      M  SOUND ON/OFF" /
"G, NUMBER, ENTER  GO TO     WASD OR DRAG  TURN IT". The spec is updated. The Godot build is
unchanged.

## Sizes

| | raw | gzip |
|---|---|---|
| whole build | 542,943 B (530 KB) | 496,517 B (485 KB) |
| before the first frame (page, JS, fonts, data) | 59,649 B (58 KB) | 31,184 B (30 KB) |

Most of the total is the 30 s bed, which ships twice: 217 KB as .ogg and 183 KB as .m4a. A browser
downloads only one of the two sets of sounds.

## Tests

- `tests/terminal-plain-reading.test.mjs` (9): every case in tests/run.gd, plus a line hit test.
- `tests/terminal-plain-turning.test.mjs` (6): which keys turn, the rate, the direction, opposite
  keys cancelling, the clamps, and the drag angles.
- `tests/terminal-plain-build.test.mjs` (6): builds into a temp folder. Every file is present, the
  page references what was built, the data matches Godot's byte for byte, no banned words in any
  text file, total under 0.6 MB, and the build folder is ignored and has its npm script.
- `npm test`: 168 node tests pass, and the Python suites pass.

In the browser (Playwright, Chromium, served with `python3 -m http.server`), with no console errors:

- G 3 6 Enter goes to 36.
- The pad types digits.
- A drag turns the plot and settles to exactly 2π.
- M mutes.
- D turns the plot 30° in 0.5 s and settles back to 0.
- Turn keys and M do nothing in G entry.
- Key 3 flips L3.
- In a touch context (hasTouch, 3x DPR), a tap flips L1, the touch legend shows, and audio decodes.

Screenshots of the plain page are in `.playwright-mcp/plain-7.png`, `plain-36.png`, `plain-pad.png`
and `plain-drag.png` (1080x1920). Matching `godot-*.png` files and `*-390.png` pairs at 390x844
sit beside them.

## Compared with Godot

Side by side at 1080x1920 and 390x844, the frame, plot, pad, text positions, wrapping (36's WANG BI
row) and colours match to within a pixel or two. The layout rules found:

- Every line is ceil(1.16·size) + ceil(0.288·size) tall (Noto's metrics, even for ASCII), with
  3 px between lines.
- A line drawn only in PixelOperator is centred in that height on Pixel's own metrics. It sits
  5 px higher than a line with Chinese in it.
- Glyphs advance by their exact widths and land on whole pixels.
- The `outline_size` 6 outline reaches only about 1.5 px past each glyph, so the canvas stroke is
  3 px wide.

Known differences:

- The keyboard legend and the turn keys (WASD, arrows, M for sound), as asked for.
- No START gate. The picture draws at once, and sound starts on the first tap or key. The sweep
  plays then, not at load. The first hexagram's warble does not play, because there is no audio
  before a gesture. Typing (and its ticks and winddown) starts at load, so if the first gesture
  comes after about 10 s, the viewer hears no typing sounds for the first reading.
- The tap area around a line is rounded at the corners. Godot's `offset_polygon` squares them off.
  The difference is under a few pixels at the ends of a line.
- A line is drawn as a 2 px canvas stroke. At phone scale, Godot's frame and plot lines look a
  touch thinner.
- Frame time is capped at 0.1 s, so typing and turns pause rather than jump after a tab switch.
- Like Godot: if a line is flipped during the ease back after a drag, the tilt is left where it was.
  This copies the Godot behaviour and is not fixed.
- No recording mode.

## Concerns

- Safari was not tested (only Chromium). The m4a path and audio unlock on iOS still need a check on
  a real phone.
- The 0.6 MB limit has about 57 KB to spare. A longer bed or a higher bitrate would break it.
