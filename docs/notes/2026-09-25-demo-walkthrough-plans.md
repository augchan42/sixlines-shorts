# Demo walkthrough: three plans

A narrated video that walks through the Six Lines app (iOS, "Six Lines: I-Ching & Almanac"),
using the neon Blender pieces we already make for the shorts. Three plans to compare; a
critic scores them (series/critic/demo/plans.json).

## What we have to build from

- **App screens.** The site tour's stops, each in light and Matrix appearance
  (sixlines-site src/data/tour-manifest.json): Ask, Reading, Reading verse, Date Finder, Gua
  falsification, Records storefront, Almanac, Journal, Settings. Per-hexagram reading screens
  for all 64 (sixlines-ios gallery/). Yilin paintings (4,096 in the app; about 50 captured).
- **Live screen recordings.** The app builds for the iOS simulator (sixlines-ios Makefile), and
  `xcrun simctl io booted recordVideo` records real taps and scrolls. Nothing recorded yet.
- **Neon Blender pieces.** A hexagram's six lines landing and the camera craning up
  (blender/hexagram clips); the end card; the moon; 21 animated characters (blender/character.py),
  which now hold on the finished character.
- **Remotion scenes.** Code rain, typed text, caption screens, whip cuts, the beat plan.
- **Music.** Local Pixabay tracks, nothing above 120 bpm.

## The idea

Six Lines is for honing judgment. The I Ching's root is divination, but the app follows the
Confucian reading: Confucius, Wang Bi, the Ten Wings. The demo should make that plain.

## Constraints

- The App Store rejected the app twice under 4.3(b). Never say "oracle", "divination",
  "fortune", "prediction", "mystical", "magical". The app is a study tool and a reference.
- Plain words on screen and in the voiceover. No mannered prose.
- No voiceover (the author's call, after the plans were written): music and burned-in text only,
  as a vertical short like the Sixty-Four Records shorts. Where a plan below says voiceover,
  read it as on-screen text.
- It has been put off for a long time, so the plan has to be one that gets finished.

---

## Plan A: One real question (90 s, vertical 9:16, with a 16:9 cut)

Follow one person through one reading, start to finish, as it happens in the app.

1. **Cold open (0-6 s).** Code rain; a question types on screen: "Should I take the new job?"
2. **Cast (6-18 s).** Live recording of the Ask screen and the cast. As the lines come in, cut
   to the neon hexagram building line by line in Blender, then back to the app landing on it.
3. **Read (18-40 s).** Live scroll through the reading: the Judgment, the changing line, the
   verse. Voiceover says what each part is for.
4. **Understand (40-58 s).** The hexagram's neon character lesson (e.g. 困 for Oppression): the
   drawing acts out the meaning, the sentence types under it. "Each hexagram's name is a picture."
5. **Go deeper (58-78 s).** Quick cuts, one per feature: the Yilin painting, the Date Finder,
   the Journal entry saved, Records.
6. **End card (78-90 s).** The neon end card and sixlines.day.

Voiceover: about 170 words. Real recordings carry it; Blender marks the two turns (the cast,
the character).

## Plan B: Six lines, six chapters (2 min, 16:9 with the phone in the middle)

The video builds a hexagram as it goes: each chapter opens with one neon line landing,
bottom to top, and the chapter covers one part of the app.

1. **Line 1: Ask.** How a question is written and cast.
2. **Line 2: Read.** The reading: Judgment, lines, verse.
3. **Line 3: Study.** Liu Yao structure and the Study tab, for people who want to learn to read
   a hexagram, not just receive one.
4. **Line 4: Art.** The Yilin: 4,096 original ink paintings, one for every pair of hexagrams.
5. **Line 5: Almanac.** The Date Finder and the almanac, citing the 1739 source.
6. **Line 6: Keep.** Journal and Records: go back to what you asked and what happened.

Close: the six lines are complete, the camera cranes up over the hexagram, the end card. The
phone sits in the middle of a 16:9 frame; the neon line and chapter title sit to its left.
Screens are a mix of live recordings and still captures with slow pans. Voiceover about 280 words.

## Plan C: Character-led (60 s, vertical, a series of short demos)

Not one video but a template: each demo is one hexagram. The neon character opens it (the
drawing acts out the meaning), then the app shows that hexagram: the reading, its painting,
one feature relevant to it (e.g. 需 Waiting with the Date Finder, 井 The Well with the
Journal). Voiceover about 110 words each. First three: 42 益, 5 需, 18 蠱. They post next to
the Sixty-Four Records shorts and share their look.

---

## From the sixlines-site repo (added after the plans)

- **Positioning, in the site's own words.** "The I-Ching is a 3,000-year-old binary system for
  structured reflection — not fortune-telling." (docs/superpowers/specs/2026-03-26-i-ching-education-first-redesign.md).
  "Read the situation you're navigating" (docs/plans/2026-04-17-entry-layer-positioning.md).
  Goals follow the 義理 tradition (Wang Bi, Cheng Yi, Zhu Xi, the Tuan and Xugua commentaries):
  "X is not [misreading]. It is [structure]." (docs/hexagram-goals.md). Tagline: "Six lines
  reveal the moment."
- **Tour order** (src/app/tour/page.tsx): Today, Choosing a date, Ask a real question, The
  reading, What would prove this wrong ("Each reading states the conditions under which it
  should be abandoned."), The painting and its text, The Archive, Your own record ("Every
  reading you have kept, with what you asked and what happened after."), Settings ("the
  sources every screen cites").
- **No trailer or demo exists.** Motion assets: the Records image-to-video takes
  (src/app/tour/records/) and the home page's 5-second Yilin/Records loops (src/data/splash-videos.ts).
  Growth note: "Pinterest and TikTok/Reels >> X ads" (docs/social-posts/growth-playbook.md).
- **Ideas it suggests.**
  1. Open on a misreading, then correct it: "X is not ... It is ..." as on-screen text.
  2. 吉 "good fortune": 68 of its 146 uses carry a condition ("with constancy"); the text is
     conditional, not luck (docs/plans/why-good-fortune-doesnt-mean-luck.md).
  3. 无咎 "no blame" is about where you stand, not an acquittal (docs/plans/no-blame-doesnt-mean-innocence.md).
  4. "What would prove this wrong" is the clearest judgment-not-divination screen: make it the key beat.
  5. Follow the tour: Ask, Reading, What would prove this wrong, Your own record; end on "Six
     lines reveal the moment."
