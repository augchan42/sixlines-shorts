# Readout line audit — 27 September 2026

The user approved a new readout style on 22 (Grace). Only line 6 turns amber, with the finding
"AT THE TOP: PLAIN WHITE." The line's own statement, 上九，白賁，无咎, carries the short's
lesson "Plain is the best adornment." The user: "I like this style much better. ... not every
hexagram has strong lines like this. So we'll probably need to do an audit to see which ones are
best suited to this style."

## Method

`scripts/readout-line-audit.py` gathered each readout's copy, current finding and six line
statements with Wang Bi's notes (`series/critic/readouts/line-audit-input.json`). Three agents
judged 11 or 12 readouts each (`line-audit-a/b/c.json`). For each readout they gave:

- a 1-to-10 fit for the best line against the current lesson
- a finding in the new style
- a verdict

`scripts/readout-line-audit-merge.py` merged the parts into `line-audit.json`. It also checked
every chosen line against the 【經】 text in chinese-classics-reference's Zhouyi zhushu. All
chosen statements match, including 33 line 1 (遯尾，厲).

The input source had errors. In bookofchanges-site's zhushu data, several entries hold the Small
Image (小象) or Wang Bi's note in place of the line statement: 6, 10, 13, 14, 17, 31, 33, 34,
39, 53 and 54. The agents worked from the real statements. That repo is not changed here.

## Results

**A. Switch; the line carries the current lesson (fit 8–9)**: 12 shorts.

| # | Lesson | Line | Proposed finding |
|---|---|---|---|
| 1 | Heaven never takes a day off. | L3 君子終日乾乾，夕惕若厲 | LINE 3: TIRELESS ALL DAY, / STILL ALERT AT NIGHT. |
| 3 | Don't push yet. Win helpers first. | L1 磐桓，利居貞，利建侯 | AT THE BASE: HOLD BACK. / SET UP HELPERS. |
| 10 | Beside the strong, be courteous. | L4 履虎尾，愬愬，終吉 | LINE 4: ON THE TIGER'S TAIL, / CAREFUL. IT ENDS WELL. |
| 13 | Join on principle, not on kinship. | L2 同人于宗，吝 | LINE 2: FELLOWSHIP ONLY / WITH THE CLAN. REGRET. |
| 14 | Lead by trust, not force. | L5 厥孚交如，威如，吉 | LINE 5: TRUST, GIVEN AND / RETURNED, WITH DIGNITY. |
| 16 | One clear voice moves the crowd. | L4 由豫，大有得。勿疑，朋盍簪 | LINE 4: IT STARTS HERE. / NO DOUBT. FRIENDS GATHER. |
| 26 | Store up strength, then use it. | L3 良馬逐…曰閑輿衛，利有攸往 | LINE 3: DRILL THE CHARIOT / DAILY. THEN SET OUT. |
| 33 | Go while you still can go freely. | L1 遯尾，厲 | AT THE BASE: THE TAIL / OF THE RETREAT. DANGER. |
| 34 | Be strong only in what is right. | L3 羝羊觸藩，羸其角 | LINE 3: THE RAM BUTTS / THE FENCE. HORNS CAUGHT. |
| 54 | Wrong place? Don't push. | L4 歸妹愆期，遲歸有時 | LINE 4: OUT OF PLACE, SHE WAITS. / HER TIME WILL COME. |
| 60 | A lake holds only so much water. | L3 不節若，則嗟若 | LINE 3: NO LIMIT SET, / THEN SIGHING. |
| 64 | Almost across, the fox gets wet. | L1 濡其尾，吝 | AT THE BASE: THE FOX / WETS ITS TAIL. |

**B. Switch, weaker (fit 7)**: 8 shorts. The link holds but takes a step.

| # | Lesson | Line | Proposed finding |
|---|---|---|---|
| 2 | Lead and get lost. Follow and arrive. | L3 含章可貞，或從王事，无成有終 | LINE 3: DOES NOT START IT, / YET SEES IT THROUGH. |
| 25 | Do what's right, not what pays. | L2 不耕穫，不菑畬 | LINE 2: DON'T PLOW / FOR THE HARVEST. |
| 35 | Shine, don't push. | L6 晉其角 | AT THE TOP: ADVANCING / WITH THE HORNS. |
| 38 | Apart, but still answering. | L2 遇主于巷，无咎 | LINE 2: MEETS HIS LORD / IN A SIDE STREET. |
| 52 | Stop when it's time to stop. | L6 敦艮，吉 | AT THE TOP: STILL, STEADY, / TO THE END. |
| 55 | At your fullest, light each corner. | L6 豐其屋，蔀其家…闃其无人 | AT THE TOP: A GREAT HOUSE, / SCREENED. NO ONE INSIDE. |
| 57 | Bend only to what is right. | L6 巽在牀下，喪其資斧 | AT THE TOP: BENT UNDER THE BED, / HE LOSES HIS AXE. |
| 59 | Bring them back to the centre. | L5 渙汗其大號，王居无咎 | LINE 5: THE KING CALLS OUT, / AND STAYS WHERE HE IS. |

**C. A line fits only with a new lesson**: 7 shorts. In 20, 39, 46 and 49, the line would also
repair the hook-to-lesson break Codex found. These lesson changes are options.

| # | Hook | Current lesson | Line | Lesson the line supports |
|---|---|---|---|---|
| 20 | Deciding from behind a desk? | People watch how you prepare. | L4 觀國之光 | Go and see it for yourself. |
| 39 | Hit a wall? | Blocked? Look at yourself. | L5 大蹇，朋來 | Blocked? Ask for help. |
| 49 | Making a big change nobody believes in? | For a revolution, a new calendar. | L3 革言三就，有孚 | Talk it over until it's trusted. |
| 46 | Growing slower than you want? | Go see someone above you. | L5 貞吉，升階 | Climb one stair at a time. |
| 40 | The pressure's finally off? | Out of danger? Then don't linger. | L5 君子維有解 | (untying the knot) |
| 41 | Having less than before? | Two small baskets are enough. | L4 損其疾，使遄有喜 | (cut what ails you) |
| 6 | Fighting over something you're right about? | Take it to a fair judge. | L6 或錫之鞶帶，終朝三褫之 | A win by fighting won't stay won. |

**D. Keep the current finding**: 7 shorts (4, 9, 17, 31, 37, 45, 53). These lessons are about the
whole shape, such as 53's goose climbing step by step and 31's three answering pairs, or no line
is stronger than the finding they have now (45 scored 6). The hook-to-lesson break on 17 is not
fixed by any line. It needs a copy change: the lesson could use the Image, "When it gets dark, go
in and rest", or the hook could change.

## Notes for the findings

- Some proposed findings need tightening before use. 16's "IT STARTS HERE." is unclear.
  57's bed and axe need the lesson to say why they matter.
- Plain translations of line images (the tiger's tail, the ram and the fence, the fox's tail)
  are the style that worked on 22. Findings that explain structure (IN/OUT, pairs) stay only in
  group D.
- 13, 25 and 33 lose Wang Bi's master line if they switch. That is fine. The Wang Bi lesson
  pins its own copy of 22's readout for its example (`series/explainers/wangbi-lesson.json`).
- Timing: every switched short gets the timed layout. The finding holds about 3.2 s alone and
  the lesson gets whole beats for 11 s (`src/lib/readoutAmber.ts`).
