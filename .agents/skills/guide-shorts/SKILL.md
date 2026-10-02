---
name: guide-shorts
description: Use when writing, voicing and building a Hitchhiker's-Guide-style Six Lines short (a dry narrator reads a reference-book entry over neon line drawings), or when reviewing or re-rendering one.
---

# Guide shorts

A Guide short is a ~50 s vertical (1080x1920) entry from an imaginary reference book, read by a
dry English narrator over angular neon line drawings, in the manner of the 1981 BBC television
Guide graphics (Rod Lord, Pearce Studios). Our own device, drawings and words: no DON'T PANIC,
towels or Guide logo. The user (2026-09-30): "I think the guide shorts are a real format."

Existing entries, for reference: series/specials/guide-wangbi.json (the first, 9 lines),
guide-64.json, guide-cords.json, guide-leibniz.json, guide-trigrams.json. Research behind this
skill: docs/research/2026-10-01-guide-shorts-research.md; shot rules:
docs/notes/2026-09-30-guide-wangbi-shots.md.

## What an entry is

- One subject, one idea a newcomer can repeat afterwards (a person, a hexagram, a story, a piece
  of structure). Six Lines reads the book for judgment (Wang Bi, the Ten Wings), so the idea is
  about conduct or about how the book works, not about the future.
- 7 lines (9 at most), 75-85 words. The Guide voice reads about 115 wpm, so that is ~42 s of
  speech and ~50 s in all. Lists slow it down: the trigrams entry's two lists of eight ran 65 s.
- Shape:
  1. "The I-Ching." plus what this entry is about, in the first line. The first page draws on
     within the first second (the subject on screen, not a logo).
  2. 3-4 lines of facts, each with one precise, checkable detail (a number, a date, a name).
  3. The turn: the line that makes the point (Wang Bi's fish trap; "So it ends on Not Yet").
  4. Optional: "Six Lines reads it for judgment: what makes sense to do here." Use it when the
     entry is about how to read the book, not on every entry.
  5. The footer: "Recommended for: X. Not recommended for: Y." Y is the joke and the reveal.
     ("Also recommended for:" gives a second tick instead of a cross.)
- Voice direction: plain, even pace; short pauses; no wonder or reverence; never emphasise a joke.
  The humour comes from the flat reading of a precise or deflating fact (Peter Jones's register).

## Writing checklist

- [ ] First line names the subject; second line gives a reason to keep watching.
- [ ] One idea. Cut any fact that does not serve it.
- [ ] Deadpan: state the absurd thing as a dictionary would. No "believe it or not", no wink.
- [ ] Precise numbers over vague ones ("three times", "1701", "sixty-four").
- [ ] The sharpest line comes last in its sentence and last in the entry.
- [ ] At most one small aside per line; at most one gag per page in the picture.
- [ ] A newcomer gets who did what. Explain any term the first time ("trigrams", "Ten Wings").
- [ ] Give the reason behind an image, not only the image (Small Image, Wang Bi). No promised
      outcomes.
- [ ] History: name the source in `sources`; hedge legend ("by tradition", "attributed to",
      "probably written later"). Primary texts are in ~/projects/chinese-classics-reference.
- [ ] Plain words, no mannered prose. Read it aloud; if a phrase sounds written, rewrite it.
- [ ] Banned words checked (house rules below).
- [ ] Chinese names the voice will mangle get a `say` (same word count as `text`):
      "Sih-mah Chyen", "Foo Shee", "Joachim Boo-vay", "seventeen-oh-one".

## The spec file

series/specials/guide-<slug>.json. Copy the newest entry's `voice`, `timing` and `close` as they
are. Fields:

- `about`: what it is, the user's request quoted with date, draft number and review status.
- `narration[]`: `text` (shown, word for word), `say` (spoken, optional), `picture` (what the page
  draws, in plain words), optional `pause` (seconds before this line, replacing `gap`).
- `marks[]`: `{ name, beat, word }`. Each picture event keys on the first frame of a spoken word.
  `word` must match a word of `text` after lower-casing and stripping punctuation except hyphens.
  guide-props.mjs adds `b<n>`/`e<n>` (line start/end) and `close` for free.
- `onScreenChinese[]`: each item as "漢字 English".
- `sources`: where each fact comes from.
- `timing`: fps 30, lead 1.4, gap 0.7, tail 0.8, close 2.5.
- `close`: tagline REVEAL THE MOMENT, site sixlines.day, the static sfx.

## Visual grammar (src/templates/guide-kit.tsx)

- Full-screen black; thick angular neon outlines that draw on (`Line`, 14 frames), then flat fills;
  polygons, not circles (`poly`, `ngon`, `moved`). Palette `C` and `CYCLE`.
- `Title`: the page title, blue, top left, typed two frames a letter; optional `zh` and `sub`.
- `Label`: green capitals on a leader line. Labels carry facts and the small jokes
  (EXPRESSION: NOT RECORDED, AUTHOR: DISPUTED); they add to the narration, never repeat it.
- `Small`: small print that rewards a pause (STALK 37 OF 49, PAGE 1 OF MANY). Only where a page has
  room, and never needed to follow the point.
- `Hexagram` / `DrawnHexagram` (drawn bottom line first) / `barY` for a line's position.
- The narration is typed in blue capitals along the bottom, newest letter white (`Typed`, built
  in). On the summary page the rows break before "Not"/"Also" with a tick and a cross.
- One page per narration line (`PAGES: [["b1", Page], ...]`), hard cuts between them.
- Camera (`Camera`, `Still`): at most one move per page, about one move per two pages in all; zoom
  1.0-1.3; eased sine; slower than ~8% of the frame a second; it ends before the line ends so every
  cut lands on a still. A move must reveal something or point at what the words name. The title
  and typed narration never move. No shake, punch, bounce or sway, ever.
- Draw what the words say, on the word (a mark), as the BBC team did from the voice track's dope
  sheets. Literal objects are allowed (a fox, a cord, a fish trap); ask Astra about a new visual
  idea and follow Astra if it objects.
- Sound: `GuideShort` adds the boot, typing ticks and the close's static. Add the page's own cues
  in `cues={(m) => ...}` from the 38 sounds in series/specials/guide-sfx.json
  (public/local/sfx/guide/<name>.wav), volume 0.15-0.3: a blip per label, `blip-up` before the
  tick, `error-buzz` after the cross. Guide shorts have no music so far; if one gets music, keep it
  at 120 bpm or slower and matched to the subject's mood.
- No AI-generated images. Everything is drawn in SVG (or Blender, by the house's Blender rules).

## Build pipeline

```sh
# 1. Voice takes, one mp3 + character timings per line (ElevenLabs; key from .env, never printed)
node --env-file=.env scripts/voice.mjs series/specials/guide-<slug>.json            # all lines
node --env-file=.env scripts/voice.mjs series/specials/guide-<slug>.json --beat 3   # redo one line
# writes out/voice/guide-<slug>/NN.{mp3,json}; records hashes in series/renders/voice/guide-<slug>.json

# 2. Props: word frames, marks, total frames (copies the takes to public/local/voice/)
node scripts/guide-props.mjs series/specials/guide-<slug>.json
node scripts/guide-props.mjs series/specials/guide-<slug>.json --beats 1-3   # smoke-test cut
```

3. Template: src/templates/Guide<Name>.tsx. Import from `./guide-kit`; one `Page` per line; export
   `const Guide<Name>: React.FC<GuideProps> = (props) => <GuideShort {...props} pages={PAGES}
   summary={<footer line number>} cues={(m) => <>...</>} />`. Copy Guide64.tsx or GuideCords.tsx as
   the starting point.
4. Register in src/Root.tsx: import the template and
   `../series/specials/guide-<slug>.props.json`, and add `["Guide<Name>", Guide<Name>, guide<Name>]`
   to the Guide entries array (it sets 1080x1920, FPS and `durationInFrames` from `props.frames`).
5. Check stills before a full render, then render:

```sh
npx remotion still src/index.ts Guide<Name> out/guide/<slug>-check.png --frame=<n>
npx remotion render src/index.ts Guide<Name> out/guide/guide-<slug>.mp4
npx remotion render src/index.ts Guide<Name> out/guide/guide-<slug>-b1-3.mp4 \
  --props=series/specials/guide-<slug>-b1-3.props.json          # smoke-test cut
```

6. Share file: 720p, yuv420p, faststart, -16 LUFS (Instagram DMs reject the raw render):

```sh
ffmpeg -y -i out/guide/guide-<slug>.mp4 \
  -vf "scale=720:1280:in_range=full:out_range=tv,format=yuv420p" -c:v libx264 -crf 23 -preset slow \
  -af loudnorm=I=-16:TP=-1.5:LRA=11 -ar 48000 -c:a aac -b:a 128k -movflags +faststart \
  out/guide/guide-<slug>-720.mp4
ffmpeg -hide_banner -i out/guide/guide-<slug>-720.mp4 -af loudnorm=print_format=summary -f null - 2>&1 | grep "Input Integrated"
```

7. `npm test` (tests/copy.test.mjs checks every spec's narration for banned words).

## Review loop

1. Draft 1 in the spec. Write the Astra prompt to docs/research/<date>-codex-guide-<slug>-prompt.md
   (copy the guide-64 prompt: criteria fun in the Guide's dry register, clear to a newcomer, true to
   the text, honest hedges, no promised outcomes, plain words, the banned words, "I-Ching",
   English beside Chinese; answer VERDICT: ship or change with a full revision). Run:
   `codex exec -m gpt-6.1-sol -c model_reasoning_effort="high" -s read-only --skip-git-repo-check
   -C . -o docs/research/<date>-codex-guide-<slug>.md - < <prompt file>`
2. Converge on agreement, not a score: Opus and Astra each say ship or change until both choose
   the same wording. Rounds 1-2 at high effort, round 3 at xhigh; after that the user decides.
   Record the outcome in `about` ("Draft 2: Astra's revision, adopted as is, round 1").
3. A new look or a changed style gets a smoke test first (lines 1-3, `--beats 1-3`), sent to the
   user; wait for their view before the full render. A new entry in the settled look can go
   straight to a full render.
4. Send the 720p file. Send a finished render even with a known flaw, then fix and send the fix;
   don't overwrite a file the user hasn't seen.
5. Add or update the item in series/review/tracker.json (group "guides": stage, next, files,
   commit), and read the review board's verdicts before changing a sent short.
6. Commit the spec, voice record, props, template, Root.tsx and research with a plain message that
   says what changed and why; don't re-render for small polish.

## House rules

- Banned in our copy, any language: oracle, divination, fortune, prediction, mystical, magical;
  預測/预测 (prediction), 占卜 (divination), 算命 (fortune-telling), 神諭 (oracle). Fine as history
  ("people consulted it about the future", "used for divination for centuries"). Brand name
  8-Bit Oracle excepted.
- "I-Ching", hyphenated, in Guide narration and on screen (the user's choice for this format).
- English beside any Chinese, on screen and in messages to the user (the user does not read
  Chinese): 未濟 NOT YET ACROSS.
- Calm motion: no shake, punch, sway or beat-flashing.
- No AI images. Music, if any, 120 bpm or slower and matched to mood.
- Plain copy, no mannered prose, no "journey", "unlock", "ancient wisdom", "sacred".
- Captions for the post: one or two short sentences; the user writes the personal `note`.
- The voice is the user's designed Guide voice (hYDmtgsUa8Lf6Ql57aI5, "hitchiker's guide v1");
  it is synthetic, so posts carry the platforms' AI-content label.

## Other documentary or educational shorts

The same rules hold outside the Guide format (sources in the research note):

- The first frame shows the subject and the first sentence says what this is; viewers decide in
  about a second.
- One idea; leave out decoration that does not serve it (Mayer's coherence principle).
- Picture and words at the same moment (temporal contiguity); cue what matters (signaling).
- Most viewers watch muted, so keep text on screen, but let labels add facts rather than repeat
  the voice.
- Something new to see every 2-3 s; drawing-on and labels count, so camera moves can be few.
- Hold the payoff until the viewer knows why it matters; end on the sharpest line.
- Check facts against primary sources before the script is final.
