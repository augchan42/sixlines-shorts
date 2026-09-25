# What makes a good lesson

What three runs of drafting and critique taught us about the one-sentence lesson after
the drop (ADR-SHORTS-002). The data:

- `series/critic/lessons/result.json`: run 1, 170 scored drafts (`scripts/workflows/lesson-drafts.js`)
- `series/critic/lessons/result-run2.json`: run 2, 81 scored drafts (`scripts/workflows/lesson-redo.js`)
- `series/critic/lessons/result-run3.json`: run 3, 45 candidates, each scored by two critics (`scripts/workflows/lesson-candidates.js`)

Every draft keeps its text, kind, source, round, score and the critic's feedback. The
scores come from a model critic, so they filter; the author's calls are the standard.

## The author's calls

- Liked: "Look like a guest, / not an inspector." (20, line 4). Concrete, a little funny,
  true to the line.
- Rejected as too cryptic: "Its shape: / a watchtower." (20).
- Rejected as misleading: "The tiger's tail: / it does not bite." (10). The book says you
  tread on the tiger's tail and it does not bite; the sentence drops the treading, so a
  newcomer can't tell who does what. A lesson has to be clear to someone who has never
  read the text, not only true to it.
- Approved: "Unseen water / under the earth." (7), "Friends at lunch, /
  holding together." (8, painting).

## What scored well

**Line lessons.** The line texts are the book's most concrete, specific material.

| Kind | Drafts, runs 1-2 | Average | 8+ | Candidates, run 3 | Average | 8+ |
|---|---|---|---|---|---|---|
| line | 98 | 7.1 | 34 | 29 | 7.2 | 12 |
| judgment | 68 | 6.1 | 10 | 8 | 6.8 | 2 |
| painting | 12 | 6.6 | 4 | - | - | - |
| lines (trigrams) | 73 | 5.9 | 8 | 8 | 5.9 | 0 |

**An object or an act, with its point.** What rose from 4-5 to 8-9 went from a principle
to a thing happening:

| Before | Score | After | Score |
|---|---|---|---|
| Study the past, / build character. | 4 | Cap the calf's / horns early. | 8 |
| The best use of / power: restraint. | 4 | Power in the toes: / don't kick yet. | 9 |
| Time to settle / disputes. | 4 | A huge house, / and no one home. | 9 |
| If not upright, / don't go ahead. | 4 | Did nothing wrong, / still lost the ox. | 9 |
| Make the penalties / clear to all. | 5 | Warn clearly, / then bite. | 8 |
| Three days before, / three days after. | 5 | Plan three days, / check three days. | 8 |
| The great departs, / the small arrives. | 5 | The good leave, / the petty move in. | 8 |

**Something the short didn't already say.** A lesson that turns the short's point
(a cost, a limit, a surprise) scored higher than one that agrees with it.

## What scored badly

- **Repeating the short.** The most common complaint: 53 of the drafts under 8. The critic
  compares with the hook, meaning and question; so should the writer.
- **Abstract or a slogan.** "Following always costs something." "Great power keeps off
  wrong paths." True, and forgettable. No draft at 8+ was called cryptic, and only one
  was called abstract.
- **An image with no point.** "Wine and rice through a window." "A tree grows inside the
  earth." "A lake sits up on a mountain." The watchtower problem: the viewer gets a
  picture and no idea what it means. Trigram lessons fall into this most, since the
  picture already shows the two images.
- **The book's own jargon.** "The great departs", "verdict", "cross the great river",
  "Southwest, yes. Northeast, no." Meaningless without the book.
- **Advice that reads badly out of context.** "Didn't cause it? Don't medicate." (medical
  advice); "A good time to take a wife." (a horoscope).
- **A vague "it".** "You caught it. Don't cling to it." What was caught?

## The critic

- In run 3, two critics disagreed on 18 of 45 candidates, never by more than 1. The same
  text scored 6 in one round and 7 in another. Treat 7.5 and 8 as the same.
- A loop that keeps each lesson's latest draft can make it worse (34 went from 8 to 4 when
  it was redone only for variety). A loop that keeps each lesson's best draft can undo a
  neighbour's change of kind. Asking for several different candidates at once, scored
  by two critics, worked better than rewording one draft round after round.
- The critic judges each lesson alone. It cannot see what watching 64 back to back is
  like; the author judges that.

## Variety

The best-scoring lesson for each hexagram (`series/critic/lessons/best-table.md`) makes
40 of 64 line lessons, with runs of up to 7 in a row. The author decided (2026-09-25)
this does not matter: the shorts are posted in any order, so the rule of no three of a
kind in a row is dropped. Where a hexagram gives no clear sentence, the short shows its
artwork or trigram imagery instead of forcing a lesson.

## The critic scored the tiger 9

The critic, given the tiger lesson as an approved example, scored it 9. A critic that
checks truth to the text does not catch a sentence that is true but misread. So every
lesson now also goes to cold readers, who see only the sentence and the picture
(`scripts/workflows/lesson-cold-read.js`).

## Character lessons (Blender)

A new kind, drawn by `blender/character.py` from the characters' real stroke outlines
(Make Me a Hanzi, fetched by `scripts/character.mjs`). Research on the early forms of all 64
is in `series/critic/characters/research.md`; 21 fit at 4 or 5.

- First try: tubes along the stroke centre lines. The author: "looks like it was drawn by a
  kid". Now each stroke is its real outline as a neon tube over a dark glass body, like a
  Hong Kong neon sign. The author: "I think it's ok."
- A stroke can lie on the floor, rise as a wall, stand up and be pressed flat (`--stand`), or
  fill the walls and spill over them (`--spill`). The camera starts beside the strokes, where
  they read as things, and cranes up to look down, where they read as the character.
- 困 (47): a tree stands, walls rise round it, it is pressed flat. Low camera.
- 益 (42): a bowl rises, water fills it and spills over the far rim. High camera, so the
  inside of the bowl shows. From the low camera the bowl was a flat strip.
- The rest of the 4s and 5s, each with its settings in `series/characters.json`. The author:
  "Love this series so far."
  - 蠱 (18): worms swarm up out of a shut bowl. Only the rim rises, so the worms stay in view.
  - 井 (48): four low glass beams and a pool that ripples on every beat.
  - 屯 (3): a sprout pushes up through the floor in three strains (`--grow`).
  - 恆 (32), 明 (36): a moon between the walls goes through its phases (`--moon`,
    `--phases`); 明's stops at a crescent that stays lit.
  - 鼎 (50): the legs rise, a fire is lit, the bowl drops onto them (`--drop`, `--pool`).
  - 解 (40): the horn lifts free and hovers (`--lift`).
  - 需 (5): neon rain falls on a standing figure, then the cloud comes down (`--rain`).
  - 臨 (19): a figure leans down and small squares light up under it (`--lean`, side camera).
  - 艮 (52): a figure turns round to look back and holds still (`--turn`).
  - 剝 (23): a knife stands by a block and the block's pieces fall off (`--shed`).
  - 旅 (56): travellers walk toward you in four hops (`--march`).
  - 兌 (58): two lines float up out of an open mouth (`--lift`).
  - 比 (8): a second figure walks up from behind to stand beside the first (`--join`).
  - 同 (13): everything inside a frame lifts at once (`--lift`, side camera).
  - 既 (63): the meal done, the figure turns its back on the bowl (`--turn`).
  - 復 (24): a foot walks back toward the passage (`--march` with a negative distance).
  - 履 (10): a figure's foot is set down one stroke at a time (`--drop`).
  - 頤 (27): what is inside an open jaw spills over its rim (`--spill`).
- What went wrong on the way: from a low camera, bowls read as strips and figures hid what
  was behind them (fixed with the high camera and `--zoom`); a big moon filled the frame; a
  thing turning about the character's centre swung across its neighbours (now it turns about
  its own middle).
