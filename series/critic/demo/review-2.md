# Demo short: second review of the recommended plan

Reviewed: the "Recommended plan" in `review.md` (52 s, vertical, hexagram 18, music and burned-in
text). Checked against the brief in `docs/notes/2026-09-25-demo-walkthrough-plans.md`, the 18 strip
(`out/characters/strips/18.jpg`), `series/renders/specials/character-18.json`, and
`sixlines-ios/gallery/matrix/reading-matrix-18-18.png`.

## Scores as written

| Criterion | Score | Why |
|---|---|---|
| Newcomer gets what the app does and how it differs | 6 | The app order (ask, cast, read, check, record) comes across. But the opening question is a binary choice, and the lesson that follows ("Clean it out") reads as the app picking "fix". That looks like the thing card 2 says the app doesn't do. |
| The judgment idea is clear | 6 | Cards 2-3 state it, and card 9 shows it. Card 9 gets only 6 beats, and card 8, the only card that names the tradition, gets 2. |
| Fun to watch as a short | 6 | 10.2 s of text over code rain before any picture. That is a slow hook for Reels. The middle (hexagram, then 蠱) is strong. |
| Neon Blender pieces earn their place | 8 | The hexagram marks the cast, and 蠱 (bugs in a bowl) is the best shot. But nothing tells a newcomer what the drawing shows, so the picture doesn't connect to "rot". |
| Finishable | 8 | Every Blender clip, the music settings and the end card exist. About 20 s of new simulator recording. The fallback for landing on 18 is honest. |
| Wording | 6 | Plain, and no banned words. Card 8 breaks the plan's own 4-beat minimum. "The I Ching is not a yes-or-no answer" is loose (a book is not an answer). Card 1 is covered below. |

**Overall: 6.5. Don't make it as written.** The changes below are small.

## Card 1 against card 2

"Fix the old project, / or start over?" is strictly an either-or question, not a yes-or-no one.
To a viewer it is the same thing: a choice between two options, with the app expected to pick. It
undercuts card 2 in three ways:

1. Card 2 then tells the viewer that the question they just read isn't the kind the app answers.
2. Card 4 ("Ask a real question.") then suggests the first question wasn't a real one, yet the Ask
   screen shows that same question being typed.
3. The 18 lesson "Found rot? Clean it out." reads as the answer "fix it", so the short shows the app
   doing what card 2 says it doesn't.

Fix: open with an open question that needs judgment, not a choice: "What should I do / about the
old project?"

## Timing check at 82.5 bpm (1 beat = 0.73 s)

A card is readable if it is on screen for at least 4 beats (2.9 s) and has 8 words or fewer.

| # | Card | Beats | Words | Readable | Plain | True |
|---|---|---|---|---|---|---|
| 1 | Fix the old project, / or start over? | 6 (typed) | 7 | yes | yes | yes. It undercuts card 2 (see above) |
| 2 | The I Ching is not / a yes-or-no answer. | 4 | 8 | just | loose | a book is not "an answer" |
| 3 | It is practice / in judgment. | 4 | 5 | yes | yes | yes |
| 4 | Ask a real question. | 8 | 4 | yes | yes | implies card 1 wasn't a real question |
| 5 | Six lines. / One of 64 situations. | 6 | 6 | yes | yes | yes |
| 6 | 18 · Work on the Decayed / Found rot? Clean it out. | 17 | 4+5 | yes | yes | yes. Nothing says what the drawing is |
| 7 | Decay is not the end. / It is work to do. | 6 | 10 | just | yes | yes (from goalData) |
| 8 | Read the Confucian way: / Ten Wings, Wang Bi. | **2** | 7 | **no** (1.5 s) | yes | check that the Wang Bi commentary is in the recorded view |
| 9 | Every reading says / what would prove it wrong. | 6 | 8 | yes | yes | check that every reading type has it, not only Gua readings; the site says "Each reading" |
| 10 | You decide. / Write down what happened. | 4 | 6 | yes | yes | yes. Too short for the payoff line |
| 11 | Six lines reveal the moment. / sixlines.day | 9 | 5 | yes | yes | site tagline |

## Changes

1. **Card 1:** replace with "What should I do / about the old project?" Remove card 4, which is no
   longer needed.
2. **Show the app earlier.** Put cards 2-3 over the live Ask shot (question typed, coins tossed)
   instead of over more code rain. The app is on screen from 4.4 s instead of 10.2 s.
3. **Cards 2-3:** "The app won't answer / yes or no." then "It trains / your judgment."
4. **Explain the drawing.** Split the 17 beats of the 蠱 shot into three cards: "18 · Work on the
   Decayed" (4 beats), "The name is a picture: / bugs in a bowl." (5), "Found rot? / Clean it out."
   (8, the approved lesson over the held character).
5. **Card 8:** give it 5 beats of its own over the Wang Bi scroll: "Commentary: Wang Bi / and the
   Ten Wings." Card 7 drops to 5 beats.
6. **Card 9 (the key beat):** 8 beats. "Each reading lists / what would prove it wrong." If only Gua
   readings have it, use "The reading lists / what would prove it wrong."
7. **Card 10:** 6 beats. "You decide. / Then write down what happened."

## Changed timeline (71 beats = 51.8 s)

| # | Beats | Time | Picture | Text |
|---|---|---|---|---|
| 1 | 0-6 | 0.0-4.4 | Code rain, question types in | What should I do / about the old project? |
| 2 | 6-10 | 4.4-7.3 | Live: Ask screen, question in the field | The app won't answer / yes or no. |
| 3 | 10-14 | 7.3-10.2 | Live: coins tossed | It trains / your judgment. |
| 4 | 14-20 | 10.2-14.5 | Blender hexagram-011001-6b | Six lines. / One of 64 situations. |
| 5 | 20-24 | 14.5-17.5 | Blender character-18-17b | 18 · Work on the Decayed |
| 6 | 24-29 | 17.5-21.1 | same | The name is a picture: / bugs in a bowl. |
| 7 | 29-37 | 21.1-26.9 | same, 蠱 holds | Found rot? / Clean it out. |
| 8 | 37-42 | 26.9-30.5 | Live: reading, Judgment | Decay is not the end. / It is work to do. |
| 9 | 42-47 | 30.5-34.2 | Live: Wang Bi commentary open | Commentary: Wang Bi / and the Ten Wings. |
| 10 | 47-55 | 34.2-40.0 | Live: "what would prove this wrong" | Each reading lists / what would prove it wrong. |
| 11 | 55-61 | 40.0-44.4 | Live: Journal, reading saved with a note | You decide. / Then write down what happened. |
| 12 | 61-70 | 44.4-50.9 | Blender endcard-join-011001-9b, then credit | Six lines reveal the moment. / sixlines.day |

Every card gets 4 beats or more and 8 words or fewer. No banned words. The work is the same as
before: one simulator session, the same three Blender clips, and two more Remotion text cards.

## Scores after the changes

| Criterion | Before | After |
|---|---|---|
| Newcomer | 6 | 8 |
| Judgment idea | 6 | 8 |
| Fun | 6 | 7.5 |
| Neon pieces | 8 | 9 |
| Finishable | 8 | 8 |
| Wording | 6 | 8.5 |
| **Overall** | **6.5** | **8** |

With these changes, make it. Before recording, check two facts: the Wang Bi commentary is visible
in the recorded reading, and which reading types list what would prove them wrong.
