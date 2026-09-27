# Recomposing the 64 without a night of Blender

2026-09-27. The user, after the end card's period cost 63 Blender renders: "we really need a
better way to sort of compose or recompose all 64 without being such a huge render effort."
Then: "let's try it out and do a web search for best practices."

## Why a recompose is expensive

Two things are baked into the Blender clips that change more often than the geometry:

1. **Text.** The end card's tagline and site are Blender objects (blender/endcard.py
   `typed_text`, `lit_text`). A period costs 63 × 2:17 of Eevee. SIX LINES is different: it is
   traced as glowing tubes like the lines (`wordmark`), geometry, and stays in Blender.
2. **Tempo.** Every clip is rendered for one bpm (`hexagram-010110-90bpm-8b`,
   `endcard-join-…-90bpm-9b`), so a music swap re-renders the build, the end card and the
   character. 86 hexagram and 90 end card files exist for 64 shorts.

The Remotion part is cheap: about a minute a short.

## The plan

- **A. Text moves to Remotion** (done first, on 22's end card). `endcard.py --no-text` leaves
  the tagline and site out and writes the timing beside the clip (`<clip>.json`: frames, beat,
  solid, rise). `EndCard3D` draws them on that timing: Goudy caps in cream typed one character a
  frame from `rise + beat` with a block cursor blinking on the half beat; the site in the pixel
  font brightening in over 15 frames after it. Positions from the Blender frame (tagline cap
  height at y 1249–1288, site at 1354–1405). Glow by stacked `text-shadow` (a tight core and
  wider halos, the standard way to fake emission in CSS). **Failed the user's judgment** on the
  sample (2026-09-27): "unfortunately, the blender text looks much better." The measured boxes were
  close (tagline x 232–847 in Blender against 221–847; site y 1353–1407 against 1364–1411) but the
  glow is not: Blender's is bloom on emission, the CSS is a soft shadow. The code path stays
  (`endcardText`, off by default); the text stays in Blender. Text changes are rare (one in the
  whole series, the period), so the saving was never the text: it is B and C.
- **B. Tempo moves to Remotion.** Render each clip once at the fastest tempo used (120 bpm) at
  60 fps; Remotion plays it at `playbackRate` = track bpm / 120 (0.5–1.0). With a 60 fps
  source, a 30 fps output at ≥ 0.5× never repeats a frame, so no stutter (the 0.75× end card in
  the flight test is a 30 fps source, which repeats one frame in four). Remotion's note: a
  playback rate that *changes over time* needs the elapsed source time accumulated by hand and
  `trimBefore` set from it; a constant rate per clip, as here, is the plain case. `OffthreadVideo`
  reads VP8/VP9 and ProRes, and `transparent` (PNG extraction, slow) if an alpha layer is ever
  wanted.

  Built for the end card first (2026-09-27, after A failed): `scripts/endcard.mjs --ref` renders
  `endcard-<mode>-<lines>-<beats>b-ref.mp4` at 120 bpm and 60 fps (`blender/endcard.py --fps`;
  its fixed frame counts, a slide, a flare, the typing, scale with the rate so they take the same
  time; the glyph rain is `rain-60.mp4`, each frame doubled, so it runs at its old speed).
  `endcardRef: true` on a row of series/copy.json plays that card at bpm / 120 (`endcard.rate`
  in the props). Tried on 22 (91.99 bpm, rate 0.767). What changes against a card rendered for
  the tempo: the fixed-length moves now slow with the track too (at 92 bpm a slide takes 0.26 s
  instead of 0.2 s, the tagline types in 0.74 s instead of 0.57 s), and the rain runs at 0.77×.
  Blender takes about twice as long a card (271 frames instead of 178), once.

  Every hexagram has its own lines, so this does not cut the number of cards (64). It cuts what
  a music change costs: nothing in Blender.
- **C. `scripts/recompose`.** Re-render only the shorts whose recorded input hashes changed (the
  render records already carry every input's sha256), several in parallel, then a strip of one
  frame per changed short. The same idea as the incremental pipelines in the search results
  (a manifest of content hashes per scene; unchanged runs copied from the last output, changed
  ones rendered), without the segment splicing: a short is one Remotion render.

## The other way to keep the exact Blender look

If CSS text does not match: render the text as its own Blender view layer with Film
Transparent, as an RGBA PNG sequence or ProRes 4444, and composite it in Remotion
(`OffthreadVideo transparent`). A text-only scene renders in seconds a clip, so 63 would take
minutes, not hours, and the bloom is Blender's. The cost is an alpha decode per frame
(Remotion says it slows the render) and a second file per clip.

## Sources

- Remotion, `<OffthreadVideo>`: https://www.remotion.dev/docs/offthreadvideo
- Remotion, changing the speed of a video over time: https://www.remotion.dev/docs/miscellaneous/snippets/accelerated-video
- Remotion, rendering transparent videos: https://www.remotion.dev/docs/transparent-videos
- Blender manual, Render Layers node: https://docs.blender.org/manual/en/latest/compositing/types/input/scene/render_layers.html
- Artisticrender, compositing render layers and passes: https://artisticrender.com/blender-compositing-render-layerspasses/
- CSS-Tricks, neon text with CSS: https://css-tricks.com/how-to-create-neon-text-with-css/
- An incremental render pipeline (scene manifest of content hashes, reuse unchanged runs): https://github.com/remco59/StudyTube/pull/52
