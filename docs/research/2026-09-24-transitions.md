# Transition library for the I-Ching shorts

Research pass on transition ideas for the 30 s vertical shorts (Remotion 4.0.527, 1080×1920,
30 fps, synthwave/Matrix/CRT look, cut to a synthwave beat). Covers what's trending in short-form
editing, what suits the retrowave look, beat-sync practice, what Remotion's transition tooling
offers, and what our own Blender hexagram pipeline can do beyond the current build-up shot.

Current toolbox, for reference:
- `src/fx/Camera.tsx` — `Cut` kinds `zoom`, `whip-left`, `whip-right`, `whip-up` (motion-blurred
  camera moves timed to a beat), plus continuous punch/sway and shake bursts.
- `src/fx/Glitch.tsx` — `RGBSplit` (RGB channel offset), `Slices` (banded horizontal glitch),
  `Grain` (film grain + scanlines + vignette), text fringe/glow helpers.
- `blender/hexagram.py` + `blender/layout.py` + `scripts/blender.mjs` — renders the 3D hexagram
  build: six slabs (obsidian body, thin glowing green edge, colour and rain path configurable)
  land bottom-to-top on half-beats over a looping glyph-rain plane, camera cranes up and pushes
  in. Frame count comes from `frame_count(beats, bpm)`, so any beat length can be requested.
  Output today is H.264 MPEG4, no alpha (`scene.render.film_transparent` is not set, background
  is a black world at strength 0, not transparent).

## 1. General transitions (CapCut / Reels / Shorts, retrowave-suited, Remotion-buildable)

| # | Name | Looks like | Fits where | How to build in Remotion | Effort |
|---|------|------------|------------|--------------------------|--------|
| 1 | Whip pan (left/right) | Camera smears sideways, next shot lands mid-blur | Between any two shots on a strong beat | Have it: `Camera` `whip-left`/`whip-right` | done |
| 2 | Whip pan up | Camera smears vertically | Hook → hexagram (build reads bottom-up) | Have it: `Camera` `whip-up` | done |
| 3 | Zoom punch-in | Push into outgoing shot, land zoomed on incoming | Any beat-synced cut, esp. into a close-up | Have it: `Camera` `zoom` | done |
| 4 | RGB split / chromatic glitch cut | Channels separate and snap back on the cut | Drop, any glitch beat | Have it: `RGBSplit` | done |
| 5 | Slice/glitch tear | Frame shatters into shifted horizontal bands | Drop, hook-to-hexagram | Have it: `Slices` | done |
| 6 | Hard flash cut | One white/neon frame flashed on the cut, like a photo strobe | On the beat drop, or hook → hexagram | `pushCut()` from `@remotion/transitions`, or a 1–2 frame `AbsoluteFill` flash layered by `<Sequence>` | S |
| 7 | Match cut / smart cut | Two shots line up by shape or motion (e.g. rising line matches rising screenshot edge) | Between meaning lines, hexagram → screenshots | No package; pick matching in/out poses per shot and cut with `<Series>`, no crossfade | M |
| 8 | Speed ramp | Shot slows then snaps to full speed on the beat | Into the drop | `interpolate()` driving a `Sequence`'s effective playback rate, or CSS `filter` blur tied to velocity | M |
| 9 | Jump cut with zoom (TikTok "zoom-in reveal") | 2–3 rapid zoom jump-cuts on consecutive beats | Hook, before the drop | Chain `zoom` cuts on consecutive beats via `cuts` array | S |
| 10 | Light leak / flare wipe | A warm/neon light sweep washes the frame, revealing the next shot underneath | Between meaning lines, into end card | `TransitionSeries.Overlay` with a screen-blended gradient PNG/CSS sweep | S–M |
| 11 | Directional wipe (hard edge) | A hard line sweeps across, revealing next shot | Between app screenshots | `wipe()` presentation from `@remotion/transitions` | S |
| 12 | Iris/circle wipe | Circle opens or closes on the cut | Hexagram → meaning section (iris opens from hexagram centre) | `iris()` presentation | S |
| 13 | Clock wipe | Radial sweep like a clock hand | Rarely fits synthwave; skip unless styled with neon edge | `clockWipe()` presentation | S |
| 14 | Slide/push | Incoming shot pushes the outgoing one off-frame | Between app screenshots (feels like swiping a phone) | `slide()` presentation, direction per beat | S |
| 15 | Flip (3D card flip) | Shot flips like a card, back reveals next shot | Between meaning lines (two-sided idea) | `flip()` presentation | S |
| 16 | VHS tracking glitch | Horizontal tear + colour smear + brief static, like a bad tape head | Drop, hook → hexagram | Extend `Slices` with a static/noise flash and stronger `RGBSplit` amount for ~3 frames | S |
| 17 | Scanline roll | A bright horizontal bar rolls down/up the frame, like adjusting vertical hold | Meaning lines, low-key transition | New `AbsoluteFill` with a moving `linear-gradient` band, `mixBlendMode: screen` | S |
| 18 | CRT power-off/on | Frame collapses to a horizontal line then a dot, or the reverse to open | End card in, or hook out | CSS `transform: scaleY()` down to a hairline then `scaleX()` to a dot, timed over ~6 frames | M |
| 19 | Datamosh-style smear | Motion-blur trails that don't resolve, blocky drag | Drop only, used once for impact | Approximate with strong directional blur (`feGaussianBlur` per-axis, already in `Camera`) plus a duplicated, offset, fading previous frame | M |
| 20 | Static/noise burst | A few frames of pure white noise, TV losing signal | Hook → hexagram, or before the question | `feTurbulence` (already used in `Grain`) driven to full opacity for 2–3 frames | S |
| 21 | Neon streak wipe | A bright vertical/diagonal light bar sweeps across, next shot appears behind it | Between app screenshots | CSS gradient bar animated across, `mixBlendMode: screen`, similar to #10/#17 | S |
| 22 | Cube/3D rotate (gl-transitions `cube`) | Frame rotates like the face of a cube, next shot on the adjacent face | Meaning line → meaning line | `@remotion/transitions` custom WebGL presentation (`makeHtmlInCanvasPresentation` or GLSL shader), port `gl-transitions/cube.glsl` | L |
| 23 | Doorway (gl-transitions `doorway`) | Frame splits down the middle and swings open like double doors, revealing depth behind | Hexagram → meaning section | Port `gl-transitions/doorway.glsl` as a custom Remotion transition | L |
| 24 | Directional warp / perlin dissolve (gl-transitions `perlin`, `dreamy`) | Organic noise-driven dissolve, looks like the picture melts into the next | Question → drop | Port `gl-transitions/perlin.glsl` or `dreamyzoom.glsl` | L |
| 25 | Pixel sort glitch | Rows or columns of pixels stretch/sort by brightness for a few frames | Drop | Needs a pixel shader or canvas readback; heaviest of the glitch options | L |
| 26 | Rotate + slide (CapCut "spin transition") | Frame spins briefly while sliding into the next | Hook, generic beat cuts | Compose `rotate()` keyframes with `slide()`-style translate in a custom `Camera` `Cut` kind | M |
| 27 | Text-triggered wipe (word swipes frame off) | Hook word itself becomes the wipe shape/mask | Hook → hexagram, ties copy to transition | `clip-path` mask built from the hook text's bounding box, animated across | M |
| 28 | Crossfade with grain hold | Plain dissolve, grain and scanlines keep it from looking flat/cheap | Meaning line → meaning line, low-drama spots | `fade()` presentation, keep `Grain` mounted through it | S |
| 29 | Beat-strobe cut (no transition, just a hit) | Straight cut, but paired with a beat punch/flash so it still reads as intentional | Any beat where a heavier transition would be too much | `Camera`'s existing `hits` (punch-in decay) on the cut frame, no new code | done |
| 30 | End-card materialize | Type/logo assembles from scattered glyph fragments (echoes the glyph rain) | Into end card | Small custom component: fragments start at random offsets/rotations from `jitter()`, animate to rest | M |

## 2. Blender hexagram transitions (reusing the glowing wireframe/slab look)

The 3D hexagram is the strongest visual asset. These reuse its slab/edge language as
transitions rather than only as the opening build, sharing materials and camera code already in
`blender/hexagram.py`.

| # | Name | Looks like | Fits where | How to build | Effort |
|---|------|------------|------------|---------------|--------|
| B1 | Venetian/slat wipe | Six bars (the hexagram's own line proportions) sweep across frame like blinds opening, revealing the next shot behind each slat | Between any two 2D shots (meaning lines, app screens) | New short Blender scene: 6 slabs at full frame width, positioned in front of camera, animate `location.x` or `scale.y` to swing open like blinds. Reuses `LINE_H`/`LINE_GAP` proportions from `layout.py`. Render with alpha (see below), overlay in Remotion as a `Sequence` on top of the cut. | M |
| B2 | Changing lines (yang splits to yin) | A solid yang slab cracks down the centre and the two halves pull apart into a yin line's gap, echoing the I-Ching concept of a "changing line" | Between meaning lines, or hexagram → question (thematically apt: changing lines is literally the mechanism of hexagram transformation) | Reuse `add_slab`/`slabs()`: animate one full-width slab's two halves splitting apart on X, matching the yin gap math already in `layout.py` (`YIN_GAP`, offset formula). Land it as a hard cut point — next shot revealed in the gap. | M |
| B3 | Camera flies through the hexagram (gate into meaning) | Camera pushes forward through the gap between two lines or through the whole stack, blowing past the glowing edges, into the next scene | Hexagram → meaning section (natural "passing through the gate" beat) | Extend `camera()`: after the existing push-in keyframes, add a fast final dolly move with `dist` going near zero and `data.lens` widening, ending on black/rain to cut to next 2D shot. Optional depth-of-field kick for speed feel. Reuses existing camera/track-to rig. | M |
| B4 | Single line wipe | One glowing yang-style bar sweeps left-to-right (or bottom-to-top) across the full frame, wiping to the next shot | Simple, cheap alternative to B1; fits between meaning lines or into the drop | One `add_slab`-style bar at frame width, height, animate `location.x` from off-frame to off-frame with edge material at `PULSE` strength for a "hot" wipe edge | S |
| B5 | Trigrams separate (upper flies up, lower flies down) | The six lines split at the trigram gap; upper three lines fly up off-frame, lower three fly down, revealing what's behind | Hexagram → four app screenshots (upper/lower trigram framing works well since layout already treats trigrams as a natural split, see `TRIGRAM_GAP`) | Reuse existing hexagram scene: after the build lands, animate all `line{i}` objects' Z beyond ±frame edge, split at index 3 (matches `line_z()`'s trigram gap logic). No new slab code, just added animation on the existing objects before render ends. | S–M |
| B6 | Lines reassemble into end card | Same slab objects fly in from edges and land into a small hexagram-shaped mark or wordmark, echoing the opening build in reverse/remixed | Into end card | New scene reusing `add_slab`/`animate_slab` with an end position matching the end-card logo layout instead of `line_z()`; effectively a second, smaller `hexagram.py` pass. | M |
| B7 | Edge-only flash wipe (no slab motion) | The glowing green edges alone flash/sweep across a static or already-landed hexagram, without moving the geometry — cheapest use of the look as connective tissue rather than a full 3D transition | Any beat cut, reused across all 64 shorts as connective tissue | Animate `Emission Strength` on all edge materials in sequence (reuse `PULSE`/`REST` from `hexagram.py`) rather than repositioning slabs; can be a 2D-only Remotion effect using pre-rendered edge maps too, no new Blender render needed if a still frame is exported | S |

### Alpha export: is it possible?

Yes, with caveats, confirmed against Blender's own render settings:
- Set `scene.render.film_transparent = True` and `scene.render.image_settings.color_mode = "RGBA"`
  (today's `render_settings()` does neither).
- Most reliable path: render a PNG sequence with RGBA, then mux to a movie with alpha via ffmpeg
  outside Blender (e.g. `qtrle` in a QuickTime container, or `prores_ks -profile:v 4` for ProRes
  4444) — this sidesteps Blender's own FFmpeg wrapper limitations.
- Blender's built-in FFmpeg output can do ProRes 4444 with alpha directly, but it's reported as
  8-bit-limited and less consistent across builds than the PNG-then-mux route.
- The rain plane currently emits into a black world with `Strength` 0; if the transparent film
  option is on, the rain plane and slabs still composite fine since they're geometry, not
  background — background alone becomes transparent.
- Practical recommendation: for B1–B7, render PNG sequences with alpha (simplest, most
  Blender-version-portable), convert to ProRes 4444 or a WebM/VP9 with alpha via ffmpeg in
  `scripts/blender.mjs`, and composite the result as a Remotion `<Video>` layer on top of the cut
  with normal alpha blending — no shader tricks needed on the Remotion side.

## 3. Classifying the 8 chosen tracks: what the numbers say

`music/sections.json` assigns one Pixabay track (30 s window, `start` seconds in) to each of the
8 trigrams; `music/analysis.json` gives that track's per-bar `energy[]` and `bass[]` RMS
(`bassIn`/`bassOut` are empty for every track in this dataset, so they're not usable as a signal
here). Averaging `energy[]`/`bass[]` over the bars that fall inside each section's chosen 30 s
window gives:

| trigram | file | bpm | avg energy | avg bass | energy shape (first→last bars in window) |
|---------|------|-----|-----------:|---------:|--------------------------------------------|
| qian ☰ | pick01 retrowave-synthwave-80s-90s | 102.0 | 6.15 | 5.77 | `6,6,7,7,5,6,6,6,5,6,7,7,6` — flat, sustained |
| kun ☷ | pick04 analog-dreams-synthwave | 90.0 | 6.09 | 5.27 | `4,4,4,6,7,7,7,7,7,7,7` — one gentle rise, then a smooth plateau |
| zhen ☳ | pick07 interstellar-retrowave | 100.0 | 4.75 | 3.67 | `3,2,3,2,4,2,7,7,6,7,7,7` — low and quiet, then a hard jump to the drop |
| kan ☵ | pick09 synthwave | 100.0 | 5.00 | 3.50 | `2,2,3,3,4,4,7,7,7,7,7,7` — low and quiet, then a hard jump to the drop |
| gen ☶ | pick05 80s-retro-inspiring-synth-pop | 82.5 | 6.20 | 5.80 | `7,5,5,5,6,7,7,6,7,7` — flat, sustained |
| xun ☴ | pick11 retro-synth-pop | 95.0 | 5.00 | 4.17 | `2,2,4,4,4,3,6,7,7,7,7,7` — low and quiet, then a hard jump to the drop |
| li ☲ | pick10 retrowave | 100.0 | 6.33 | 5.92 | `6,6,6,5,6,5,7,7,7,7,7,7` — flat, sustained |
| dui ☱ | pick06 orbit-retrowaver | 120.0 | 5.87 | 5.73 | `5,5,5,5,6,4,1,8,7,7,7,7,7,7,7` — sustained, then a sharp dip-and-jolt at the drop |

Simple, measurable rule from these numbers (checked in this order):

1. **driving** — `bpm >= 110`. Only dui (120 bpm) qualifies.
2. **calm** — `bpm <= 90`. kun (90) and gen (82.5). This is why kun reads as the gentle,
   harmonic one even though its average energy number is mid-range: the tempo is slow and, after
   one soft rise in the first few bars, it holds a smooth plateau with no jolt.
3. **building** — bpm in between, and the energy in the second half of the window averages at
   least 2.5 points above the first half (`last-third avg − first-third avg >= 2.5`). zhen, kan,
   and xun all show this: quiet for roughly the first two-thirds of the window, then a hard step
   up into the drop.
4. **steady** — bpm in between, no big ramp. qian and li: already at a sustained mid-high energy
   for the whole 30 s, no dip, no jolt.

Result: calm = {kun, gen}, steady = {qian, li}, building = {zhen, kan, xun}, driving = {dui}. Each
of the 64 hexagrams is built from an upper and lower trigram, and its music section comes from
whichever of these 8 tracks the pairing selects (see `scripts/series-table.mjs`/`series-clips.mjs`
for the exact hexagram → trigram-track mapping) — so every short already carries one of these four
classes before any transition is chosen.

### Class → transition family

| class | transition family | why |
|-------|--------------------|-----|
| calm | slow cross-dissolve (`fade()`), light leak (#10), slow Blender line morph — yang→yin (B2) played at half speed, soft iris (`iris()`) | Nothing sudden: kun and gen hold a plateau, so a hard cut or whip reads as louder than the music. |
| steady | single line wipe (B4), directional wipe/slide (#11/#14), plain beat-synced cut with a light punch (`Camera` `hits`) | qian and li sit at a constant, moderate energy — one clean transition per beat unit reads as "in time," nothing needs to escalate or hold. |
| building | starts like calm/steady, escalates into the drop: early bars use slides/dissolves, then whip pans, then glitch (`RGBSplit`/`Slices`) or a slat wipe (B1) land right on the drop bar, capped with a hard flash (#6) or shake | zhen/kan/xun are quiet, then jump; the cut pattern should mirror that shape rather than being flat throughout the section. |
| driving | whip pans (`Camera` `whip-*`), glitch cuts (`RGBSplit`/`Slices`), screen shake, slat wipe (B1) landed on downbeats | dui is both fast (120 bpm) and jolts hard at the drop (1 → 8); it can carry more transitions per second without feeling busier than the music. |

### Cut density and transition length by class

| class | cuts per bar (4/4) | transition length | notes |
|-------|--------------------:|--------------------|-------|
| calm | ~0.5 (one cut every 2 bars) | 1.0–1.5 beats | Long, soft transitions; let a shot breathe through most of a bar. |
| steady | 1 (one cut per bar) | ~0.5 beat | The default rate used across most of the current cut list. |
| building | ramps from ~0.5/bar early to 2+/bar in the last bar or two before the drop | shrinks from ~1 beat early to ~0.15 beat (a near-hard cut) at the drop | Density and transition length both track the energy ramp in the table above — this is the one class where the rate itself changes within a single short. |
| driving | 2 (one cut every 2 beats), more on the drop bar | 0.1–0.25 beat (near-instant) | Whips and glitch cuts are built to read fast; holding a shot for a full bar would fight the track. |

## 4. Recommended 6–8 transitions to build first

The rotation rule comes from the music class above, not from the hexagram number: a short's
transition family and cut rate are set by which of the 8 tracks (and therefore which class) its
trigram pairing lands on. This picks a mix that is (a) cheap enough to build now, (b) reuses the
strongest asset (the glowing hexagram), and (c) gives the 64 shorts a reason to differ that a
viewer can feel — a calm-class short should visibly cut less and slower than a driving-class one.

1. **Fade / slow iris for the calm class (`fade()`, `iris()`).** Zero new render cost, ships in
   `@remotion/transitions` today. Use for kun- and gen-scored shorts: 1 cut per 2 bars, 1.0–1.5
   beat transitions, no whips or glitch anywhere in the short.
2. **B4 — single line wipe, for the steady class.** Cheapest Blender-native transition, one clean
   glowing bar per cut. Default for qian/li-scored shorts at 1 cut/bar, ~0.5 beat length.
3. **B1 — slat/venetian wipe, for the driving class.** The most kinetic Blender option, reserved
   for dui-scored shorts landed on downbeats at ~2 cuts/bar; pairs with a shake for the drop bar.
4. **#6 — hard flash cut, for the drop in every class.** Cheap, reads as intentional, close to
   what `Camera`'s existing `hits` already do. Used once, right on the drop, regardless of class —
   it's the one moment where a beat this literal is earned everywhere.
5. **`Camera` whip-left/right/up + `RGBSplit`/`Slices` (already built), for the driving and the
   back half of the building class.** No new code. Driving-class shorts use them throughout at
   high density; building-class shorts hold them back until the last bar or two before the drop,
   so the escalation in the cut pattern matches the escalation already in the track's energy
   numbers.
6. **B2 — changing lines (yang splits to yin), for the building class's mid-section.** Slowed to
   match the still-quiet early bars of zhen/kan/xun, then the pace picks up per point 5 above.
   Doubly motivated: it's on-theme (a changing line) and it's the right tempo for a track that
   hasn't jumped yet.
7. **#10/#17 — light leak or scanline roll, for the calm class's connective cuts.** A gentle,
   cheap alternative to a plain fade so calm-class shorts don't all look identical to each other;
   still slow enough (~1 beat) to match kun/gen's plateau.
8. **B7 — edge-only flash wipe, as the one cross-class constant.** Cheapest Blender-family option
   (no slab motion, reuses the emission-strength animation already in `hexagram.py`). Used once
   per short regardless of class, so every video keeps at least one moment of the signature green
   glow — a small unifying beat across calm, steady, building, and driving shorts alike.

This keeps the between-short variety honest: two calm-class shorts will still look and sound
different because their hexagram builds and copy differ, but they'll share the same slow, quiet
cut rate — and a driving-class short will visibly cut faster and harder than a calm one, which is
the thing 64 shorts of the same 30-second structure most need in order not to blur together.

## Sources

- [CapCut Templates 2025 Trending](https://www.capcut.com/explore/capcut-templates-2025-trending/7520709454556940296)
- [The top trending CapCut templates in 2026 — HeyOrca](https://www.heyorca.com/blog/capcut-trends-and-templates)
- [Transition TikTok — CapCut](https://www.capcut.com/explore/transition-tiktok)
- [TikTokification — Wikipedia](https://en.wikipedia.org/wiki/TikTokification)
- [The Visual Styles of the Synthwave and Vaporwave Video — PremiumBeat](https://www.premiumbeat.com/blog/synthwave-vaporwave-visual-styles/)
- [VHS Effect & CRT Scanlines — ASCII Magic](https://www.ascii-magic.com/styles/lines)
- [Free Vaporwave and Synthwave Graphics — PremiumBeat](https://www.premiumbeat.com/blog/free-vaporwave-synthwave-graphics/)
- [BPM for Video Editors: How to Cut Your Video to the Beat — ClipMusic](https://clipmusic.ai/blog/bpm-video-editing-guide)
- [Beat-Synced Video Editing Guide — VibesDrop](https://vibesdrop.com/ultimate-beat-synced-video-editing-guide/)
- [BPM and Picture: How Editors Cut to Music Without Losing Their Mind — Tools for Film](https://www.toolsforfilm.com/blog/bpm-and-picture-editors-guide)
- [Beat Sync Video Editing — Bitcut](https://bitcut.app/blog/beat-sync-video-editing)
- [@remotion/transitions docs](https://www.remotion.dev/docs/transitions/)
- [Transitioning — Remotion docs](https://www.remotion.dev/docs/transitioning)
- [Presentations — Remotion docs](https://www.remotion.dev/docs/transitions/presentations)
- [clockWipe() — Remotion docs](https://www.remotion.dev/docs/transitions/presentations/clock-wipe)
- [wipe() — Remotion docs](https://www.remotion.dev/docs/transitions/presentations/wipe)
- [fade() — Remotion docs](https://www.remotion.dev/docs/transitions/presentations/fade)
- [Contribute your own presentation — Remotion docs](https://www.remotion.dev/docs/contributing/presentation)
- [Custom HTML-in-canvas presentations — Remotion docs](https://www.remotion.dev/docs/transitions/presentations/custom-html-in-canvas)
- [gl-transitions/gl-transitions — GitHub](https://github.com/gl-transitions/gl-transitions)
- [remotion-dev/gl-transitions — GitHub](https://github.com/remotion-dev/gl-transitions)
- [Remotion Studio: Cube / gl-transitions demo](https://remotion-gl-transitions.vercel.app/)
- [gl-transitions doorway editor](https://gl-transitions.com/editor/doorway)
- [gl-transitions heart.glsl](https://github.com/gl-transitions/gl-transitions/blob/master/transitions/heart.glsl)
- [gl-transitions directionalwipe.glsl](https://github.com/gl-transitions/gl-transitions/blob/master/transitions/directionalwipe.glsl)
- [gl-transitions cube.glsl](https://github.com/gl-transitions/gl-transitions/blob/master/transitions/cube.glsl)
- [WebGL Video Transitions with Curtains.js — Codrops](https://tympanus.net/codrops/2020/10/07/webgl-video-transitions-with-curtains-js/)
- [ffmpeg prores 4444 w/alpha encoding works with blender — Gist](https://gist.github.com/ericfont/874767869c312cfecc0f70892862aa9a)
- [How to Render with a Transparent Background in Blender — iRendering](https://irendering.net/how-to-render-with-a-transparent-background-in-blender/)
- [New Developer: adding ProRes support — Blender devtalk](https://devtalk.blender.org/t/new-developer-adding-prores-support/34999)
