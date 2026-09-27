# Depth review brief — what 10 taught (2026-09-27)

The Sixty-Four Records are ~30 s vertical shorts, one per I Ching hexagram, promoting the Six Lines
app (sixlines.day). Six Lines is for honing judgment, read the Confucian way (Wang Bi, the Ten
Wings). It is not fortune-telling. Each short shows, in order:

- a hook (a situation the viewer is in)
- two meaning cards
- a question
- the lesson, which comes last

The lesson is the takeaway. Fifty lessons are `lines` (a HUD readout of the hexagram, often with a
finding about one line). Fourteen are `character` lessons, where an animation of the Chinese
character tells the lesson's story. The `source` field describes that animation.

## What happened on 10 (Treading, 履)

1. **The lesson went from surface conduct to the reason behind it.**
   - It went "Beside the strong, be courteous." → "Near a temper, stay quiet." → "Near a temper,
     stay steady inside."
   - The user rejected the first as the wrong reading: "it's about being unseen as if you
     aren't there". They rejected the second as too simple: "there's got to be more than that than
     just staying quiet".
   - What fixed it was line 2's Small Image (小象), 中不自亂: "steady within, not thrown into
     disorder". It gives the reason behind the line's image (the quiet one on a level path).
   - **Learning:** a lesson that names only an outward act (be polite, be quiet, wait, push) is
     too shallow. Say the inner stance or the reason the text gives. Read the line statement
     *with* its Small Image and Wang Bi's note. The statement alone gives the image; the Small
     Image and the note give the why.
2. **The finding pairs the image with its reason.**
   - "LINE 2: A LEVEL PATH. / STEADY INSIDE, IT GOES WELL."
   - A finding that only translates the image ("THE QUIET ONE DOES WELL.") leaves the viewer to
     guess why.
3. **No promised outcomes.**
   - The meaning card "Act well and it won't flare" became "Stay steady and it may pass."
   - The classic says what conduct fits the moment. It does not guarantee results. Flag any card,
     question or lesson that promises an outcome ("will", "won't", "always", a sure result).
4. **Read the whole hexagram, not one phrase.**
   - 10's six lines are six ways of walking near danger. The lesson should sit at the centre of
     what the hexagram is about (judgment, Tuan, Great Image, and the spread of the lines).
   - It should not rest on a side image.
5. **Check the user's own reading when one is recorded** (the `source` fields sometimes quote
   the user). Don't overrule it. Deepen it.

## Rules the proposals must keep

- **Plain words, no mannered prose.** Use the literal phrase when there is one.
  - The lesson is at most two short lines, like "Near a temper,\nstay steady inside."
  - A meaning card is two short lines.
- **Newcomers must get who does what.** The hook describes the viewer's situation, and the lesson
  should answer that hook.
- **Banned in any copy:** oracle, divination (and "divine", "divining"), fortune, prediction,
  mystical, magical.
- **Findings (lines lessons with a readout)** are upper case.
  - Two lines of at most 30 characters each.
  - Start with "LINE N:", or with "AT THE BASE:" for line 1 and "AT THE TOP:" for line 6.
  - The first line gives the image. The second gives the reason, from the Small Image or Wang Bi.
- **Readout lines carry Wang Bi's reading.** Lines 1 and 6 have no position of their own, so
  don't count them in position arguments.
- **Character lessons** keep their animation. A new lesson text must still fit the animation
  story in its `source`.
- **The user owns the wording.** Proposals are options. Rate honestly: don't propose a change for
  an 8 or above just to have one.

## Per short, report

- `depth` (1–10): how far the current lesson gets past surface conduct to the hexagram's intent
  and reason. 10's "stay quiet" would score 5 and "stay steady inside" 8.
- `issues`: short strings. Name the problem: surface-only, wrong reading, side image, promises an
  outcome, hook doesn't lead to the lesson, finding lacks reason.
- `lesson`: if depth < 8, a proposed lesson (else null). Include `basis`: the classic text it
  rests on, with an English gloss.
- `finding`: for `lines` lessons with a readout, the line and finding you'd use. Take the
  `lineAudit` suggestion when it is good, and add the reason line from the Small Image. Null if
  the current one already pairs image and reason.
- `promises`: meaning cards, question or lesson text that promise an outcome, each with a
  suggested rewrite.
