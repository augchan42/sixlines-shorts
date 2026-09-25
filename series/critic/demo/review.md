# Demo walkthrough: critic review

Reviewed 2026-09-25 against docs/notes/2026-09-25-demo-walkthrough-plans.md, with two changes from
the author applied:

1. No voiceover. Music and burned-in text only, vertical, short-form, like the Sixty-Four Records
   shorts. Every voiceover budget below is judged as an on-screen text budget.
2. The main idea is honing judgment. The app follows the Confucian reading (Confucius, the Ten
   Wings, Wang Bi), not the book's older use. Each plan is scored on whether it makes that clear.

8 or more means I would make it as written.

## What I checked that the plans don't say

- **Everything for 18 蠱 is already rendered at one tempo (82.5 bpm):**
  `public/assets/3d/hexagram-011001-82.5bpm-6b.mp4`, `character-18-82.5bpm-17b-m0684s.mp4`,
  `endcard-join-011001-82.5bpm-9b.mp4`, and a finished special (character-18, 35.7 s). 42, 5 and
  47 have character clips too, at other tempos.
- **The app has the two screens that prove the main idea, and no plan leans on them.**
  - "What would prove this wrong" (tour stop 05_GuaFalsification): every Gua reading states when
    to drop it. That's the clearest proof on screen that the app is for judging, not for being
    told.
  - The Wang Bi Commentary accordion on the reading (WangBiSectionView). That shows the Confucian
    line on screen by name.
- **Launch arguments exist for recording** (sixlines-ios AppSettings.swift):
  `--screenshot-reading-P-T` opens a chosen reading, `--screenshot-gua-<name>` renders a saved
  Gua fixture, `--screenshot-matrix` gives the green-on-black look that matches the neon,
  `--skip-onboarding`. The only Gua fixture is 34→51 (gua-en.json), not one of the character
  hexagrams, so a matching falsification screen needs one real reading (see the shot list).
- **The site's notes (appended to the plans doc) agree:** make "What would prove this wrong" the
  key beat, use "X is not ... It is ..." text, follow the tour order, end on "Six lines reveal the
  moment." None of the three plans does any of these. The recommended plan does all four.
- **Matrix appearance matches the neon.** The reading screen (gallery/matrix/reading-matrix-42-42.png)
  is green on black. If you record in Matrix mode, the cuts between app and Blender don't jump
  from ivory to black.
- **The tagline "Not fortune-telling. A conversation." contains a banned word.** Keep it out of
  the video.
- **Apple's app preview is a different thing.** App Store previews are 15-30 s of footage captured
  from the app. The neon Blender shots can't go in one. A 30 s cut of only the live shots can
  (noted at the end).

## Scores

| Plan | Newcomer gets it | Judgment idea clear | Fun | Blender earns its place | Finishable | Wording | Works as a short | Overall |
|---|---|---|---|---|---|---|---|---|
| A: One real question | 7 | 3 | 6 | 8 | 7 | 7 | 5 | **6** |
| B: Six lines, six chapters | 6 | 3 | 4 | 3 | 3 | 8 | 1 | **3** |
| C: Character-led template | 4 | 3 | 8 | 9 | 8 | 8 | 9 | **5** |

### Plan A: One real question (6/10)

**What works.** One question followed start to finish is the easiest thing for a newcomer to
follow. The Blender pieces mark real events: the neon lines stand in for the six lines being
cast, and the character stands in for "what this hexagram is about". That's the right use of them.
One recording session covers the app footage.

**What doesn't.**
- 90 s is too long for a short. The Records shorts run 27-36 s. Past about 50 s people stop
  watching before they reach the end card.
- 170 words doesn't work as on-screen text. At a few words a card, held long enough to read at
  under 120 bpm, a 50 s short carries about 50-60 words.
- "Should I take the new job?" followed by a reading looks like the app hands you the answer. That
  is the use the author wants to get away from, and nothing in the plan corrects it.
- The "Go deeper" montage (painting, Date Finder, Journal, Records in 20 s) is a feature list. Four
  unrelated screens in quick cuts teach nothing, and it takes the slot where the judgment idea
  should go.
- It assumes the live cast lands on a hexagram that has a character clip. A real cast is random.

**To reach 8+.**
1. Cut to about 50 s, vertical only. Drop the 16:9 cut.
2. Replace the voiceover with about 50 words of on-screen text, no card over 8 words.
3. Say the main idea in the second and third cards, in the site's "X is not ... It is ..." form:
   "The I Ching is not a yes-or-no answer. It is practice in judgment."
4. Replace the "Go deeper" montage with the two screens that prove the idea: the Wang Bi
   commentary and "What would prove this wrong". Keep the Journal as the last app shot ("You decide. Write down what happened."). Drop Date Finder and Records.
5. Fix the hexagram: use 18 蠱, where every Blender piece already exists at 82.5 bpm. Record the
   reading with a launch argument or from a saved Journal entry (below).
6. Pick a question that fits 蠱 (repairing something neglected) and has no yes/no answer baked in.

### Plan B: Six lines, six chapters (3/10)

**What works.** The chapter list is a complete, accurate tour, and "Study: learn to read a
hexagram, not just receive one" is the only line in any plan that points at the main idea.
Wording is careful.

**What doesn't.**
- 16:9 with the phone in the middle is a YouTube explainer, not a short. Half the frame is empty on
  a phone.
- 2 minutes and 280 words can't become burned-in text without turning into slides.
- The neon line at each chapter is decoration: line 4 has nothing to do with the Yilin and line 5
  has nothing to do with the almanac. It also needs new Blender work (six single-line shots).
- Six chapters means six recordings, six text passes and a long edit. This is the plan most likely
  to stall, which is the one risk the brief says to avoid.
- A feature tour tells a newcomer what's in the app, not why it's different.

**To reach 8+.** It would have to stop being Plan B: vertical, under 50 s, one thread instead of six
chapters, with Blender only where it stands for something. That turns it into revised Plan A. If
you want a long 16:9 tour for the website or YouTube later, the site tour (tour-manifest.json)
already covers these stops as stills with captions. Do it after the short is out, not instead of
it.

### Plan C: Character-led template (5/10)

**What works.** It's the most fun to watch and the easiest to finish, because it's built from what
the shorts already make. The neon character does real work here: it teaches the hexagram. It
posts next to the Records shorts and looks like them.

**What doesn't.**
- It's nearly the existing character specials. Those already have a hook, the character lesson,
  the Yilin plates and the end card. The render props even have an empty `screens: []` slot. As a
  demo it adds a reading screen and a feature, which isn't enough for a newcomer to see how the
  app is used: you never see a question asked or a reading arrive.
- Pairing each hexagram with a feature (需 with the Date Finder, 井 with the Journal) is a pun, not
  an explanation. The viewer can't tell what the feature does from the pairing.
- The judgment idea isn't in it.
- Three videos instead of one. The brief is to finish one.

**To reach 8+.** Make one, not three, and give it the missing middle: the question asked, the
reading arriving, and the two screens that show judgment (Wang Bi, "what would prove this wrong").
That's revised Plan A with C's look. Keep C's other idea for later: once the demo is out, fill
the `screens` slot in future character specials with 4-6 s of the matching app reading. That's
cheap and ties the series to the app.

## Recommended plan: A's single question, C's look, judgment as the spine

One vertical short, about 50 s, on hexagram 18 蠱 Work on the Decayed, at 82.5 bpm, where every
Blender piece already exists. The viewer sees one question go through the app. The text says
plainly that the I Ching is not a yes-or-no answer but practice in judgment, the way the Confucian
commentators read it, and the key beat is the screen that says what would prove the reading wrong.

**Why 18.** 蠱 is about repairing something that has been let go, and its judgment says to think
three days before and three days after: think on both sides of a decision. That fits the idea
exactly. All clips are rendered at one tempo, and the character-18 special already has the track
(`musicStart` in series/renders/specials/character-18.json).

**Beat math.** 82.5 bpm: 1 beat = 0.73 s, 4 beats = 2.9 s. No text card is on screen for less than
4 beats. That leaves time to read 6-8 words.

**The text follows the site's own pattern.** The site's goals are written "X is not [misreading].
It is [structure]." (sixlines-site docs/hexagram-goals.md). That pattern states the judgment idea
without the banned words, as long as the misreading is described plainly ("a yes-or-no answer")
rather than named ("fortune-telling"). The site's own positioning line uses "fortune-telling", so it
can't be copied as is. 18's goal in goalData.ts ("Gu is not mere decay — it is the deliberate
confrontation with inherited corruption") gives card 7, and its note that 蠱 first showed insects
breeding in a sealed vessel is what the neon clip draws.

| # | Beats | Time | Source | Picture | On-screen text |
|---|---|---|---|---|---|
| 1 | 0-6 | 0.0-4.4 | Remotion | Code rain; question types in | Fix the old project, / or start over? |
| 2 | 6-10 | 4.4-7.3 | Remotion | Code rain holds, dims | The I Ching is not / a yes-or-no answer. |
| 3 | 10-14 | 7.3-10.2 | Remotion | Same | It is practice / in judgment. |
| 4 | 14-22 | 10.2-16.0 | Live recording | Ask screen (Matrix): the question typed, coins tossed | Ask a real question. |
| 5 | 22-28 | 16.0-20.4 | Blender | hexagram-011001-82.5bpm-6b: six lines land, camera cranes up | Six lines. / One of 64 situations. |
| 6 | 28-45 | 20.4-32.7 | Blender | character-18-82.5bpm-17b: insects in the bowl, 蠱 holds | 18 · Work on the Decayed, then the approved lesson: Found rot? / Clean it out. |
| 7 | 45-51 | 32.7-37.1 | Live recording | Reading scrolls to the Judgment, Wang Bi Commentary opens | Decay is not the end. / It is work to do. |
| 8 | 51-53 | 37.1-38.5 | Live recording | Same scroll, Wang Bi name in view | Read the Confucian way: / Ten Wings, Wang Bi. |
| 9 | 53-59 | 38.5-42.9 | Live recording | Gua reading scrolls to its "what would prove this wrong" conditions. The key beat: give it the most screen time of the app shots | Every reading says / what would prove it wrong. |
| 10 | 59-63 | 42.9-45.8 | Live recording | Journal: the reading saved with a note | You decide. / Write down what happened. |
| 11 | 63-72 | 45.8-52.4 | Blender | endcard-join-011001-82.5bpm-9b, hold, then the credit | Six lines reveal the moment. / sixlines.day |

Card 8 is short (2 beats). If it reads too fast, merge it into card 7's shot by holding the scroll
4 more beats; don't drop it, because it's the only card that names the tradition.

The order is the site tour's order (Ask, The reading, What would prove this wrong, Your own record),
and the ending is the site's tagline, which matches the "Reveal the moment." end card the shorts
already use.

**Text budget.** About 60 words across 12 cards, each 3-8 words. The lesson card (#6) is the
existing approved text from lessons.json. Nothing uses a banned word. Don't put the site's
"not fortune-telling" line or the "Not fortune-telling. A conversation." tagline on screen; both
contain "fortune".

**Kept for later shorts, not this one.** The site's 吉 note (68 of its 146 uses carry a condition,
so the text is conditional, not luck) and the 无咎 "no blame" note are good "X is not ... It is
..." shorts of their own. Adding either here would push it past a minute.

**What's recorded, what's reused.**
- Reused as is: code rain and typed text (Remotion), three Blender clips, music, end card, credit.
- New: about 20 s of live screen recording (shots 4, 7-10) in one simulator session, Matrix
  appearance, `--skip-onboarding`. Record each shot long and cut to the beat afterward.
- **How the reading ends up on 18.** A real cast is random. Two honest ways:
  1. In one sitting, ask the question for real and cast until the result is 18, then save it to the
     Journal. The Gua reading, its falsification conditions and the Journal entry are then the real
     output for that question. Each cast is one communal reading, which costs next to nothing. Then
     re-record shots 7-10 from the saved Journal entry, which shows the same view the store
     fixtures use.
  2. If 18 is slow to come up: record the coin toss from any cast (shot 4 cuts to Blender before the
     result shows), then open the 18 reading with `--screenshot-reading-18-18` for shots 7-8. For
     shot 9, save one real Gua reading of 18 and record it from the Journal.
- Remotion: this is the existing short composition with the `screens` slot filled by the live clips
  and three extra text cards. It isn't a new pipeline.

**Where it goes.** Instagram Reels, YouTube Shorts and TikTok first, posted with the Records shorts.
Then pin it on the site's home page or tour page, since that's the one video that explains the
app. For the App Store, make a second 30 s cut from shots 4 and 7-10 with the same text and no
Blender, because Apple previews have to be app footage.

**Order of work (so it gets finished).**
1. Record the live shots (one session).
2. Cut shots 4-10 to the 82.5 bpm grid using the 18 special's music settings.
3. Add the text cards, render, send as yuv420p + faststart under 25 MB (the Instagram rule).
4. Only then, optionally: the App Store cut, and `screens` in future character specials.
