# Depth review — 27 September 2026

The user, after 10 settled on "Near a temper, stay steady inside.": "let's do a review of the others
based on our learnings from 10".

## Method

`scripts/depth-review.py` gathered each short's copy and its hexagram's classic text from
chinese-classics-reference (`series/critic/depth/input.json`). The text covers the judgment, the
Tuan, the Great Image, and each line's statement, Small Image and Wang Bi note. The parser works
around the source's formatting gaps:
- untagged notes, 注云 notes and 疏-tagged statements
- Qian's and Kun's separate Small Image sections

`series/critic/depth/brief.md` sets the criteria from 10:
- the reason behind the image, not only the outward act
- findings that pair image and reason
- no promised outcomes
- the whole hexagram, not a side phrase

Four agents reviewed 15 or 16 shorts each (`part-a` to `part-d`).
`scripts/depth-review-merge.py` wrote `review.json` and checked:
- finding labels and line lengths
- banned words
- that every quoted Chinese phrase is in that hexagram's text

All proposals pass.

## Results

On the brief's scale, 10's "stay quiet" is 5 and "stay steady inside" is 8. At that bar, 52 of the
63 lessons score below 8. The reviewers apply the bar strictly. Many 6s and 7s are sound lessons
that only lack the text's reason, so the triage below matters more than the count.

At 8 or above, keep as they are: 7, 13, 22, 25, 31, 32, 34, 47, 51, 53, 61.

### 1. Hook and lesson don't meet, or the reading is wrong (fix first)

| # | Now | Proposed | Rests on |
|---|---|---|---|
| 64 | Almost across, the fox gets wet. | Almost across? / Keep care to the end. | Tuan 不續終也 (it did not keep on to the end) |
| 49 | For a revolution, a new calendar. | Go over the change / until it is trusted. | L3 革言三就，有孚 (the change talked over three times, then trusted) |
| 46 | Go see someone above you. | Don't rush the climb. / One step, then the next. | Tuan 柔以時升; Image 積小以高大 (pile small into great) |
| 60 | A lake holds only so much water. | Set limits / you can keep. | 苦節不可貞 (bitter limits can't be kept) |
| 37 | Home in order, the rest follows. | Order at home / starts with you. | L6 反身之謂也 (it turns back on yourself) |
| 38 | Apart, but still answering. | Lower your guard. / They may be an ally. | L6 匪寇婚媾 (not a raider but a partner) |
| 6 | Take it to a fair judge. | A win by fighting / earns no respect. | L6 以訟受服，亦不足敬也 |
| 9 | Small can hold big, for a while. | Held back? Don't force it. / Keep to your own path. | L1 復自道 (returns by its own path) |
| 40 | Out of danger? Then don't linger. | Out of danger? / Forgive, and move on. | Image 君子以赦過宥罪 (pardon faults) |
| 57 | Bend only to what is right. | People change slowly. / Say it again, gently. | Image 君子以申命行事 (repeat the charge) |
| 20 | People watch how you prepare. | Go look at your people. / They show how you lead. | L5 觀我生…觀民也 |

For 37, the reviewer's own lesson was "Rules won't hold a home." That runs against line 3, which
prefers strict to lax. The table uses the reviewer's other wording, "Order at home starts with
you."

The hook is also off in 8, 15, 17, 30, 39, 42 and 52 (see `review.json`). 8 and 42 are character
lessons, so a new text must still fit the animation.

### 2. Promised outcomes (text only, 17 cards and lessons)

| # | Where | Now | Rewrite |
|---|---|---|---|
| 2 | lesson | Lead and get lost. Follow and arrive. | (see tier 1 or 3) |
| 6 | meaning 2 | Pushing to the end costs you. | Don't push it to the end. |
| 7 | lesson | Lead upright, the ranks fall in. | Lead upright, so the ranks can be. |
| 8 | meaning 2 | Late arrivals miss out. | Don't be the last to come. |
| 15 | meaning 2 | No one stops the quiet ones. | Quiet work still counts. |
| 16 | lesson | One clear voice moves the crowd. | Move with them, not at them. |
| 18 | meaning 2 | Rushed repairs don't hold. | Plan before, check after. |
| 21 | meaning 2 | It won't clear by itself. | Don't wait for it to clear itself. |
| 24 | meaning 2 | Rest. Only rushing stops it. | Rest first. Don't rush it. |
| 25 | meaning 2 | Stop faking, and it works. | Stop faking. Mean what you do. |
| 37 | lesson | Home in order, the rest follows. | (tier 1) |
| 47 | meaning 2 | Words fail here. Actions don't. | Words fail here. Let actions speak. |
| 53 | meaning 2 | Slow growth lasts. | Grow by steps, not leaps. |
| 54 | meaning 2 | This part won't last. | Think of how this ends. |
| 57 | meaning 2 | Quiet and steady gets through. | Keep it quiet and steady. |
| 58 | meaning 2 | Joy kept alone dries up. | Joy is meant to be shared. |
| 62 | meaning 2 | Small done well ends well. | Do the small things well. |

Some of these are mild. For example, "Slow growth lasts" is the Tuan's own claim. Rewrites should
keep the card's bite.

### 3. Adds the reason, optional

These scored 6 or 7. Their lessons are right but give the act without the text's reason: 3, 4, 11,
12, 14, 18, 19, 21, 23, 24, 26, 27, 28, 29, 33, 35, 36, 41, 43, 44, 45, 50, 54, 55, 56, 58, 59, 62,
63. `review.json` has a proposal for each.

### Proposals not taken

| # | Proposal | Why not |
|---|---|---|
| 1 | "Don't wait for a sign." | "Sign" leans toward reading omens, which Six Lines is not. |
| 2 | (reworded lesson) | Longer than the current lesson and no clearer. |
| 3 | (reworded lesson) | Longer than the current lesson and no clearer. |
| 5 | "Rest, ready, not worried." | Awkward, and it is a character lesson. |
| 48 | "Be that steady." | Adds little. |

29's "Hold firm inside" repeats 10's lesson.

## Findings

Every readout proposal pairs the line's image with a reason line from its Small Image or Wang Bi's
note, as on 10. Where a reviewer chose a different line from the line audit, the reason is in the
note:
- 33: the audit's line 1 says "don't set out", which reads against the lesson.
- 52: line 4 answers the overthinking hook.
- 54: the audit's "HER TIME WILL COME" promised an outcome.

22's optional reason line, "IT KEEPS TO WHAT IT IS.", is offered only.
