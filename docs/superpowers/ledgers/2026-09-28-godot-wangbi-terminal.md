# SDD ledger — plan: docs/superpowers/plans/2026-09-28-godot-wangbi-terminal.md
Spec: docs/superpowers/specs/2026-09-28-godot-wangbi-terminal-design.md. Branch series-64 (user's working branch, not main). Start 15e40f1.

## Preflight scan
| Rows | Produced vs consumed | Found |
|---|---|---|
| T1/T5 main.gd | T1 placeholder; T5 replaces | ok |
| T1/T3 package.json terminal:web | T1 export only; T3 prefixes data build | ok |
| T1/T8 export_presets.cfg | T1 writes preset; T8 adds custom shell + exclude | ok |
| T1/T4 tests/run.gd, reading.gd | T1 stub version(); T4 replaces both | ok |
| T2/T3 sfx.mjs | makeSfx(name,file) .ogg; tick recipe | ok |
| T3/T4 data/hexagrams.json | keys bottom-first; entry fields number,zh,pinyin,name,lines,upper,lower,masters | ok; series/hexagrams.json has number,zh,pinyin,name,lines (7 = [0,1,0,0,0,0]) |
| T4/T5 Reading API | title, log_row, trigram_rows, wangbi_rows, master_lines | ok |
| T5/T6 main.gd | show_lines, plot.line_at, sound_toggle, prompt, PROMPT | ok |
| T6/T7 set_lines, reading_typed | ok |
| T8/T10 build/web | ok |
| T1 self | test fails then passes | ok |
| T2 self | teletype test pins an exact recipe string | Ruling below |
| T3 self | Step 2 is hand reading (judgment); test fails until done | ok |
| T4 self | title expects "7  師 SHĪ  THE ARMY" from pinyin Shī | ok |
| T5 self | Step 4 stops for the user's review of stills | real user gate, spec step 4 |
| T6 self | SOUND is a Label with mouse IGNORE hit-tested by hand, Review Focus says "SOUND button" | consistent in effect |
| T7 self | typing ~25 cps may make the clip > 40 s (spec aims 20-40 s) | Ruling below |
| T10 self | other repos | local branch + local checks only; stop before push/merge/deploy |

Ruling: T2's teletype test pins the explainer's current recipe verbatim; if the plan's string differs from the explainer's, the test uses the explainer's — "unchanged" is the requirement — cost if wrong: none, the test just pins the real value.
Ruling: T7 records at the plan's typing speed and reports the length; if over 40 s, record mode alone raises typing_speed (e.g. 60 cps) — the spec aims at 20-40 s clips and the web terminal keeps the lesson's 25 cps — cost if wrong: a faster-typed clip the user may want slower.
Ruling: T3 Step 2 (reading 53 hexagrams' notes) goes to the most capable model — it is judgment on Classical Chinese — cost if wrong: extra tokens.
Ruling: T5 Step 4 stops execution for the user's review of stills, per the spec's step 4 — cost if wrong: a pause.

## Tasks
Task 1: dispatched (sonnet), BASE 15e40f1
Task 1: minor (deferred): include_filter data/*.json unused until Task 3 — confirm consumed
Task 1: complete (commits 15e40f1..eb2cc3c, review clean; controller checked templates installed and test:godot green)
Task 2: dispatched (sonnet), BASE eb2cc3c
Task 2: complete (commits eb2cc3c..dde4388, review clean)
Task 3: dispatched (opus), BASE dde4388
Task 3: review — Important: 45 L5 not named by Wang Bi (以剛為主 is a quality, like 30). Minors: English style mixed; 6/55 checked notes miss candidates; font test tautological (plan-mandated, pyftsubset flag is the guard); CLI entry check breaks on spaces.
Ruling: 36 stays L6 (他 names 明夷之主，在於上六 outright) with zh extended to 明夷之主，在於上六，上六為至闇者也 and en "Line six, master of Darkening of the Light: the darkest line" — faithful and a newcomer won't take him as the model — cost if wrong: one entry's wording.
Ruling: new English glosses follow the seeded style (line numbers as words, "the" lowercase mid-phrase); seeded ones stay as in copy.json so the terminal matches the shorts — cost if wrong: cosmetic.
Task 1: minor include_filter — resolved in Task 3 (data/hexagrams.json now exists).
Task 3: minor (deferred): font-coverage test cannot fail (plan-mandated); `where` says "note on the Judgment" for Tuan notes (controller ruling).
Task 3: fix round 1/5 (5 addressed, 0 open; commits d84908d..8d993d7)
Task 3: complete (commits dde4388..8d993d7, review clean after round 1)
Task 4: dispatched (sonnet), BASE 8d993d7
Task 4: complete (commits 8d993d7..9661802, review clean)
Ruling: Task 5 stills are 7, the longest title, and 36 (longest WANG BI row) — the table has no two-master hexagram after Task 3 — cost if wrong: a two-master layout goes unseen until one exists
Task 5: dispatched (sonnet), BASE 9661802
Task 5: review approved, but controller saw in stills.png the log's L1 row overlapping the UPPER trigram row (log at y=960, trigrams y=1250) — confirmed real gap, enters fix loop. Minor (deferred): line_at has no automated test (Task 6 hand check).
Task 5: fix round 1/5 (1 addressed, 0 open; commits 4dceed7..89cb180)
Task 5: complete (commits 9661802..89cb180, review clean after round 1) — STOPPED for user review of stills (spec step 4)
User approved the stills (2026-09-29): 'looks good. i hope the sound effects and ambient sound are good'.
Ruling: Task 6 plays tick at -14 dB and the bed at -10 dB (the lesson mixes them under narration; a per-character tick at full level risks the 'very annoying' generated-chirp problem) — the Task 7 clip lets the user judge — cost if wrong: levels retuned.
Ruling (replaces the -14/-10 dB ruling): Task 6 uses the Wang Bi lesson's own mix (series/explainers/wangbi-lesson.json 'mix'): tick 0.8, sweep 0.7, warble 0.5, winddown 0.6, relay 1.0 (linear, via linear_to_db); bed, absent from the lesson mix, at 0.5 — the terminal should sound like the lesson the user approved — cost if wrong: levels retuned after the Task 7 clip.
Task 6: dispatched (sonnet), BASE 89cb180
Task 6: complete (commits 89cb180..5ac287d, review clean, 3 minors)
Task 6: minor: tap during G entry leaves entry mode on while prompt says TAP A LINE
Task 6: minor: warble fires on a change to a smaller master set (should be: a line newly amber)
Task 6: minor: input check's mid-turn taps are near zero rotation; click coords assume a 1080x1920 window; test:godot-input's --import rewrites project.godot
Ruling: fold Task 6 minors 1, 2 and the project.godot rewrite into Task 7's dispatch (same file, small, user-facing) — cost if wrong: a slightly larger Task 7 diff.
Task 7: dispatched (sonnet), BASE 5ac287d
Task 7: review — Important: stacking uses stale visible_characters under VC_CHARS_BEFORE_SHAPING (strip frame 5). SendUserFile item is the controller's job (ruling in dispatch), not a gap.
Task 7: fix round 1/5 (1 addressed, 0 open; commits 72da0d3..419ad0d)
Task 7: complete (commits 5ac287d..419ad0d, review clean after round 1); clip sent to user for sound check
Task 8: dispatched (sonnet), BASE 419ad0d
Task 8: controller confirmed a real gap: web shows tofu (U+012A Ī) in the title — Reading.title uppercases pinyin but displayText subsets only lowercase pinyin; desktop hid it via system font fallback. Enters the Task 8 fix loop.
User (2026-09-29): 'turn the bed on'. Ruling: the bed is on by default (web after START, and recordings); SOUND/S turns it off; the spec's 'off by default' changes to match — reading the request as the default, not only a test clip — cost if wrong: one flag back.
Task 8: review approved; minor: startGame() has no .catch. Fix round 1 = Ī tofu (displayText must include uppercased pinyin) + startGame .catch + bed on by default (user) + re-record clip.
Task 8: fix round 1/5 (3 addressed, 0 open; commits a0a77e2..494ac93)
Task 8: complete (commits 419ad0d..494ac93, review clean after round 1)
Ruling: terminal-record.mjs writes full-range yuvj420p (the Instagram failure mode in memory) — fold the full→tv range fix and a share encode into Task 9 — cost if wrong: none.
Task 9: dispatched (sonnet), BASE 494ac93
Task 9: complete (commits 494ac93..39ecc94: 49e20fe, 39ecc94; review approved, no issues)
Ruling: Task 10 branches 'terminal' from each site's origin/main and commits public/terminal/* there (Vercel deploys from git; the no-media rule is for this repo's renders) — cost if wrong: drop the commit before any push
Ruling: Task 10 reviewed by the controller directly (two one-line matcher edits and one redirect, read in full; checks and START screenshots confirmed) — a reviewer seat adds nothing to a 3-line diff — cost if wrong: the final review still covers the plan
Task 10: complete locally (sixlines-site terminal 6ce43d2, 6da725c; 8bitoracle-brand terminal ef18285, 19a5a48); not pushed, awaiting the user's approval
Final review (opus): Needs fixes — I1 START double tap, I2 iOS audio unlock; minors 3-9.
Ruling: SOUND/S mutes the Master bus (all sound), default on, instead of only the bed — a viewer reads SOUND OFF as silence; the user's 'turn the bed on' still holds by default — cost if wrong: relabel BED instead
Ruling: middleware prefix match (minor 6) left as is — same pattern as the existing go exclusion, no /terminal* routes exist, and $ in a Next matcher is untested risk — cost if wrong: a future /terminals page skips locale routing
Ruling: wasm compression (minor 9) checked after deploy with content-encoding — cannot be checked locally against Vercel
Final fixes: complete (c4f4fef, babb247, c5bd60d; sites d1cc750, 5f2371f); controller re-read shell.html and main.gd diffs
