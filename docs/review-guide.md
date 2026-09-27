# Reviewing the Sixty-Four Records

How to review the 64 shorts and the Wang Bi lesson without watching 64 × 30 s in full. Written
2026-09-27 for the user and for another reviewer (Codex), after the user asked: "is there an
efficient way to review the above? maybe some exemplars of specific examples, or what is the
best way to go, maybe a review guide".

Verdicts and notes go on the review board: https://claude.ai/artifact/Dms7KJ2SULdsmBhUzsGyym

## The idea: review what varies, once per kind

Every short runs the same template: hook, hexagram build, meaning, plates, question, lesson,
end card. Reviewing all 64 end to end repeats the same judgment 64 times. What actually
differs from short to short:

| What varies | How many kinds | Review it by |
|---|---|---|
| The copy (hook, meaning, question, lesson) | 64 | Reading, as text, in one sitting |
| The lesson picture | 35 readout, 15 scene, 14 character | Readout once; each scene and character once, since each is a new picture |
| The music | 18 tracks | Listening once per track |
| The end card | 3 moves (join, flip, snap) | Done: 13 shorts checked on the new card |
| The template itself | 1 | Three exemplars, watched in full |

## Order of work

1. **Watch the exemplars in full (5 minutes).** These passed the user's final approval on
   2026-09-26 and are the benchmark for their style:
   - Readout: **64** (After Completion... Before Completion)
   - Character: **47**
   - Scene: **29** (the abyss)
   - Music: **2** (Kun), the user's favourite for its track.
   Judge each rubric line below on these. Anything wrong here is wrong in every short of that
   style, so note it once as a style note, not 35 times.
2. **Read all 64 as text (15 minutes).** In `series/hexagrams.json`, per short: hook →
   meaning → question → lesson. Check that the lesson answers the hook. Astra found this
   broken on 18 and 30. Put each finding on that short's card on the board.
3. **Scan the pictures that are unique (20 minutes).** Skip the readout shorts after 64,
   since they share one device. For the 15 scene and 14 character shorts, watch only the
   lesson section, about the middle third.
4. **Listen once per track (10 minutes).** Mood must match the hexagram: dark hexagrams get
   dark sections. Tracks shared by several shorts only need hearing once, then a check that
   each hexagram on it suits the mood.
5. **The Wang Bi lesson (4 minutes).** Watch it in full. It is the one piece with a different
   look and sound.

That is about 55 minutes for the whole series.

## Rubric

Score each line 1 to 10. Anything under 8 gets a note with what to change (the user's rule:
"anything lower than an eight, then redo").

- **Clear to the intended viewer.** Hooks and lesson sentences should be understandable to a newcomer. Readouts may assume the viewer has watched the Wang Bi lesson first; their technical terms do not need to be explained again in each short.
- **The loop closes.** The lesson answers the hook, not a new idea.
- **One takeaway.** Not two competing lines.
- **Plain copy.** Literal phrases, no mannered prose, 1-2 sentences per screen.
- **English beside Chinese.** Every Chinese character on screen has English near it.
- **One amber line.** Amber marks the one line to look at, one at a time. Green frame, cyan
  prompt, blue only to explain a point.
- **Calm motion.** No punch, shake or sway over hexagrams, trigrams or lessons.
- **Music fits the mood,** at or under 120 bpm.
- **End card.** REVEAL THE MOMENT with no period, then sixlines.day.

## Settled: don't reopen

The user has already decided these. A reviewer who disagrees should say so in one line, not
score against them:

- The end card stays REVEAL THE MOMENT + sixlines.day. No "I Ching app" ("very cheesy").
- Shorts show no app screens.
- Readouts may assume viewers have watched the Wang Bi lesson first (confirmed 2026-09-27).
- The hexagram reveal keeps its length. The plain build with its camera moves is the benchmark.
- No labels on bars, no literal effects (lake, neon icon signs), no ~DISNEYFAN credit.
- Banned in our copy: oracle, divination, fortune, prediction, mystical, magical (and 预测,
  占卜, 算命, 神諭). App screen glosses are exempt.
- Six Lines is for honing judgment (Confucian, Wang Bi, Ten Wings reading), not divination.

## Checks a script can do instead of a person

A reviewer with the repo can run these before watching anything:

- Banned words in `series/copy.json`.
- How many shorts use "X says:" in the meaning (44 of 64 on 2026-09-27; an open decision).
- Readout lessons that mark more than one line (`copy.lesson.readout.mark` in hexagrams.json).
  On 2026-09-27: 4, 13, 22, 25, 33, 37, 38, 40, 41, 45, 53, 54, 57. Watch these to see the
  amber moves one line at a time.
- Tempos over 120 in `series/renders/NN.json`.
- Which shorts still play an old end card with the period (no `endcardRef` in copy.json).

## Files

| What | Where |
|---|---|
| Full-quality shorts | `out/series/NN-name/share.mp4` |
| Board copies (540 px) | `out/review/media/short-NN.mp4` |
| Wang Bi lesson | `out/explainers/wangbi-lesson/share.mp4` |
| On-screen text | `series/hexagrams.json` (built from `series/copy.json`) |
| Tempo, track, end card, commit | `series/renders/NN.json` |
| Critiques and open decisions | `series/review/board.json` |

`out/` is not in git. Media stays on this machine.
