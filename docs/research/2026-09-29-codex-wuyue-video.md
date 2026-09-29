# gpt-6-astra on the Wuyue video treatment (2026-09-29)

Asked through Codex (`codex exec -m gpt-6-astra -s read-only`) to review docs/superpowers/specs/2026-09-29-wuyue-video-treatment.md. The prompt follows its answer.

## Answer

**Keep the neon, but simplify the story before building.** The current treatment reads as nine illustrated facts. The strongest arc is a small kingdom, its overseas Buddhist connections, and what survived after it ended. Ranked improvements:

1. **Make the first two seconds explain why to watch.**

   “Hangzhou, 907” establishes a setting but offers no hook. Open on an already visible section of the spectacular sign, with a cyan line drawing toward it. Text: **“Lost books. Copies overseas.”** Then identify **“Wuyue · Hangzhou, China · 907–978.”**

   For roughly 75 seconds: hook and setting, 8s; founder and survival, 14s; Buddhist exchange, 25s; printing, 16s; surrender and closing sign, 12s.

   Merge seawall, tribute and trade into brief context. Move Leifeng’s excavation to the wide cut. Drop the arrow legend from vertical: explaining its status consumes time.

   “Fun” should come from visual discoveries: a line reverses direction, one pattern becomes many, a low camera reveals the finished lettering. Nine similar character introductions will feel repetitive.

2. **Replace literal illustrations with changes in lines, spacing and scale.**

   Suggested treatment of every existing beat; slashes separate successive text cards:

   | Beat | Visual improvement | Shorter screen copy |
   |---|---|---|
   | 1. Opening | Start close to lit tubes; draw one returning cyan route. Reveal location immediately afterward. | “Lost books. Copies overseas.” / “Wuyue · Hangzhou, China” |
   | 2. Founder | Trace 錢 with “Qian family” beside it; reveal five evenly spaced light segments. Avoid crowns or portraits. | “Qian Liu: salt trader, soldier, ruler.” / “Five rulers. One family.” |
   | 3. Tide | **Literal-effect risk:** wave hitting a wall. Use parallel curves beside one steady boundary; no collision or abrupt stop. Merge into context. | “Qian Liu built seawalls.” |
   | 4. Trade | Remove 秘 (“secret”), cargo dots and green. Extend two magenta routes, northward and offshore. Green also breaks the stated palette. | “Tribute to northern courts.” / “Trade across the sea.” |
   | 5. Texts | Keep three clearly labelled locations. Requests draw outward; a distinct return line comes from Korea. Hold the camera while viewers understand direction. | “Some Tiantai Buddhist texts were lost in China.” / “Qian Chu sought copies overseas.” / “Chegwan brought texts from Korea.” |
   | 6. Printing | **Explicit icon:** multiplying stupas. Instead repeat one short arrangement of parallel light strokes across the floor. Slow crane reveals scale. | “Qian Chu commissioned thousands of printed Buddhist texts.” |
   | 7. Leifeng | **Explicit icons:** pagoda and silver stupa. For wide only, move the camera below a thin floor plane to reveal a retained light trace. No collapse animation. | “Leifeng Pagoda: construction began in 975.” / “Its buried chamber was excavated in 2001.” |
   | 8. Submission | Remove the territorial boundary while established routes remain. Drop 歸 (“return”), which imposes an interpretation. | “978: Qian Chu surrendered Wuyue to the Song.” |
   | 9. Close | Finish the actual 吳越 sign, hold, then one restrained flare. Avoid replaying the entire introduction. | “吳越 Wuyue” / “907–978” |

   Keep English visible whenever Chinese appears. Use Goudy for the title; test its sentence-sized text on a phone. Explanatory text should stay level and readable through camera movement.

3. **Correct the historical scope and implications.**

   The supplied fact check itself needs qualification:

   - “Makes it a kingdom” suggests a unilateral founding. Its detailed account identifies the 907 investiture; use “Wuyue began in 907.”
   - “Its Buddhist books” is too broad: the recovery concerns particular **Tiantai works**, not Buddhism’s entire literature.
   - The treatment says it omits the disputed return year, then explicitly gives **961**. Omit the year pending the scholarly check.
   - Requests to Japan do not automatically support showing a successful return from Japan.
   - Distinguish recovered Tiantai writings from the **Baoqieyin** texts printed for devotional deposits. The edit must not imply they were the same books.
   - Present **84,000** as the reported commission associated with Ashoka’s precedent, not an audited surviving total. The fact check connects the 975 printing to Leifeng; the treatment folds all three dates into miniature stupas.
   - Tribute did not guarantee peace; celadon alone does not explain prosperity.
   - “Hangzhou is spared” implies a certain counterfactual. The surrender itself is sufficient.
   - The “36 monks” account needs stronger checking before presenting a precisely organized royal delegation.

   I could not retrieve the named scholarly articles in this pass; these recommendations do not constitute scholarly clearance.

4. **Give the wide cut additional explanation.**

   Use the width for a stable geographic diagram and simultaneous departure/arrival views. Explain who requested texts, who supplied them, and who studied them. Separate textual recovery, teaching and devotional printing.

   Add Leifeng as evidence of material survival. Include the lake corps only if civic history becomes a deliberate secondary theme. Neither extra anecdote justifies doubling every hold.

5. **Use one musical progression.**

   Start with one restrained 90–100 bpm instrumental. Equal tempo does not make G-minor and A-minor tracks blend harmonically. Audition the actual transition before committing.

   At 100 bpm, a 4/4 bar lasts 2.4 seconds; the proposed timings do not consistently land on bars. Prioritize reading time, then align major transitions. Avoid repeated whooshes and per-stroke sounds.

6. **Smoke-test the difficult part first.**

   Build a future 10–12-second test of the returning route, bilingual text and camera reveal in both formats. Check comprehension muted, phone readability, reflections and compressed bloom.

   The code already supplies tube tracing and glass bodies. It also adds per-stroke brightness peaks; suppress those and reserve one flare. Avoid the existing bobbing, hopping and bouncing routines. `sign.py` fits static bounds—it does not solve moving-camera composition or text layout for both cuts.

No files changed.

## Prompt

You are advising on a video before it is built. Read-only: change no files.

Read:
- /Users/auchan/projects/sixlines-shorts/docs/superpowers/specs/2026-09-29-wuyue-video-treatment.md (the treatment)
- /Users/auchan/projects/sixlines-shorts/docs/research/2026-09-29-wuyue-history.md (the fact check)
- /Users/auchan/projects/sixlines-shorts/blender/sign.py and blender/character.py (how the neon is made today)

The user saw neon sign clips of 吳越 (strokes tracing in on a dark glossy floor, magenta tubes on
smoked glass, one flare, Goudy label, calm music) and called them spectacular. They asked for "some
kind of fun video explaining the history and the Buddhist transmission and the whole story of the
Kingdom of Wuyue in awesome neon and ... Tron style stuff", in two cuts: vertical for Instagram and
wide for a friend's site.

The user's standing rules:
- Calm motion: no flicker, buzz, shake or sway.
- Less is more.
- No literal effects: neon icon signs and labels on bars were called "cheesy".
- English beside any Chinese; the user does not read Chinese.
- Plain copy, no mannered prose.
- Music at most 120 bpm, matching the mood.
- Never these words in our copy: oracle, divination, fortune, prediction, mystical, magical.

Give ranked, concrete improvements (under 1000 words):
1. Story: is this the right arc for a newcomer on Instagram? What is the hook in the first 2
   seconds? What to cut or merge? Is "fun" there?
2. Each beat's visual: better neon/Tron ideas that are not literal or cheesy, and that Blender can
   do with tubes, light lines and a camera. Flag any beat that is an icon in disguise.
3. On-screen text: rewrite the lines shorter and plainer where you can.
4. Facts: anything in the treatment the fact check does not support, or that a historian would
   object to.
5. The two cuts: what the wide cut should do differently beyond holding longer.
6. Music and pacing.
7. Risks, and what to build first as a smoke test.
