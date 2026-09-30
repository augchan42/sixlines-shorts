# The Letter from Beijing: a terminal lesson on the Leibniz diagram (design)

Status: 2026-09-30. Asked for by the user, with the woodcut attached: "yes a nostromo style
tutorial/raadout of this diagram!!! with flythrough and explations". The treatment (four chapters,
plate then wireframe flight) was approved in chat: "yes looks good". Facts:
docs/research/2026-09-30-leibniz-diagram.md; every line of copy below comes from its "Safe to say
on screen" list or is marked otherwise. Review: gpt-6.1-sol (see the end).

## What it is

One vertical lesson, 1080x1920, about 2 min, in the look of the Wang Bi lesson
(series/explainers/wangbi-lesson.json, src/templates/Lesson.tsx): an inquiry at a green terminal,
header "SIX LINES // READY FOR INQUIRY", one query and one answer per page, a chapter word between
chapters, teletype ticks. Our own names only, never MU/TH/UR. Instagram delivery: yuv420p,
faststart, under 25 MB.

The object is the diagram Bouvet sent Leibniz: Shao Yong's circle of the 64 hexagrams with the
8x8 square inside it. It is shown two ways:

- **The plate**: the scan itself (Wikimedia Commons, public domain, 1313x1262), tinted phosphor
  green, on the terminal's screen. Slow pushes only; the scan is soft, so no push past about 2x.
- **The wireframe**: the same diagram rebuilt from our hexagram data as vector lines, which the
  camera can fly through (the Flight.tsx camera, as in the Wang Bi lesson's flight pages). The plate
  fades into the wireframe where the lesson starts counting.

HUD colours as everywhere: the frame and lines stay phosphor green; amber marks the hexagram or line
to look at; cyan is the prompt. Calm camera: pushes, cranes and the flight's glide; no shake.

## How the diagram is ordered (checked against the woodcut)

- A hexagram's value: broken line 0, solid line 1, the bottom line the most significant bit, read
  bottom to top. Kun (all broken) is 0, Qian (all solid) is 63. Bo is 1, Bi is 2, Gou is 31, Fu is
  32, Guai is 62.
- **The ring**: Qian at the top, just left of centre; Gou at the top, just right. Fu at the bottom
  left, Kun at the bottom right. Counting 0 to 63: Kun (0) at the bottom right, up the right half
  to Gou (31) at the top; then Fu (32) at the bottom left, up the left half to Qian (63). Each
  hexagram's bottom line faces the centre.
- **The square**: rows share a lower trigram, columns an upper trigram; value = 8 x lower + upper.
  Kun at the top left, Qian at the bottom right; the top row is 否 萃 晉 豫 觀 比 剝 坤 read right to
  left, all with Kun below.

Tests pin all of this (see Build).

## Pages

Chapter words centred, held 2 s. Answers in capitals as in the Wang Bi lesson; Chinese always with
English beside it. `show` names the draw on that page.

**THE OBJECT**

1. WHAT IS THIS / A DIAGRAM OF THE 64 HEXAGRAMS.\nIT WENT FROM CHINA TO EUROPE IN 1701.
   Show: plate, whole, a slow push.
2. WHO SENT IT / JOACHIM BOUVET, A JESUIT\nAT THE KANGXI EMPEROR'S COURT.\nPEKING, 4 NOVEMBER 1701.
   Show: plate, push toward the top of the ring.
3. WHO GOT IT / GOTTFRIED LEIBNIZ, 1 APRIL 1703.\nHE HAD WRITTEN UP BINARY IN 1679,\nBEFORE HE SAW THIS.
   Show: plate.

**THE COUNT**

4. READ A LINE AS A BIT / BROKEN IS 0. SOLID IS 1.\nREAD FROM THE BOTTOM UP.
   Show: the plate fades to the wireframe; one hexagram, Bi, lifts out large, amber, its bits
   beside its lines: 0 0 0 0 1 0 = 2.
5. COUNT THE RING / KUN, ALL BROKEN, IS 0.\nQIAN, ALL SOLID, IS 63.
   Show: the flight. The camera glides round the ring's right half from Kun to Gou while a counter
   reads 000000 = 0 up to 011111 = 31; each hexagram turns amber as the counter reaches it.
6. WHY DOES IT JUMP / AT 31 THE RIGHT HALF IS FULL.\n32 SETS THE BOTTOM LINE,\nAND THE COUNT CLIMBS THE LEFT.
   Show: the camera crosses to Fu (100000 = 32) and climbs the left half to Qian (111111 = 63).
   (Our own reading of the order, not from the research list; it follows from the values.)
7. WHAT ARE THE SMALL NUMBERS / LEIBNIZ WROTE THEM IN:\n0 TO 63.
   Show: back to the plate, a push onto the numerals by the ring's top. (Attributed to Leibniz via
   Perkins 2004, as Commons has it.)

**WHO DREW IT**

8. WHO MADE THIS ORDER / SHAO YONG 邵雍,\nELEVENTH CENTURY.
   Show: wireframe ring, still.
9. HOW / BY HALVING:\nONE, TWO, FOUR ... SIXTY-FOUR.\nEACH SPLIT ADDS A LINE.
   Show: the doubling tree: a bar splits into broken and solid, each of those splits, six times,
   until 64 hexagrams stand in a row, 0 on the left; the row then bends into the ring.
10. A FRIEND'S VERDICT / CHENG HAO 程顥:\n"JUST THE DOUBLING METHOD."\n加一倍法
    Show: the tree, dim. (Cheng Hao knew Shao Yong in Luoyang; "friend" to be checked, else "A
    CONTEMPORARY".)
11. THE SQUARE / THE SAME 64 AS A SQUARE.\nEACH ROW SHARES ITS LOWER TRIGRAM,\nEACH COLUMN ITS UPPER.
    Show: the camera comes down through the ring into the 8x8 square; one row lights amber, then
    one column.

**WHAT IT MEANT**

12. DID CHINA INVENT BINARY / SHAO YONG ORDERED THE 64 BY HALVING.\nHE DID NO SUMS WITH THEM.\nLEIBNIZ SAW CONFIRMATION, NOT A SOURCE.
    Show: plate and wireframe side by side, dim.
13. WHAT DID LEIBNIZ SAY / "THE MOST ANCIENT\nMONUMENT OF SCIENCE."
    Show: plate.
14. AND WANG BI / WANG BI, 800 YEARS EARLIER:\nONCE YOU HAVE THE MEANING,\nFORGET THE IMAGE.
    Show: the wireframe ring, one hexagram amber, its lines lifting out as in the Wang Bi lesson.
15. SIX LINES. 64 SITUATIONS.
    Then the end card.

Banned words (oracle, divination, fortune, prediction, mystical, magical) appear nowhere; Leibniz's
"mystery" is not quoted.

## Music

The Mountain (pick13, 90 bpm), as in the Wang Bi lesson: calm, and long enough. If the two lessons
should differ, the other part of the same track (start about 60 s in) is the fallback; no track
above 120 bpm.

## Build

- **scripts/leibniz-plate.mjs** fetches the Commons scan, checks its sha256, writes
  public/leibniz/plate.jpg (not committed; the script and hash are the provenance), as
  scripts/wuyue-map.mjs does for the coast.
- **src/scenes/Diagram.tsx**: the wireframe, drawn with the Flight.tsx camera. Pure functions,
  tested: `value(lines)` (bottom line most significant), `ringPos(v)` (angle on the ring from the
  order above), `squareCell(v)` (row = lower trigram, column = upper), `treeRow(depth)`. Draws:
  `ring`, `square`, `tree`, `bits`, the counter.
- **Lesson.tsx** gains show kinds: `plate` ({push, to: [x, y], zoom}), `diagram` ({draw: "ring" |
  "square" | "tree", count?: [from, to], fly?, amber?}), `fade` from plate to wireframe. Existing
  pages and the Wang Bi lesson render unchanged (a test renders one of its stills before and after).
- **series/explainers/leibniz-lesson.json**: the pages above, in the Wang Bi lesson's shape.
- **scripts/explainer.mjs** renders it; a `--pages a-b` option renders a range, for the smoke test.
- **tests/diagram.test.mjs**: the values (Kun 0, Bo 1, Bi 2, Gou 31, Fu 32, Guai 62, Qian 63 by
  King Wen number from our data), the ring's four corners (Qian top-left of centre, Gou top-right,
  Fu bottom-left, Kun bottom-right), the square's corners (Kun top-left, Qian bottom-right) and its
  top row, and that the copy passes the banned-word check.

## Smoke test, before the full build

Pages 1 and 5 only, about 20 s: the plate, then the ring flight with the counter to 31. The user
views it; only then the rest.

## Open

- Page 10: "friend" or "contemporary" for Cheng Hao.
- A wide cut for the site, if wanted later: the same pages at 1920x1080.
