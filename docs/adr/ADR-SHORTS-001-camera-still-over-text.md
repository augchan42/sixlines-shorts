# ADR-SHORTS-001: The camera keeps still over text and moves on the accents

**Status:** Accepted 2026-09-25 · implemented on branch `series-64`
**Date:** 2026-09-25
**Code:** `src/lib/seriesMotion.ts`, `src/templates/Series.tsx`, `src/fx/Camera.tsx`
**Test:** `tests/series-motion.test.mjs`
**Related:** `docs/research/2026-09-24-transitions.md` (the cut and shake toolbox)

## Context

Every series short ran the same camera motion under the whole video: a constant sway from
the hook on (0.3), punches on each beat through the meaning lines (0.03) and the drop
(0.07, sway 0.6), and a 45 px shake over one beat at the drop. The author found the
shaking distracting at times. Most of that motion sat under text the viewer is trying to
read.

What the research says (web search, 2026-09-25):

- Editors treat shake as an accent for an impact or a hit, a few frames long, not a
  texture for a whole section. Constant handheld motion reads as unintentional and tires
  the viewer. ([Miracamp](https://www.miracamp.com/learn/davinci-resolve/video-stabilization-and-camera-shake),
  [PremiumBeat](https://www.premiumbeat.com/blog/excessive-handheld-ruins-a-shot/))
- Moving the frame while the viewer reads makes the text harder to read; motion should
  stop while there is text on screen.
- Large, repeated motion (zooms, bounces, shakes) can cause nausea and dizziness for
  people with vestibular disorders. WCAG asks that non-essential motion be avoidable.
  A video cannot honour a reduced-motion setting, so the motion itself has to be modest.
  ([web.dev](https://web.dev/learn/accessibility/motion),
  [CSS-Tricks](https://css-tricks.com/accessible-web-animation-the-wcag-on-animation-explained/))

## Decision

1. **Still while there is text to read.** No punch, and sway at most 0.15, during the
   hook, the meaning lines, the question and a lesson's sentence.
2. **Motion on the accents only:** the drop's shake, the beat punches over a lesson's
   picture (or the showcase), and the cuts.
3. **A shorter, lighter shake:** 30 px over half a beat at the drop, instead of 45 px
   over one beat.
4. **One place owns it.** `seriesMotion(plan, lesson)` returns the motion and shakes;
   `Series.tsx` passes them to `Camera`. A lesson's sentence starts over the last 5 beats
   of a moon clip, otherwise halfway through the lesson.

| From beat | Before (punch / sway) | After (punch / sway) |
|---|---|---|
| hook (-10) | 0 / 0.3 | 0 / 0.15 |
| hexagram | (hook values) | 0 / 0.3 |
| meaning | 0.03 / 0.4 | 0 / 0.15 |
| question | 0 / 0.2 | 0 / 0.1 |
| drop | 0.07 / 0.6 | 0.03 / 0.3 |
| lesson sentence | (drop values) | 0 / 0.1 |
| end card (cta) | 0 / 0.2 | 0 / 0.2 |
| shake at the drop | 45 px, 1 beat | 30 px, 0.5 beat |

The hexagram build keeps a 0.3 sway: it has no text and is the one long stretch where
movement helps.

## Consequences

- The shorts read calmer; the drop still hits, since it is now the only shake.
- Every short rendered before this commit has the old motion. The first before/after
  renders are 7, 8 and the Mid-Autumn special B. The full 64 get the new motion when they
  are next rendered, with their lessons.
- The whip cuts are unchanged.
- If the drop now feels flat, raise the drop's punch first, not the shake.
