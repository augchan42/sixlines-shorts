# Report: number pad and drag-to-turn for the Godot Wang Bi terminal

Spec: docs/superpowers/specs/2026-09-28-godot-wangbi-terminal-design.md (revised in this
change). Branch series-64. Repo: godot/wangbi-terminal/.

## What changed

Feature 1 — go to a hexagram without a keyboard:

- A tap or click on the title (hit area grown ~20 px, same pattern as the existing SOUND
  hit area) opens a number pad, reusing G entry's own state (`entry`, `entering`) and its
  `GO TO: 3_` prompt text.
- The pad is a 3x4 grid (1-9, DEL, 0, GO), built once in `build_pad()` (main.gd) from
  `ReferenceRect` outlines (same style as the frame) plus `Label`s made with the existing
  `label()` helper, on an opaque black `ColorRect` panel sized and centred over the log
  area (y 970-1590, inside the spec's 960-1600 band). Cells are 200x120 with a 20 px gap
  and a 40 px margin, matching the spec.
- While open, any tap that isn't a pad cell (a line, the title again, elsewhere) cancels
  the pad, same as Esc — implemented as one rule (`handle_pad_tap`'s "not a valid cell"
  branch), which also satisfies "line taps don't flip lines while the pad is open" for
  free, since such a tap never reaches the line-hit-test code while the pad is open.
- G by keyboard still works and does not open the pad; typing digits by keyboard works
  while the pad is open (both paths already shared the same `entry`/`entering` state, so
  no separate logic was needed there).
- Each pad tap plays the relay sound (`play("relay")` in `handle_pad_tap`).

Feature 2 — drag to turn the hexagram:

- `plot.gd` gained a second angle, `tilt`, and `project()` now applies it after `turn`
  (rotating about the horizontal axis in the same way `turn` already rotates about the
  vertical one). At tilt=0 this is exactly the old projection (checked in tests/run.gd).
- main.gd's mouse handling moved the line-flip from press to release, and press now starts
  a drag/tap decision: a move of 12 px or more (`DRAG_TAP_THRESHOLD`) makes it a drag, which
  kills any running turn tween and drives `plot.turn`/`plot.tilt` directly (0.4 deg/px,
  clamped to ±80°/±25°). A move under the threshold is read as a tap on release, hit-tested
  the same way as before (`plot.line_at`).
- On release after a drag, a new tween eases `turn` back to `Reading.nearest_square(turn)`
  (added to reading.gd — the nearest whole turn, forward or back, unlike the existing
  `turn_target`, which always advances for the relay animation) and `tilt` back to 0, both
  over 1.2 s with `TRANS_SINE`/`EASE_OUT` (no overshoot, per the look rules).
- Touch: `project.godot` already leaves `emulate_mouse_from_touch` at its default (on), so
  the web export gets mouse events from touch already; no `InputEventScreenTouch`/
  `InputEventScreenDrag` handling was added, per the spec's fallback clause.

Legend: replaced the single `LEGEND` constant with `LEGEND_KEYBOARD` and `LEGEND_TOUCH`.
Keyboard: `1-6  FLIP A LINE      S  SOUND ON/OFF` / `G, NUMBER, ENTER  GO TO     DRAG  TURN
IT`. Touch: `TAP THE NAME  GO TO A HEXAGRAM` / `DRAG  TURN IT`. The legend is now shown on
touchscreens too (previously hidden there) — hidden only in `--record`.

Spec updated: the screen list (title tap, plot drag, the pad's own screen bullet, both
legends) and the Input bullet (drag-to-turn, and the pad, as sub-bullets).

## Tests

- `tests/run.gd` (pure logic, `npm run test:godot`): added checks for
  `Reading.nearest_square` (rounds back, forward, and a half-turn) and for `Plot.project`
  with `tilt` (tilt=0 is a no-op; a 90° tilt swings a purely vertical point level without
  moving it off the vertical axis). All 30 checks pass, 0 failed.
- `tests/input_check.gd` (windowed, `npm run test:godot-input`): added checks for the pad
  (opens on a title tap, cancels on an outside tap/line tap/Esc, types digits, DEL, GO to
  36, GO with nothing entered exits quietly, keyboard typing works while open, G doesn't
  open it) and for dragging (a 50 px move is a drag and turns the plot without flipping the
  line under the press, settles back to `nearest_square` and tilt 0 after release, a move
  under 12 px is still a tap that flips on release, and dragging kills a running relay
  tween). All 46 checks pass, 0 failed.
- Hit a `SCRIPT ERROR` on the first run (`Cannot infer the type of "offset" variable`) from
  an untyped `event.position` inside the new `InputEventMouseMotion` branch — exactly the
  "script error makes it hang" case the task warned about; fixed by typing the local and
  casting `event` explicitly, then reran clean.
- `npm test`: 147/147 Node tests pass, plus the two Python suites (8 and 12 tests) already
  in the repo.
- `npm run terminal:web`: exported cleanly to `build/web/`.
- Playwright against `build/web` served on `python3 -m http.server 8731` (stopped after):
  START, tap the title (opens the pad, `GO TO: _`), tap 3, tap 6 (`GO TO: 36_`,
  `.playwright-mcp/pad-open.png`), tap GO (goes to 36), then a mouse press-drag on the plot
  turns it (`.playwright-mcp/turned.png`) and it settles back square and unchanged (36
  again) after release. No console errors or warnings at any point. Resized to 390x844
  (phone-size) and reopened the pad: cells render at about 72x43 CSS px — see Concerns.

## Decisions

- Any tap outside the pad cancels it, rather than being a no-op within the panel's gaps —
  simpler (one rule covers "line taps do nothing" and "tap outside cancels" and "tap on the
  title again cancels"), and matches the spec's own list of what cancels.
- The settle-back target is `Reading.nearest_square(turn)` (nearest whole turn, either way)
  rather than the turn value the drag started from — "turns back square" reads as an
  orientation, not a return to the pre-drag state, which matters if a drag interrupts the
  relay's own mid-flight 6 s turn.
- Added `tilt` to `plot.gd`'s projection rather than skipping the vertical-drag half of
  Feature 2 — the change was a small, symmetric addition to `project()`, so "if it's easy"
  was satisfied.

## Concerns

- At a 390 px-wide viewport (roughly an iPhone's CSS width), pad cells render about
  72x43 CSS px — close to, but under, Apple's 44pt minimum tap target on the short side.
  The cell size (200x120 game px) was set by the spec; shrinking further wasn't asked for,
  but worth knowing if a real-phone check finds it tight.
- The web export and Playwright check ran on `build/web` from this change only; the actual
  site deploys (sixlines-site, 8bitoracle-brand) were not touched, per the task's
  instruction not to touch the site repos.
