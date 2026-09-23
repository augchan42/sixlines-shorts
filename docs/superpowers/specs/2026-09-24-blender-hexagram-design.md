# 3D hexagram build in Blender

Date: 2026-09-24. Status: design approved in conversation, awaiting review of this spec.

## Intent

The shorts are going to become a series of 64, one per hexagram. The user wants Blender-rendered 3D in them.
We agreed that 3D will supply a few hero moments inside the existing 2D templates, not replace the templates.
The first hero moment is the hexagram build. Every short has one, and it depends only on the six lines, so one
script can make it for all 64.

Success means:

- The 3D build replaces the flat 2D hexagram in the Gotchu template, and the section looks clearly better than
  the 2D version when the two are side by side.
- One command makes the clip for any hexagram and tempo without opening Blender.
- The clip lands on the beat grid exactly like the 2D scene it replaces.

What the user decided: hero moments (not per-family set pieces or a full 3D world), the hexagram build first,
the Matrix obsidian look, and Blender (not three.js inside Remotion).

Assumptions (not stated by the user): the first pass covers the Gotchu template only; the section length stays
at four beats; the hexagram's names stay as Remotion text.

## The shot

Four beats, the current hexagram section of the Gotchu template (beats 19–23, about 2.2s at 110 BPM).

- **Setting.** Black space. A far plane behind the slabs carries a faint green glyph rain. It shows mainly as
  reflections in the obsidian and sits soft in the depth of field.
- **Slabs.** Six glossy black slabs with bevelled edges and thin emissive edges in phosphor green `#6cff7a`.
  Spacing follows the site's OG image, as the 2D `Hexagram` does: lines 0.6 line-heights apart within a trigram,
  1.8 between the trigrams. A yin line is two slabs with a gap as in the 2D version (70px on a 620px line).
- **Build.** Lines land bottom to top, one every half-beat, on beats 0, 0.5, 1, 1.5, 2 and 2.5. Each slab rises
  from below the frame with a small overshoot, and a pulse of light runs along its edge as it lands. (In
  conversation this was "about two-thirds of a beat". Half-beats finish the stack by beat 2.5, before the
  push-in on beat 3, and keep the landings on the eighth-note grid.)
- **Camera.** Starts low and close on line 1, cranes up and orbits about 25° as the lines stack, and ends square
  on the whole hexagram. On beat 3 it pushes in, leading into the zoom cut that ends the section.
- **Remotion on top.** The Chinese name and "1 · Qián · The Creative" fade in over the clip, as in the 2D scene.
  The camera punches, RGB split, hit flash and grain keep working on top.

## Pipeline

### `blender/hexagram.py` (committed)

Builds the whole scene in code on each run, so there is no `.blend` file to keep in step with the code.

- Arguments after `--`: `--lines 111111` (bottom line first, 1 = yang), `--bpm 110`, `--beats 4`, `--rain <video>`,
  `--out <file.mp4>`, `--edge "#6cff7a"` (edge colour, green by default), `--preview`.
- Frame count: `ceil(beats × 60 / bpm × 30) + 1`. Section lengths in Remotion come from rounding absolute beat
  times, so a four-beat section is 65 or 66 frames depending on where it starts. The clip is always at least as
  long as the section.
- Render: EEVEE with raytraced reflections, depth of field and bloom (compositor glare), 1080×1920, 30fps, H.264
  at high quality. `--preview` renders 540×960 with low samples.

### Rain backdrop

A `RainPlate` composition renders `CodeRain` without its text box to `public/assets/3d/rain.mp4`. `CodeRain`
gets an option to leave the text box out. Blender maps the video onto the far plane, so the rain in the
reflections matches the rain in the breakdown.

### `scripts/blender.mjs` (`npm run blender`)

- `npm run blender -- --lines 111111 --bpm 110 --beats 4 [--preview]`.
- Renders the rain plate first if `public/assets/3d/rain.mp4` is missing.
- Finds Blender at `/Applications/Blender.app/Contents/MacOS/Blender`, or at `$BLENDER`.
- Writes `public/assets/3d/hexagram-111111-110bpm-4b.mp4` (gitignored with the other assets). Only the lines,
  tempo and length change the clip, so hexagrams that share them share one file.
- Checks the frame count with ffprobe after rendering.

### Remotion

- `gotchuSchema` gets an optional `hexagramClip` (a path under `public/`).
- New scene `src/scenes/Hexagram3D.tsx`: plays the clip with `<OffthreadVideo>` and draws the names over it.
- `Gotchu.tsx` uses `Hexagram3D` when `hexagramClip` is set and the 2D `Hexagram` when it isn't.
- `gotchu-qian.ts` sets `hexagramClip: "assets/3d/hexagram-111111-110bpm-4b.mp4"`.

## Testing

- Preview render first, with stills sent to the user to judge the look before any full-size render.
- Render hexagrams 1 (all yang), 2 (all yin) and 63 (alternating) to check the yin gap and the trigram spacing
  against the 2D version.
- Frame count checked by the wrapper, as above.
- In the short: a still at the hexagram section, a side-by-side with the 2D version, and a watch-through with the
  music to check the landings.

## Failures

- Blender not found: the wrapper stops and says to set `BLENDER`.
- Blender exits with an error: its log goes to `out/blender-<lines>.log` and the wrapper prints the path.
- Frame count too short: the wrapper fails with the expected and actual counts.
- `hexagramClip` set but the file is missing: the Remotion render fails with the path and the command that makes
  it. There is no silent fallback to 2D.
- A new tempo gives a new file name, so a clip made for another tempo is never played.

## Out of scope

- The Qian template's two-beat hexagram in the montage.
- Changing lines, the coin cast, flying into plates, stipple particles and the 3D phone. These are later hero
  moments and reuse this pipeline.
- A table of all 64 hexagrams' lines and names. The wrapper takes the lines directly for now.
- Per-family edge colours. The edge colour is a script argument with green as the default, so families can be
  added later without changing the design.
