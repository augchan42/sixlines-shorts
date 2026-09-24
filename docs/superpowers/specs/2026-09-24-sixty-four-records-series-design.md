# Sixty-Four Records: a short for each hexagram

## Goal

One ~30 s vertical short (1080×1920, 30 fps) for each of hexagrams 2–64, plus a series version of hexagram 1, promoting the Six Lines app and sixlines.day. Each short opens with a hook written for that hexagram, builds the hexagram in Blender, gives its meaning in the brand's voice, drops into app screens for that hexagram, and ends on a call to action that names the website. The prototype is `src/prototypes/Series1.tsx` (commit `f047833`).

Success means:

- any hexagram's short renders with one command, from committed code and data;
- every output can be traced to the code commit, source text and exact media files that produced it;
- the copy passes the brand's tone rules;
- all on-screen text stays inside the Instagram and TikTok safe zones.

## Decisions already made

| Topic | Decision |
|---|---|
| Music | Free-licence tracks, one per upper trigram. The sections are chosen and recorded in `music/sections.json`, with the Pixabay licence certificates kept locally. The Glowline track is not used in the series. |
| Length and loop | About 30 s. The last frame fades to black and the first frame is black, so the short loops. |
| Series name and badge | "SIXTY-FOUR RECORDS". The badge reads "N / 64 · SIXTY-FOUR RECORDS" and shows until the drop. |
| Hooks | One per hexagram. I draft all 63 new ones and the user approves them as one list. |
| Hashtags | 3–5 in the post caption only, never in the video. |
| Spelling | "I-Ching", hyphenated, everywhere. |
| CTA | It can say free. End card (user's review, 2026-09-24): the tagline "Reveal the moment.", then "sixlines.day". The brand is already on the card (credit and icon), so the line does not repeat "Six Lines". The post caption ends with "Reveal the moment. sixlines.day" (the user found "Explore the I-Ching for free" cheesy, 2026-09-24). |
| Jung and McKenna | Named in the post caption as lineage, not in the video. |
| Provenance | Nothing is thrown away. Code, data, prototypes and result files are committed. Media stays out of git (the repo is public), and its SHA-256 hashes are committed. |

## Structure of a short

Timing is in beats and counted from the drop `D`, the beat where the music's bass returns (`music/sections.json`, `drop` in seconds from the section start). With `B` = beats per second:

| Part | Beats | Content |
|---|---|---|
| Hook | 0 → 4 | 3–7 words: the viewer's situation, as a question, typed on black. The badge is on. |
| Hexagram | 4 → 4+H | The Blender clip for this hexagram and tempo, then 卦 · N · Pinyin · English. |
| Meaning | 4+H → D−4 | Two text groups of 3–6 words, each held at least 2 s, over a Yilin plate and code rain. |
| Question | D−4 → D | One open question over code rain, on the breakdown. |
| Showcase | D → D+20 | Four app screens with captions, 5 beats each (at least 2 s each at every chosen tempo). |
| End card | D+20 → D+27 | Credit, icon, "Reveal the moment.", "sixlines.day", fade to black. |

The hexagram part is `H` beats long, 8 by default, and the meaning runs from 4 + H to D−4. It needs at least 4 s (two groups of at least 2 s), so the timing is chosen in this order:

1. `H` = 8, if 12 → D−4 lasts at least 4 s. This applies to Qian, Zhen, Kan, Xun, Li and Dui.
2. `H` = 6, if 10 → D−4 lasts at least 4 s. This applies to Gen (D = 20 at 82.5 BPM): meaning 10 → 16 is 4.4 s and the short is 34.2 s.
3. Otherwise the meaning and question move after the drop: hook 0 → 4, hexagram 4 → 12, then meaning D → D+8, question D+8 → D+12, showcase D+12 → D+32 and end card D+32 → D+39. Where the hexagram ends before the drop, the gap holds the hexagram's last frame over code rain. This applies to Kun (D = 12 at 90 BPM, so the hexagram ends on the drop): 34.0 s.

Every part keeps its minimum (text groups and screens at least 2 s) and the total never exceeds 35 s. The timing test checks both for all 8 sections.

Text sizes: at least 52 px, bold, and 3–6 words per group. All text sits between y = 220 and y = 1500 (Instagram's top 220 px and bottom 420 px are clear). The hexagram names move up from their current place (`paddingBottom: 330`) to clear the bottom 420 px.

## Copy

Each short reads as one connected thought in plain words. Read aloud in order, the hook, the two lines and the question make sense as one short paragraph to someone who has never heard of the I-Ching.

| Part | Job |
|---|---|
| Hook | A real situation the viewer is in, as a question. |
| Line 1 | The hexagram's answer to the hook, usually "*Name* says: …". Variants such as "*Name*: …" or "The answer: …" keep the formula from going stale. |
| Line 2 | Why, or how, in everyday terms, continuing line 1. |
| Question | Turns it back to the viewer: something they could answer today. |

Imagery from the commentary (the mare, water, the back) that needs the source to make sense stays out of the video and goes in the post caption, where there is room to explain it.

Examples, as prototyped for hexagrams 2 and 52:

| # | Hook | Line 1 | Line 2 | Question |
|---|---|---|---|---|
| 1 | Waiting for a sign to start? | The Creative says: begin. | No conditions. Just mean it. | What would you start today? |
| 2 | Tired of always having to lead? | The Receptive says: follow well. | Supporting is its own strength. | Who could you back? |
| 29 | One problem after another? | The Abyss says: keep moving. | Like water: fill it, flow on. | What's the next small step? |
| 52 | Can't stop overthinking? | Keeping Still says: pause. | Stay with where you are now. | What can wait? |

The copy lives in `series/copy.json`, one entry per hexagram, with the source each line draws on:

```json
{
  "29": {
    "hook": { "text": "One problem after another?", "source": "commentary/en/29.json#judgment.synthesis" },
    "meaning": [
      { "text": "The Abyss says: keep moving.", "source": "commentary/en/29.json#judgment.synthesis" },
      { "text": "Like water: fill it, flow on.", "source": "commentary/en/29.json#image.synthesis" }
    ],
    "question": { "text": "What's the next small step?", "source": "written" }
  }
}
```

- Sources (in the sixlines-content repo): commentary `judgment.synthesis` and `image.synthesis`, the 8bitoracle-next `practicalIntegration` lines (which already speak to everyday situations), and the road beats for hook ideas. `source` names the file and field the line draws on, or says `written` when there is none.
- Tone rules, checked by a test: no "AI", "should", exclamation marks, "fortune", "predict", "magic", "supernatural" or "horoscope"; "I-Ching" is hyphenated; 吉 is "favorable" and 凶 is "adverse".
- Length limits, checked by a test: hook 3–7 words, meaning lines 3–6 words each, question at most 6 words. A test also checks that each line fits the frame at its font size, with explicit line breaks allowed.
- The user approves all 64 entries as one list before the batch render.

The post caption for each short (`caption.txt`) holds the hexagram's name; a written caption of 20–70 words from `series/copy.json` (`caption`, with its source, checked by the same tone rules) that continues the short's thought and explains the image the video leaves out; a lineage line where it fits (e.g. Jung's 1949 foreword, synchronicity); "Reveal the moment. sixlines.day"; and 3–5 hashtags. The user approves the captions with the copy.

## Data

`series/hexagrams.json` is generated by `scripts/series-table.mjs` and committed. It has one row per hexagram:

- `number`, `zh`, `pinyin`, `name`: from sixlines-content `content/commentary/en/N.json`.
- `lines`: bottom line first, 1 = yang, from the line labels in `content/iching/harvardYenchingHexagrams.json` (九 = yang, 六 = yin).
- `upper`: the upper trigram, from lines 4–6.
- `music`: that trigram's entry in `music/sections.json`.
- `copy`: that hexagram's entry in `series/copy.json`.
- `plates`: keys of the Yilin stipple plates used for the meaning backgrounds.
- `source`: the sixlines-content commit the row was built from.

An optional `series/overrides/N.ts` replaces any field for one hexagram. The template takes the merged row as its props, validated by a zod schema in `src/schema.ts`.

## Assets

Each kind of asset has its own script. Every script skips files that already exist, writes to gitignored folders, and records the SHA-256 of what it wrote.

- **Blender clips:** `npm run blender` with each hexagram's lines, the trigram track's BPM, and `beats = H` (8, or 6 for Gen). Hexagrams sharing an upper trigram share a tempo, so there are 64 clips. At an estimated 5–10 min each, a full run takes about 5–10 hours in the background.
- **App screens:** for each hexagram, the reading screen, the Yilin verse screen and the Almanac (Today) screen, captured by `SixLinesUITests/YilinGalleryScreenshotTests.swift` in sixlines-ios on the simulator and copied into `public/assets/screens/N/`. The Almanac is pinned with `--screenshot-date-YYYY-MM-DD` to the day that hexagram rules (`series/today-days.txt`: the day its 六日七分 tenure opens, on or after 2024-12-21). 坎離震兌 rule the seasons rather than days, so 29, 51, 30 and 58 use the winter solstice, spring equinox, summer solstice and autumn equinox, with `--screenshot-hexagram-N` (user, 2026-09-24). The ask screen is shared by all hexagrams.
- **Plates:** `npm run assets` is extended from hexagram 1 to all 64 (`yilin-stipple/N-k.webp` on cdn.sixlines.online).

## Rendering

`npm run series -- 29` renders one short; `npm run series -- all` renders every hexagram whose assets are present and reports the ones that are missing. For each short it writes to `out/series/NN-pinyin/`:

- `short.mp4`: the Remotion render;
- `share.mp4`: yuv420p, faststart, two-pass, under 25 MB;
- `caption.txt`: the post caption;
- `manifest.json`: the git commit and whether the tree was clean, the props, and the SHA-256 of the music file, its certificate, the Blender clip, every screen and plate, and both videos.

`manifest.json` and `caption.txt` are also copied to `series/renders/NN.json` and `series/renders/NN.txt` and committed, so the published record lives in git.

## Errors

- A missing Blender clip, screen, plate or music file stops that hexagram's render with the command that makes the missing file. In `all` mode, rendering continues with the next hexagram.
- A copy entry that fails the tone or length tests fails `npm test`, so it cannot reach a render.
- A music file whose SHA-256 differs from `music/sections.json` stops the render: the section times were measured on the recorded file.

## Testing

Added to `npm test`:

- timing counted from the drop: every part's start for a late drop and for Kun's early drop; the total length; screens held at least 2 s;
- the table: 64 rows, lines match the Harvard-Yenching labels for known cases (1, 2, 29, 63), upper trigram from lines 4–6;
- copy: every entry present, every line has a `source`, tone rules, length limits;
- manifest: the hashes it records match the files;
- the existing Blender, clip and music analysis tests.

Visual checks are manual: stills of each part for the first short of each trigram, reviewed before the batch render.

## Out of scope

- Uploading or scheduling posts.
- Music for hexagram 1's Gotchu version (it keeps the Glowline track, local only).
- Tracks beyond the 8 chosen sections.

## Notes to keep in mind

From the user's review of the prototypes (2026-09-24), not requirements yet:

- **The "Seinfeldification" of the lines.** The active lines (the 8bitoracle-next `practicalIntegration` texts) have an observational-comedy voice that would suit the shorts, but those lines run too long for 2 s on screen. Worth trying where a short, funny observation fits the hook or line 2.
- **Calmer music.** Most of the chosen tracks are driving, which was assumed to be the preferred mode, but Kun's slower, spacious track (Analog Dreams) stood out. Too early to change the other trigrams' music; revisit once a few shorts are out.
- **Transitions follow the music** (user, 2026-09-24). Driving tracks get energetic transitions; calm, harmonic tracks (Kun's Analog Dreams) get gentle ones. Research and a first classification of the 8 tracks (calm, building, steady, driving, from tempo and per-bar energy) are in `docs/research/2026-09-24-transitions.md`. Check whether Gen really counts as calm: the rule puts it there only for its tempo (82.5 BPM), and its energy is flat and high.
- **Use the Blender line look for transitions** (user, 2026-09-24): the thin glowing green yin and yang lines are the strongest visual. Candidates: a six-line slat wipe, a changing line (yang splits into yin), a single-line wipe, trigrams separating to reveal the screens, lines coming back together into the end card. This needs Blender to render with a transparent background.
- **Order of work:** finish Tasks 7 and 8 of the plan, then spec and build the transition library, then render the first short per trigram (Task 9), so the review sees the final transitions.
