# Six Bits: a terminal short on Shannon and the six lines (design)

Status: 2026-09-30, draft for the user's review. Asked for after the timeline rewrite on 8bitoracle.ai:
the user, "shannon information theory does have relation to the i-ching, in the sense that the bits
contain information and the 6 bits describe things with max entropy/efficiency. shannon did not
follow the i-ching (we don't find it) but the relationships are there", then, on "6 lines, 6 bits"
as a Six Lines short: "yes love it", "yes please write up the shannon short".

## What it is

One vertical short, 1080x1920, about 60 s, in the Leibniz lesson's look
(series/explainers/leibniz-lesson.json, src/templates/Lesson.tsx): the green terminal, header
"SIX LINES // READY FOR INQUIRY", one query and one answer per page, the wireframe drawn beside it.
No chapter pages; it is short enough to run straight. For the Six Lines account. Instagram delivery:
yuv420p, faststart, under 25 MB.

It reuses the Leibniz lesson's drawings (src/scenes/Diagram.tsx): a hexagram lifted out with its
bits, the doubling tree, the ring. One new drawing: the odds bars (page 5). HUD colours as
everywhere: frame and lines green, amber on the line or bar to look at, cyan the prompt. Calm
camera, no shake.

## The facts (to be checked into docs/research/2026-09-30-shannon-six-bits.md before copy is final)

- Claude Shannon, "A Mathematical Theory of Communication", Bell System Technical Journal, 1948.
  It measures information in bits (the word credited there to John Tukey).
- One choice between two equally likely options is one bit. Six such choices: 2^6 = 64 patterns,
  log2 64 = 6 bits. Six bits is the most six two-way lines can carry, reached only when all 64 are
  equally likely.
- Three coins: each line is yin or yang half the time (old yin 1/8, young yang 3/8, young yin 3/8,
  old yang 1/8).
- Yarrow stalks: old yin 1/16, young yang 5/16, young yin 7/16, old yang 3/16; yin 8/16, yang
  8/16. So the first hexagram carries the full 6 bits by either method.
- With moving lines, a line has four outcomes: 1.81 bits by coins, 1.75 by yarrow; a whole cast
  about 10.9 bits by coins, 10.5 by yarrow. Here the methods differ. (Computed; the test pins it.)
- No source shows Shannon drew on the I Ching. The link is shared structure, not borrowing.
- Leibniz's reading (the Leibniz lesson): broken 0, solid 1, bottom line first. Hexagram 63
  (After Completion, 既濟) alternates solid-broken from the bottom: 101010. With the bottom line
  worth 32, as in that lesson (Gou 31, Qian 63), it is 42.

## Pages

Answers in capitals, as in the lessons. `show` names the drawing.

1. HOW MUCH CAN ONE LINE SAY / YIN OR YANG.\nONE CHOICE OF TWO.\nONE BIT.
   Show: one line, flickering solid-broken like a coin, then held; a "1 BIT" readout.
2. AND SIX LINES / 2 X 2 X 2 X 2 X 2 X 2 = 64.\nSIX BITS. 64 PATTERNS.
   Show: the doubling tree grows to its row of 64 (the Leibniz lesson's tree, with its chatter).
3. WHO MEASURED THIS / CLAUDE SHANNON, 1948.\nINFORMATION, COUNTED IN BITS.
   Show: 既濟 (After Completion) lifted out, its bits written in reading order: 101010.
4. IS SIX THE MOST / ONLY IF ALL 64\nARE EQUALLY LIKELY.
   Show: the ring, every hexagram lit at the same dim level.
5. ARE THEY / COINS: YIN OR YANG, HALF AND HALF.\nYARROW: 8 IN 16 EACH WAY.\nSIX FULL BITS EITHER WAY.
   Show (new): four bars for the yarrow odds, 1/16 and 7/16 stacking to 8/16 yin, 5/16 and 3/16
   stacking to 8/16 yang; the two stacks end level, and amber marks the level.
6. DID SHANNON READ THE I CHING / NOT THAT WE CAN FIND.\nTHE STRUCTURE IS SHARED,\nNOT BORROWED.
   Show: the ring, still.
7. SO WHAT DO SIX BITS HOLD / ONE SITUATION OUT OF 64.\nWHAT TO DO IN IT\nIS JUDGMENT.
   Show: one hexagram amber on the ring.
8. 6 LINES\n6 BITS
   Then the end card.

Optional page between 5 and 6, only if the user wants the extra fact:
WHAT ABOUT MOVING LINES / THEN A LINE HAS FOUR ANSWERS.\nCOINS: ABOUT 10.9 BITS A CAST.\nYARROW: ABOUT 10.5.

Banned words (oracle, divination, fortune, prediction, mystical, magical) appear nowhere; a test
checks the copy, as for the Leibniz lesson.

## Sound and music

The machine sounds as in the Leibniz lesson: bed, teletype, printer, a relay click per bit as page 3
writes its digits, the tree's chatter on page 2, a sweep as the ring appears. No beacon (no
flight) and no guqin.

Music: pick17, "Midnight Synthwave", 90 bpm, G major, from 0 s as on 24 (Return, calm), low under the lesson (0.3) as in the
Leibniz lesson. It keeps this short apart from the two lessons on The Mountain. The user judges it by
ear on the smoke test; any other pick must stay at or under 120 bpm.

End card: hexagram 22, as the two lessons, so the terminal pieces end alike.

## Build

- **src/lib/entropy.ts**: `entropy(probs)` in bits. Tested: 64 equal = 6; yin/yang 1/2 = 1; coins
  and yarrow give yin 1/2; line entropy 1.81 (coins) and 1.75 (yarrow).
- **src/scenes/Diagram.tsx**: a `line` kind (one line flickering, then held, with its bit) and an
  `odds` kind (the four bars stacking to two level totals). Relay cues for both through
  `diagramCues`, tested like the others.
- **series/explainers/shannon-short.json**: the pages above, in the Leibniz lesson's shape.
- **tests/diagram.test.mjs** (or a new tests/shannon.test.mjs): the numbers above, the banned
  words, and that page 3's hexagram reads 101010 = 42.
- Rendered by scripts/explainer.mjs as the Leibniz lesson is.

## Review

gpt-6.1-sol reads this spec and the research note for facts and copy before the smoke test, as for
the Leibniz lesson.

## Smoke test, before the full build

Pages 1 and 5 only: the new line drawing and the new odds bars. The user views them; only then
the rest.
