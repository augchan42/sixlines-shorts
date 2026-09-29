# 吳越 Wuyue: a neon history video (treatment)

Status: 2026-09-29. The first treatment below was reviewed by Astra
(docs/research/2026-09-29-codex-wuyue-video.md); the user watched an 11 s smoke test of the
returning route (scripts/wuyue.mjs, first version) and said "looks good, keep going". The
revised shot list at the end replaces the beats; the rest stands where it does not conflict. Asked for by the user: "brainstorm
some kind of fun video explaining the history and the Buddhist transmission and the whole story
of the Kingdom of Wuyue in awesome neon and ... Tron style stuff", then "do both" (a vertical cut
for Instagram and a wide cut for a friend's site) "and then brainstorm with Astra for
improvements". Facts: docs/research/2026-09-29-wuyue-history.md (checked, but mostly against
encyclopedia pages; a scholarly pass is still owed on beats 4 and 5).

## Two cuts

- Vertical, 1080x1920, about 75 s, for Instagram (Reels and DMs: H.264 yuv420p, faststart,
  under 25 MB). One line of text on screen at a time.
- Wide, 1920x1080, about 2 min 30 s, for the friend's site. The same scenes held longer, two
  beats the vertical cut drops (the lake corps, the 36 monks), and a short sources card at the
  end.

Both come from the same Blender scenes, rendered twice with the camera framed for each shape
(blender/sign.py already frames by size).

## Look

The 吳越 sign's world: magenta neon tubes on smoked glass, on the dark glossy floor, under the
same sun and bloom. "Tron" means light lines drawn across that floor, not props or icons (neon
icon signs were called "cheesy"). Each beat is carried by one character tracing itself in, in
standard stroke order, with English beside it. Lines of light do the rest: they are what the
characters send out and what comes back. Calm camera: slow cranes and pushes as in the lessons, no
shake, no flicker.

Colour: magenta for Wuyue itself; one other colour, cyan-white, only for what crosses the sea
(texts, monks), so the transmission reads at a glance. Labels in the signs' muted grey, Goudy.

## Beats (vertical timings; the wide cut holds each about twice as long)

1. 0-6 s. Black floor. A single magenta line runs across it: the Qiantang river's mouth.
   Text: "Hangzhou, 907."
2. 6-14 s. 錢 (Qian, the ruling family's name) traces in. Text: "A salt trader turned soldier,
   Qian Liu, makes it a kingdom. His family rules it for seventy years."
3. 14-22 s. 潮 (tide). A wide band of light rolls up the river line and stops dead against a
   straight wall of light. Text: "He walls out the tidal bore, about 909. The legend says he shot
   arrows at the tide first."
4. 22-30 s. 秘 (secret). Lines run out north (tribute) and out to sea (trade); small green
   points (celadon) travel along them. Text: "It pays the north for peace, and grows rich on a
   green porcelain called 'secret colour'."
5. 30-44 s. 經 (sutra). The transmission. Across the floor, three shores: Hangzhou, Korea,
   Japan. A cyan-white line leaves Hangzhou for each, and texts come back along them as small
   points of light. Text: "Its Buddhist books are lost at home. The last king sends to Korea and
   Japan for copies. In 961 a Korean monk, Chegwan, brings them back." (Wide cut adds: "Later a
   Korean king sends 36 monks to study with one Hangzhou teacher, Yanshou.")
6. 44-56 s. 塔 (stupa). One small stupa of light; then two, four, eight ... doubling until the
   floor is a grid of them: 84,000. Text: "He has 84,000 small stupas made, each sealing a
   printed sutra. The prints are dated 956, 965 and 975, some of the oldest printed pages to
   survive." Some of the grid's lights drift off along the sea line. Text: "Some reached Japan."
7. 56-64 s. 雷峰 (Leifeng). One tall pagoda of light stands, then its lines fall away, leaving
   a small silver stupa glowing where it stood. Text: "Leifeng Pagoda, 975. It fell in 1924. In
   2001 its vault was opened: a silver stupa still inside."
8. 64-70 s. 歸 (return). Every line on the floor stays lit as the camera rises. Text: "In 978
   the last king hands Wuyue to the Song without a war. Hangzhou is spared."
9. 70-75 s. The 吳越 sign draws itself in, as in the sign clip, with "KINGDOM OF WUYUE ∙
   907–978" under it.

## Music

At most 120 bpm, matching the story: pick22 Cinematic Dark Synthwave (100 bpm, G minor) for beats
1-4, crossfading on a phrase into pick07 Interstellar Retrowave (100 bpm, A minor, calm) for the
Buddhist beats and the close. The same tempo lets the crossfade sit on the beat. Each beat change
lands on a bar.

## Words

- Our copy never uses oracle, divination, fortune, prediction, mystical, magical. English beside
  every character.
- Contested points are worded to what is well attested: the arrows are "the legend"; the envoys'
  exact adviser and return year are left out; Leifeng is dated 975 (its start).

## Open

- Scholarly check of beats 5 and 6 (the JIABS paper "Crossing Ten-Thousand Li of Waves" and the
  MDPI Religions paper on the Baoqieyin prints).
- Whether the friend wants her site's own title or credit on the wide cut.

## Revised shot list (after Astra and the smoke test)

Five shots, hard cuts on the bar, 100 bpm (a bar is 2.4 s), about 72 s. The wide cut uses the
same shots framed wide, and ends on a sources card. Timings and cards live in scripts/wuyue.mjs
(SHOTS); blender/wuyue.py builds each shot.

1. Hook, 4 bars. Low and close on the lit 吳越; a cyan-white line draws in from off frame and the
   sign flares as it arrives; the camera rises to the whole sign. "Lost books." / "Copies from
   overseas." / "Wuyue ∙ Hangzhou, China ∙ 907–978".
2. The Qian family, 5 bars. 錢 (QIAN, THE RULING FAMILY) traces in; below it a line from 907 to
   978 draws in five spans, one per reign, each as long as the reign. "Qian Liu: salt trader,
   soldier, ruler." / "Five rulers. One family. Seventy-one years."
3. The exchange, 9 bars. The map: Hangzhou inside a faint border. A line north (NORTHERN COURTS);
   高麗 GORYEO (KOREA) and 日本 JAPAN trace in; request lines go out to both; the cyan-white line
   comes back from Korea only, and the sign flares. "Tribute north. Trade by sea." / "Some
   Tiantai Buddhist texts were lost in China." / "Qian Chu sent overseas for copies." / "A Korean
   monk, Chegwan, brought them back."
4. Printing, 7 bars. One page of light columns traces in; copies appear outward from it in a
   wave while the camera rises to show the field of them. "Qian Chu had a short Buddhist text
   printed." / "It is said 84,000 copies were made." / "Copies dated 956, 965 and 975 survive." /
   "Among the oldest printed pages anywhere."
5. End, 5 bars. The map as the exchange left it; the border fades while every route stays lit;
   the camera comes down to the sign, which flares once, and WUYUE / KINGDOM OF WUYUE ∙ 907–978
   fade in under it. "978: Qian Chu surrendered Wuyue to the Song."

Music: one track, Interstellar Retrowave (100 bpm), started so the drop lands on the exchange's
flare. Left for later, needing better sources: the seawall, Yanshou and the 36 monks, Leifeng.
