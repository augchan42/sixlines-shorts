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

## Build

- Source in `web/terminal/` in this repo: plain ES modules, no framework. A build script
  (`npm run terminal:plain`) writes `web/terminal/build/` (gitignored) with the page, JS,
  fonts, data and sounds, and prints the total size and the size compressed.
- Tests: node tests for the rules port and the build output (files present, no banned words,
  total size under 0.6 MB).
- Hosting: copied to sixlines-site `public/terminal/`, replacing the Godot files there. The
  existing `/terminal` → `/terminal/index.html` redirect and the middleware exclusion stay.
