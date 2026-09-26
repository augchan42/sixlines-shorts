# Lesson methods: how each style is made

Written 2026-09-26, at the user's request ("make sure you've written down all the
methodologies that you have so far"). The styles and which hexagram gets which are in
[2026-09-26-lesson-styles.md](2026-09-26-lesson-styles.md); what Blender can do is in
[2026-09-26-blender-inventory.md](2026-09-26-blender-inventory.md). This file is how to make
them.

## What a lesson is for

A lesson helps a newcomer remember three things: the six lines, the two trigrams, and what
the hexagram means. It tells the story the way the neon characters do: engaging, fun,
minimal. The plain hexagram build, with its camera moves, is the benchmark: add as little
as possible to it. No punch, shake or sway over lines. No literal props (the lake, neon
signs, words on bars and searchlights were "cheesy").

## The loop for any new style

1. **Pick one hexagram** where the style is strongest.
2. **Write a special**: series/specials/NAME.json. It has the hexagram number, an
   `occasion` saying why the special exists, quoting the user, and the copy. Each line of
   the copy names its `source`: a commentary path, or "written".
3. **Render stills first.** For a Blender scene:
   `node scripts/lesson3d.mjs --special NAME --still FRAME --preview`. Take four frames
   across the act and join them into a strip with
   `magick a.png b.png c.png d.png +append strip.png`. Check that the picture reads before
   you render motion.
4. **Render the clip, then the short**: `node scripts/lesson3d.mjs --special NAME`, then
   `npm run series -- --special NAME`. The short goes to out/specials/NAME/share.mp4. Its
   render record (json, caption txt, LinkedIn txt) goes to series/renders/specials/ and is
   committed.
5. **Send a preview.** The user is on a remote computer, so send a small copy:
   `ffmpeg -i share.mp4 -c:v libx264 -crf 28 -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 128k preview.mp4`.
   Send it with SendUserFile, one file per call.
6. **Wait for the verdict.** Batch only after the user has seen one sample of the style.
7. **Critic.** Before sending, rate each decision from 1 to 10. Redo anything below 8.

## Lines act the picture (blender/bite.py, blender/bird.py)

In this style the hexagram's own slabs act out the picture that the Ten Wings see in them.
There are no added objects.

- **21 Biting Through** (bite.py, 100101): the lines are a mouth, with something between the
  jaws (the Tuan). The top and bottom lines are the jaws. They open from beat 2, then snap
  shut on the fourth line. The caught line is hidden at the snap and replaced by two halves.
  The halves scale and slide to the yin places, with an amber flash. The yin lines step
  back and dim. The result is 27, the empty mouth.
- **62 Preponderance of the Small** (bird.py, 001100): the two yang lines are the bird's
  body and the yin halves are its wings. The wings beat twice and the bird lifts 0.6. Then
  it glides down 2.2 with its wings held up 7°. It levels before the hold, because the
  Judgment says "not fitting to go up, fitting to go down".

How these scenes are built:

- **Reuse the build's look.** Take slabs, materials, rain, lights, bloom and render
  settings from blender/hexagram.py (`add_slab`, `obsidian`, `linear`, `rain_plane`,
  `lights_and_world`, `bloom`, `render_settings`). Take sizes from blender/layout.py
  (`LINE_W`, `YIN_GAP`, `line_z`, `frame_count`, `FPS`). The lesson then looks like the
  build it follows.
- **Move a group with a parent empty.** For example, bird.py parents every line to one
  "bird" empty, and that empty lifts and falls.
- **Hinge with empties.** A wing is a yin half parented to a hinge empty at the gap's edge.
  Turning the empty about y turns the half about its inner end. The sign flips per side
  (`-sx * angle`), so both wings rise together.
- **Key in beats.** `at(b) = round(b * 60 * FPS / bpm)`. Motion is keyed on beats, so it
  lands on the music. `ease(obj, index, points, path)` from bite.py keys a channel through
  a list of (frame, value) points with easing.
- **End the act 4 beats early.** The act is done by `beats - 4`, and the rest holds still
  while the sentence types.
- **The camera starts where the build ends**: square on, 13 units away. From there it may
  turn a little (18° on 62, so the wings show depth) and follow the subject at a lag. It
  never shakes.
- **Add a scene to the pipeline.** Add its name to the `scene.script` union in
  src/series/props.ts. The special's `lesson.scene` is `{script, args}`, and
  scripts/lesson3d.mjs turns `args` into flags. Every script accepts `--lines`, `--rain`,
  `--pixel`, `--edge`, `--bpm`, `--beats`, `--out`, `--still` and `--preview`.

## The readout (src/scenes/Readout.tsx)

The readout is a 2D Remotion screen in the style of the Nostromo computer in Alien:
phosphor green (#7dff8a), scanlines, a faint flicker, a frame and columns of numbers. It
needs no Blender render. It shows the hexagram's structure in Wang Bi's terms.

The order on screen:

1. **Plot.** A wireframe hexagram turns slowly (from -0.55 to 0.35 rad) and is plotted line
   by line, bottom first.
2. **Log.** Each line gets one row, with Wang Bi's place:
   - IN if it is in its place (yang in 1, 3, 5; yin in 2, 4, 6), OUT if not;
   - CENTRE for lines 2 and 5.
3. **Links.** Lines 1–4, 2–5 and 3–6 answer each other when one is yin and the other yang
   (應). A link joins each answering pair.
4. **Trigrams**, named with what they do, from Shuo Gua chapter 7: STRONG, YIELDING,
   MOVING, SINKING, STILL, ENTERING, CLINGING, JOYFUL.
5. **Master** (optional). The line Wang Bi names as the hexagram's master (主) turns amber
   (#ffb347). His phrase is shown in Chinese, with English beside it.
6. **Finding.** One line in capitals, from the Tuan Zhuan, e.g. "ONE YIELDING LINE. FIVE
   STRONG ANSWER."
7. **Answer.** The lesson sentence is typed with a block cursor.

Its data:

- **The special's copy:** `lesson.readout` = `{mark: [line indexes], finding?, master?: {zh, en}}`,
  and `readout_source` names where the master and finding come from.
- **The master:** from series/wangbi.json, written by
  `node --experimental-strip-types scripts/wangbi.mjs`. That script reads Wang Bi's own
  annotations in 8bitoracle-next/src/constants/wangBiZhu.ts and records the backend
  commit. Read the flagged ones (36, 44, 46) before use.
- **Length:** a readout with a master takes the held lesson's 16 beats (`HELD_LESSON_BEATS`),
  because it has more to log. Without a master it takes the usual length.
- **No whip cut** into a readout: the screen is its own transition.

## Neon character (blender/character.py)

- **Caption on top.** A character's caption goes at the top of the frame, and the clip moves
  down 260 px (`CHARACTER_DROP` in src/templates/Series.tsx) so the caption does not cover
  the drawing. On 47 the old bottom caption did cover it.
- **Length.** A character lesson is 4 beats longer than its drawing: 1 beat to see the
  finished character, then 3 for the sentence.

## Music

- **Tempo:** nothing above 120 bpm. For variety, use other sections of the tracks we have.
- **Match the mood.** Dark hexagrams get darker sections.
- **Shortlist dark windows:** `python3 music/moody.py` ranks 32 s windows by minor mode, a
  low spectral centroid (dark) and low loudness. It writes music/moody.json. It only picks
  what to listen to first; the user's ear decides. For 47, four candidates went to the
  user.

## End card

- **No ~DISNEYFAN credit.** The shorts have moved far from her edit (the user, 2026-09-26).
  `credit` defaults to false. A copy can still set `credit: true`.

## Commits

- Commit the code, specials and render records together, and push origin/series-64.
- Media stays out of git: out/, public/local, the fonts, and the music.
