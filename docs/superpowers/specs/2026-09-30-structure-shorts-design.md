# Structure shorts: the 64 as a cube, pairs, splits, a count, two octagons, codons, a timeline (design)

Status: 2026-09-30, draft. The user, 2026-09-30, on the list of ideas that stick: "work on a
similar nostromo style short for the following. maybe try to add some more blender graphics where
appropriate. you can check 8bitoracle-next or 8bitoracle-brand for inspiration."

## What they are

Seven vertical shorts, 1080x1920, each 30 to 60 s, in the Leibniz lesson's terminal look
(src/templates/Lesson.tsx, look "flight"): header "SIX LINES // READY FOR INQUIRY", a query typed
after ">", an answer typed below it, the drawing in the window under them. HUD colours as always:
frame and lines green, amber for what to look at, cyan the prompt. Calm camera, no punch or shake.
For the Six Lines account. No chapter pages; each runs straight. Share copy: yuv420p, faststart,
under 25 MB, at the series loudness (scripts/series/render-lib.mjs).

New here: Blender scenes inside the terminal's window. A page may show a clip (`show.clip`), a
Blender render of the window's size (980x1160), drawn where the wireframe diagrams go, with the
same glow. Blender for what needs depth and light (the cube, slabs turning over, the octagons);
the Remotion wireframes (src/scenes/Diagram.tsx) where they already exist (tree, ring, bits).

Borrowed from 8bitoracle-brand (src/app/globals.css): `crt-tune-in`, a 150 ms power-on flicker
(opacity 0, 0.85, 0.3, 1) at each short's start; `hex-line-cast`, lines cast bottom to top 80 ms
apart, for a hexagram drawn beside a corner. Neither repo has 3D; the Blender scenes are new.

Order of making: 1 the cube, first, as the smoke test for Blender in the terminal; then 2, 7, 5,
3 and 4, 6.

## 1. The 64 are corners of a six-dimensional cube

Facts (tested in tests/structure.test.mjs):
- Changing one line of a hexagram gives another hexagram. Each has exactly six such neighbours.
- So the 64 are the corners of a six-dimensional cube: 64 corners, 192 edges, six at each corner.
- Changing all six lines reaches the opposite corner, six steps away: Qian 乾 (The Creative) to
  Kun 坤 (The Receptive).
- The Zuo zhuan (左傳, 4th century BCE) names a changing line by the hexagram it turns into:
  "Guan zhi Pi" (觀之否, Contemplation going to Standstill) is line 4 of Guan. The one-line
  neighbour is how the oldest records read a line. (Checked in docs/research before the copy is
  final.)

Pages:
1. WHAT SHAPE ARE THE 64 / A CUBE.\nIN SIX DIMENSIONS.
   Clip: the cube turning slowly, all 64 corners dim green.
2. WHAT IS A CORNER / ONE HEXAGRAM.\nNEIGHBOURS DIFFER BY ONE LINE.
   Clip: one corner amber, its six edges and neighbours lit; the hexagram drawn beside it.
3. HOW FAR IS THE OPPOSITE / SIX STEPS.\nEVERY LINE CHANGED.\n乾 THE CREATIVE TO 坤 THE RECEPTIVE.
   Clip: a path from Qian to Kun, one edge at a time, a relay click at each step.
4. WHO READ IT THIS WAY / THE ZUO ZHUAN, 4TH CENTURY BCE:\nA LINE IS NAMED BY WHERE IT LEADS.
   Clip: Guan and Pi, one edge between them lit amber.
5. 64 CORNERS\n6 WAYS OUT OF EACH

The Blender scene (blender/hypercube.py): the six-dimensional cube projected to 3D along six
directions spread evenly (the icosahedron's six axes), so the whole cube shows as a round,
even lattice (its outline a rhombic triacontahedron); edges as thin neon tubes, corners as small
glowing beads, over black with a little haze; the camera orbits slowly. Flags choose what is lit:
`--focus V` (a corner amber, its six edges and neighbours bright), `--path V,V,...` (edges lit in
turn at given seconds). Eevee, bloom on.

## 2. King Wen's order is 32 pairs

Facts (tested): in the received order, 1-2, 3-4 ... 63-64 are pairs. In 28 the second is the
first turned upside down. The other 4 (1-2, 27-28, 29-30, 61-62) are the 8 hexagrams that read
the same upside down, and there every line flips instead.

Pages: WHY ARE THEY IN THIS ORDER / IN PAIRS. 32 OF THEM. -- WHAT MAKES A PAIR / TURN THE FIRST
UPSIDE DOWN. -- ALWAYS / 28 TIMES. 8 READ THE SAME UPSIDE DOWN,\nSO THOSE FLIP EVERY LINE. -- SO
WHAT / EACH PAIR IS ONE SITUATION\nSEEN FROM THE OTHER SIDE. -- 32 PAIRS\n64 SITUATIONS.
Blender: two obsidian hexagrams (blender/hexagram.py's slabs) side by side; the first turns over
end to end into the second; for the four, each slab flips on its own axis instead. A fast run of
all 32 pairs at the end.

## 3. One becomes 64 in six splits (loop, 10 s)

The Leibniz lesson's tree (Diagram.tsx `tree`), alone: SIX SPLITS / 64 PATTERNS. Built to loop.

## 4. Counting from Kun 0 to Qian 63 (loop, 15 s)

The Leibniz lesson's ring count (Diagram.tsx `count`, 0 to 63 in one pass) with the counter:
THE I CHING COUNTS IN BINARY / LEIBNIZ'S READING, 1703. Built to loop.

## 5. Heaven before and after

Facts: the eight trigrams in two octagons, both attributed by tradition (Earlier Heaven 先天 to
Fu Xi, Later Heaven 後天 to King Wen) and first drawn as diagrams in the Song dynasty; Shao Yong
set out the Earlier Heaven order. In the Earlier Heaven, each trigram stands opposite its
complement (Heaven 天 opposite Earth 地). The Later Heaven follows the Discussion of the
Trigrams (說卦, chapter 5): the seasons and directions, Thunder 雷 in the east where spring starts.
Blender: two octagons of glowing trigrams; the trigrams move from one arrangement to the other.

## 6. 64 codons

Facts: DNA's code has 64 codons (4 letters, three at a time: 4^3), the I Ching 64 hexagrams
(two kinds of line, six at a time: 2^6). Books since the 1970s have mapped one onto the other; the
match is in the count, not in any shared origin. Pages end: SAME NUMBER.\nNOT THE SAME CODE.
Remotion only.

## 7. 3,000 years in 40 seconds

A terminal log, the year ticking over, one line per entry, only entries that stand:
Fu Xi (legend); King Wen (tradition); Shao Yong, 11th century; Bouvet to Leibniz, 1701, and
Leibniz's paper, 1703; Jung's foreword to the Wilhelm/Baynes translation, 1950; Philip K. Dick
plots The Man in the High Castle with the I Ching, 1962. Blender: a slow push along a corridor of
dates (a Blade Runner searchlight, blender/searchlight.py).

## Music

At most 120 bpm, calm, one track per short, none repeated within the set, all from
series/music-audit.json; each named in its script's json with the reason.

## Build, first for the cube

- src/lib/cube.ts: `neighbours(v)`, `opposite(v)`, `path(a, b)` (one line at a time, bottom first).
  Tests: 6 neighbours each, 192 edges, Qian to Kun in 6, Guan's line 4 goes to Pi.
- blender/hypercube.py, run by scripts/hypercube.mjs; clips to public/local/structure/.
- Lesson.tsx: `show.clip` ({src, from?}) plays a clip in the window.
- series/explainers/structure-cube.json.
- Banned words tested, as for the lessons.

## Smoke test

The cube's pages 2 and 3: the Blender scene in the terminal, one corner and its neighbours, then
the path. The user views them before the rest.
