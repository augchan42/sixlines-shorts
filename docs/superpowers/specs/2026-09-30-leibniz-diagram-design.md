# The Letter from Beijing: a terminal lesson on the Leibniz diagram (design)

Status: 2026-09-30. Asked for by the user, with the woodcut attached: "yes a nostromo style
tutorial/raadout of this diagram!!! with flythrough and explations". The treatment (four chapters,
plate then wireframe flight) was approved in chat: "yes looks good". Facts:
docs/research/2026-09-30-leibniz-diagram.md; every line of copy below comes from its "Safe to say
on screen" list or is marked otherwise. Reviewed by gpt-6.1-sol
(docs/research/2026-09-30-codex-leibniz-spec.md): CHANGE; its copy changes are taken below except
page 15. The copy of record is series/explainers/leibniz-lesson.json.

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
  Kun at the top left, Qian at the bottom right; the top row, left to right, is 坤 剝 比 觀 豫 晉 萃 否,
  all with Kun below. Checked by eye on the woodcut (2026-09-30): its top row and its right-hand
  column (否 遯 訟 姤 无妄 同人 履 乾, all with Qian above).
- This is Leibniz's numeric reading of Shao Yong's order. The traditional sequence starts from
  Qian and runs the other way; it is not a Chinese count from zero.

Tests pin all of this (see Build).

## Pages

Chapter words centred, held 1.5 s as in the Wang Bi lesson. Answers in capitals as in the Wang Bi lesson; Chinese always with
English beside it. `show` names the draw on that page.

**THE OBJECT**

1. WHAT IS THIS / A DIAGRAM OF THE 64 HEXAGRAMS,\nPATTERNS OF SIX LINES.\nSENT FROM CHINA IN 1701.
   Show: plate, whole, a slow push.
1a. WHAT AM I LOOKING AT / 64 HEXAGRAMS ROUND A CIRCLE.\nTHE SAME 64 IN A SQUARE.
   Show: the plate; the ring's band outlined in amber, then the square. (Added 2026-09-30, the
   user: "yes please add that", after the diagram was explained.)
2. WHO SENT IT / JOACHIM BOUVET, A JESUIT\nAT THE KANGXI EMPEROR'S COURT.\nPEKING, 4 NOVEMBER 1701.
   Show: plate, push toward the top of the ring.
3. WHO GOT IT / GOTTFRIED LEIBNIZ, 1 APRIL 1703.\nHE HAD WRITTEN UP BINARY IN 1679,\nBEFORE HE SAW THIS.
   Show: plate.

**THE COUNT**

4. READ IT AS A NUMBER / LEIBNIZ'S READING:\nBROKEN IS 0. SOLID IS 1.\nREAD FROM THE BOTTOM UP.
   Show: the plate fades to the wireframe; Bi lifts out large, amber, with the weights 32 16 8 4 2 1
   beside its lines from the bottom up, and 000010 = 2 under it.
5. COUNT THE RING / KUN, ALL BROKEN, IS 0.\nUP THE RIGHT HALF TO GOU, 31.
   Show: from high over the ring, down beside Kun, then along the right half while a counter reads
   000000 = 0 up to 011111 = 31, each hexagram amber as the count reaches it; held on 31 for 2 s.
   Counter, amber and camera run off one progress value.
6. THEN WHAT / AFTER 31, START AT THE BOTTOM LEFT.\nAT 32 THE BOTTOM LINE TURNS SOLID.\nUP THE LEFT HALF TO QIAN, 63.
   Show: 011111 → 100000 (all six lines change), the camera crosses to Fu and climbs to Qian.
7. WHAT ARE THE SMALL NUMBERS / 0 TO 63.\nATTRIBUTED TO LEIBNIZ.
   Show: back to the plate, a push onto the 4 5 6 7 over the square's top row (豫 晉 萃 否, values 4
   to 7), ringed in amber, the scan shown softer so the faint digits stay.

**THE ORDER**

8. WHOSE ORDER IS IT / ATTRIBUTED TO SHAO YONG 邵雍,\nELEVENTH CENTURY.
   Show: wireframe ring, still.
9. HOW / EACH PATTERN BRANCHES INTO TWO.\nEACH STAGE ADDS A LINE.\nSIX STAGES: 64 PATTERNS.
   Show: the tree, six stages to a row of 64, 0 on the left; the row splits into two groups of 32,
   and each group bends up one half of the ring (0-31 on the right, 32-63 on the left).
10. A FRIEND'S VERDICT / CHENG HAO 程顥:\n"JUST THE DOUBLING METHOD."\n加一倍法
    Show: the tree, dim. ("Friend": Adler, and the recorded exchange in 上蔡語錄 juan 3.)
11. THE SQUARE / THE SAME 64 AS A SQUARE.\nA TRIGRAM IS THREE LINES.\nROWS SHARE THE LOWER ONE,\nCOLUMNS THE UPPER.
    Show: down through the ring into the square; one row amber, then one column, each with its
    shared trigram bracketed.

**WHAT IT MEANT**

12. DID LEIBNIZ GET BINARY HERE / NO. HE HAD IT BY 1679.\nSHAO YONG DID NOT USE THESE\nPATTERNS AS NUMERALS.\nLEIBNIZ SAW CONFIRMATION.
    Show: plate left, wireframe right, both dim.
13. WHAT DID LEIBNIZ SAY / "PERHAPS THE MOST ANCIENT\nMONUMENT OF SCIENCE."
    Show: plate.
14. AND WANG BI / WANG BI, THIRD CENTURY:\nONCE YOU HAVE THE MEANING,\nFORGET THE IMAGE.
    Show: the wireframe ring, one hexagram amber, its lines lifting out as in the Wang Bi lesson.
15. SIX LINES. 64 SITUATIONS.
    Then the end card. (The review suggested "64 PATTERNS"; kept "SITUATIONS", since after Wang Bi
    the lesson turns from the patterns to reading them.)

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
- **Lesson.tsx** gains show kinds, nested so they don't collide with `draw`, `fly` and `amber` (line
  indices there): `plate` ({zoom: [from, to], at: [[x, y], [x, y]]}) and `diagram` ({count: [from,
  to], at, secs}; later `kind: "ring" | "square" | "tree" | "bits"` and a plate fade). Diagram
  values are binary values, never King Wen numbers; the explainer passes all 64 names by value. Existing
  pages and the Wang Bi lesson render unchanged (a test renders one of its stills before and after).
- **series/explainers/leibniz-lesson.json**: the pages above, in the Wang Bi lesson's shape.
- **scripts/explainer.mjs** renders it; `--pages 1,5` renders those pages (chapter pages not counted)
  as <name>-pages-1-5, with no end card and no end-music lead-in, for the smoke test.
- **tests/diagram.test.mjs**: the values (Kun 0, Bo 1, Bi 2, Gou 31, Fu 32, Guai 62, Qian 63 by
  King Wen number from our data), the ring's four corners (Qian top-left of centre, Gou top-right,
  Fu bottom-left, Kun bottom-right), the square's corners (Kun top-left, Qian bottom-right) and its
  top row, and that the copy passes the banned-word check.

## Smoke test, before the full build

Pages 1 and 5 only, about 20 s: the plate, then the ring flight with the counter to 31. The user
views it; only then the rest.

## Open
- A wide cut for the site, if wanted later: the same pages at 1920x1080.
