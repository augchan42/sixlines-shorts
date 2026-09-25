# ADR-SHORTS-002: One lesson per short, drafted from the book and scored by a blind critic

**Status:** Accepted 2026-09-25 · drafting in progress
**Date:** 2026-09-25
**Code:** `scripts/lesson-input.mjs`, `scripts/series/lesson-rules.mjs`,
`scripts/lesson-check.mjs`, `scripts/workflows/lesson-drafts.js`
**Data:** `series/critic/lessons/input.json` (the texts each draft may use)
**Test:** `tests/lesson-rules.test.mjs`
**Related:** ADR-SHORTS-001 (motion during the lesson);
`docs/superpowers/specs/2026-09-24-sixty-four-records-series-design.md`

## Context

After the drop, each short showed app screens. Watched back to back, the 64 shorts need
something that changes from one to the next and that teaches something true about each
hexagram. The Mid-Autumn special (hexagram 20) showed what works: one concrete line from
the book, "Look like a guest, not an inspector." The painting drop was tried and the
author did not love it; paintings land only where the link is obvious.

## Decision

1. **One lesson after the drop:** a picture for about 5 s, then one plain sentence typed
   on screen for about 5 s. One video, one takeaway.
2. **Four kinds of lesson:**
   - `lines`: the hexagram splits into its two labelled trigrams; the sentence gives the
     Image.
   - `judgment`: the app's Judgment page; the sentence gives its point.
   - `line`: the hexagram with one line lit and labelled; the sentence gives that line's
     point. Needs a new template scene before render.
   - `painting`: a public-domain painting, only where `input.json` offers one (approved
     with lands 4 or more, or an alternative scored 9 with lands 5).
   A special may also use `moon` (a Blender clip under the sentence).
3. **Rules checked by code** (`lessonProblems`): the copy rules for the sentence (at most
   2 screen lines), a known kind, a line number for a line lesson, a painting only where
   offered, no repeat of the short's own copy, and no third lesson of the same kind in a
   row.
4. **Drafted and scored in a loop** (`scripts/workflows/lesson-drafts.js`): agents draft
   the 64 from the book's texts in four batches; a critic that sees only the brief scores
   each 1-10 and checks the cited text really says it. Anything under 8 goes back with
   the feedback, up to 5 rounds. The standard given to both: 7 "Unseen water / under the
   earth.", 10 "The tiger's tail: / it does not bite.", 20 line 4 "Look like a guest, /
   not an inspector."
5. **The author has the last word.** The result goes to the author as a table before
   anything renders.

## Consequences

- The 64 need re-rendering with their lessons; the current renders have the old
  showcase. Render in waves once the lesson table is approved.
- The `line` kind needs its scene; `judgment` needs the scrolled Library page captured
  for each hexagram.
- Scores come from a model critic, so an 8 is a filter, not proof. The author's review
  of the table is the real gate.
