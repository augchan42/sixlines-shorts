# Codex review — 27 September 2026

## Scope

Read all 64 hooks, meaning cards, questions and lesson sentences; compared those fields with all 64 render records. They match. Read the review guide, local board data and relevant rendering code. Inspected frames extracted from the full-quality renders of 18, 22, 29, 47 and 64. This is a text review and visual spot check, not a completed motion, music or full Wang Bi lesson review. Live board verdicts were not retrieved. Subsequent change: corrected 64’s finding and re-rendered the short; see below.

The user confirmed during this review: **keep one point throughout each short; keep advice, soften guarantees; readouts may assume viewers have watched the Wang Bi lesson first**.

## Confirmed issues

- **Multiple amber lines:** 22 at 24 seconds shows L2 and L5 in amber together. `Readout.tsx` highlights every member of `mark` at the same time. The same implementation affects 4, 13, 22, 25, 33, 37, 38, 40, 41, 45, 53, 54 and 57. This conflicts with the guide's one-line-at-a-time rule.
- **64’s wording corrected:** replaced “ALL SIX OUT OF PLACE. ALL ANSWER.” with “LINES 2–5 OUT OF POSITION. / ALL THREE PAIRS ANSWER.” This matches the table and the Wang Bi lesson. Verified the four interior positions and all three answering pairs from the line data; inspected the new render at 25 seconds to confirm the two-line finding fits.
- **The guide's count is wrong:** 57 shorts use “says:”. Searching for a literal space before “says:” yields 44 because another 13 put it after a newline.
- **End-card rollout is incomplete:** render records contain 13 reference cards and 51 older cards. The settled design and rollout status should be stated separately. Metadata alone does not establish the visible punctuation in every old clip.

## Text requiring revision

Scores below judge only whether the hook and final lesson develop one point. They are editorial judgments, not overall video scores. Under 8 triggers revision under the guide.

| Short | Score | Problem |
|---|---:|---|
| 01 | 7 | Starting without a sign becomes working without a day off. Initiation and constant effort differ. |
| 04 | 7 | Repeated requests for an answer become whether teachers pursue students. The connection is unstated. |
| 08 | 7 | Urgency to join becomes choosing whom to join. Make that choice part of the setup. |
| 17 | 4 | Rest after work becomes earning followers by following. |
| 18 | 7 | The warning about rushed repairs disappears into “Clean it out.” Preserve the need for a thorough repair. |
| 19 | 6 | Preparing for a downturn becomes caring for subordinates. |
| 20 | 4 | Going out to observe becomes being observed by others. The direction reverses. |
| 22 | 7 | Making a decision becomes preferring plain decoration. Simpler slides do not resolve the decision. |
| 24 | 6 | Recovery and rest become correcting a misstep. |
| 29 | 7 | Taking the next step through repeated problems becomes keeping one's word. |
| 30 | 6 | Sustaining oneself after burnout becomes moral correctness. |
| 39 | 6 | Asking others for help becomes examining oneself. Explain how these belong to the same response. |
| 42 | 6 | Taking an opportunity becomes sharing its benefits. |
| 46 | 7 | Accumulating small steps becomes seeking someone senior. |
| 48 | 4 | Reaching a resource becomes the resource's permanence. |
| 49 | 4 | Earning trust in change becomes introducing a new calendar, without explaining the connection. |
| 57 | 6 | Repeating a message becomes choosing what to submit to. |

Other shorts have no clear hook-to-lesson break in this pass. That does not certify their historical accuracy, readability, motion or sound.

## Advice to soften

The user confirmed that advice should stay, but guarantees should be softened. These sentences claim that conduct determines an outcome:

- 10: “Act well and it won’t flare” places control of a temperamental boss's reaction with the viewer.
- 25: “Stop faking, and it works” promises success from sincerity.
- 15: “No one stops the quiet ones” is an unsupported absolute.
- 02: “Lead and get lost. Follow and arrive” can read as universal advice rather than advice for this situation.

Revise these without promising an outcome controlled by other people or circumstances.

## Readout audience — settled

The user accepts the Wang Bi lesson as prior learning for the readouts. IN/OUT, CENTRE, ANSWER and MASTER therefore do not need to be explained again in every short, provided the lesson teaches them. Do not deduct points simply because a readout assumes that knowledge. Internal contradictions still count as issues; 64’s finding has now been corrected.

## Changes to the review method

- Keep the approved exemplars as design references. A defect in one exemplar is not automatically present in all shorts of that style.
- Read each readout's finding, trigram labels and master gloss alongside its lesson sentence. Those vary too.
- Check all 13 multi-line readouts after correcting their shared implementation.
- Review the music at each selected excerpt: 18 tracks use 30 distinct track/start pairs. A track can change mood between sections.
- Review variable text at its actual display duration. Identical templates can still yield different readability.
- The lesson appears late in these shorts, before the end card; “middle third” is an unreliable seek instruction. Derive excerpt boundaries from the render props and series plan.

## Checks passed

- 35 readouts, 15 scene lessons and 14 character lessons in the render records.
- 18 distinct music tracks.
- No render tempo exceeds 120 bpm.
- No listed banned word found in `series/copy.json`.
- Hook, meaning, question and lesson sentences match between source and render records for all 64 shorts.

## Remaining media review

Full exemplar playback; all 29 unique lesson animations; music excerpts in context; the complete Wang Bi lesson. Frame inspection cannot establish motion quality or musical fit.
