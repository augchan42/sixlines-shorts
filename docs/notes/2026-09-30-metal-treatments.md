# Metal Qian: still treatments

2026-09-30. The user on the first still (commit ea4ebd4, flat toon bands): "come up with a few
still treatments first before rendering ... the one you had previously was a bit too flat".
`blender/metal.py --treatment NAME` renders the same scene (Blake's sun, clouds and dividers over
Shaughnessy's Dragon at dusk, line 5) five ways. Every treatment but `flat` also has more depth:
a desert floor to the horizon, four mesas spaced in depth (the far ones paler and redder), and the
dividers' hinge leaning out toward the camera.

| Treatment | What it does |
|---|---|
| flat | the first still, kept to compare |
| airbrush | the 1981 Heavy Metal film: smooth sky gradient, soft (eased) bands, rim light on edges, 80s airbrush chrome dividers, stronger glow |
| ink | Moebius: flat colour, hatch lines in shadows, cross-hatch where darkest, ruled lines thickening up the sky, heavier outlines |
| print | a 70s magazine page: halftone dots growing in the shadows and toward the top of the sky; chrome dividers |
| cassaday | John Cassaday's inks under Laura Martin's colour: shadows spotted solid black, feathered at the edge by hatch lines that thicken into the black; brush outlines (Freestyle taper, calligraphy, noise, slight wobble) over soft painted colour with rim light |

## Can Blender do Cassaday's hand-drawn look? (web search, 2026-09-30)

The user asked: "do a web search to see how people get a nice hand-drawn Cassaday, John Cassaday
style effects in Blender and whether that's possible."

Cassaday (Planetary, Astonishing X-Men): realistic, restrained drawing; large spotted blacks that
carry the form; sleek, sinuous contour lines; little hatching, mostly feathering at shadow edges;
Laura Martin's colour is soft and painted, with atmospheric light
([Wikipedia](https://en.wikipedia.org/wiki/John_Cassaday),
[ComicArtFans](https://www.comicartfans.com/comic-artists/john_cassaday.asp)).

What people do in Blender:
- Shadows as ink: Diffuse -> Shader to RGB -> constant ramp (EEVEE only); a low threshold to solid
  black gives spotted blacks; "inking the shadows" as the main form device
  ([Morphic Studio](https://www.themorphicstudio.com/hand-drawn-comic-in-blender/),
  [Creative Bloq](https://www.creativebloq.com/art/digital-art/ink-concept-art-with-comic-style)).
- Lines: Freestyle with thickness and noise modifiers, or Grease Pencil Line Art; for truly drawn
  lines, hand-drawn Grease Pencil strokes attached to the 3D with Geometry Nodes (Derel Flood,
  after Spider-Verse) ([BlenderNation](https://www.blendernation.com/2026/09/06/sticking-hand-drawn-ink-lines-to-3d-animation-with-blender-grease-pencil-and-geometry-nodes/),
  [80.lv](https://80.lv/articles/take-a-look-at-this-comic-book-style-animation-made-with-grease-pencil)).
- Hatching: procedural (Voronoi or wave textures through constant ramps), or shader packs:
  Inkwood 3.0 (Blender 4/5), Pencil Pro, Kushiro's hatch-lines shader
  ([Inkwood](https://superhivemarket.com/products/inkwood),
  [Pencil Pro](https://superhivemarket.com/products/pencil-pro),
  [Kushiro](https://kushiro.gumroad.com/l/SXYqZ)).
- Halftone in the compositor or afterwards.
- Blender's own NPR project (per-object compositing, anti-aliased stylisation) begins after 5.0
  and has not shipped ([Blender NPR project](https://code.blender.org/2025/05/npr-project/)).

Verdict: the look is reachable in parts, all procedural and all drawn in code: spotted blacks,
feathering, brush-weight lines, painted colour. What makes a Cassaday page is the drawing itself:
the shapes of the blacks, chosen by hand, and his figures. A procedural scene gets the finish, not
the draughtsmanship. The nearest code-only step up is to design the black shapes (model shadows
as shapes, not only light thresholds) and hand-place key lines; hand-drawn Grease Pencil strokes
would need the user or an artist to draw them.

## Painted and faceted (later the same evening)

The user sent a Heavy Metal 282 cover (a painted creature and heroine) and asked "Is something like
this possible". Answer given: the light and atmosphere yes; a creature or figure needs a sculpted
model (not code-drawn); the painter's hand no. `painted` tried it: lit textured rock, volumetric
clouds and ground fog, warm key and teal fill, gold dividers, anisotropic Kuwahara as an oil-paint
filter. First render: murky; the clouds read as dark smoke and the Kuwahara barely shows.

The user then: "maybe we need to come up with a style that's best suited for Blender. Is there
something Pareto optimal possible? ... if hand-drawn isn't possible, then we'll stick to polygons
and do something fun with those. Or maybe something like vectors with lots of triangles ... like a
talking head with lots of vectors and triangles."

`faceted`: everything triangulated and flat shaded, one colour per face; the sky a field of
jittered triangles, each coloured from the dusk ramp at its height (a face-corner colour
attribute); clouds as heaps of jittered icospheres; 14-sided sun; six-sided dividers; no ink.
First render: the sky and clouds work; the mesas and floor need stronger facets and more light.

Why faceted is the Pareto choice for Blender: it is geometry and light, which Blender renders
exactly, in seconds (EEVEE), and it animates cleanly (camera moves, rigs, shape keys); the look is
deliberately stylised, so nothing is measured against a hand. Crude modelling reads as style.
