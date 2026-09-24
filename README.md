# sixlines-shorts

Vertical promo shorts for Six Lines, rendered from code with [Remotion](https://www.remotion.dev).

The first composition, `Qian`, recreates the structure of the 2026-09-23 19:44 short
(downloaded to `public/local/shorts/` by `npm run assets`) for hexagram 1:

| Beats | Scene | What happens |
|-------|-------|--------------|
| 0–2 | Hook | "Best app?" typed on with a glow, flickering to condensed caps |
| 2–14 | Rivals | Three generic rival apps, each stamped "MOGGED" on its second beat |
| 14–18 | Turn | "BUT THIS…", the app icon rises from the bottom |
| 18–32 | Showcase | Icon over halftone art that changes every 2 beats; terminal captions every 4; punch-in |
| 32–42 | Montage | Hexagram builds, "A PATTERN TAKES SHAPE" over ink art, four app screens, pixel dissolve |
| 42–47 | End card | Creator credit, icon, call to action |

Every cut is placed on a beat grid (`bpm`, `firstBeat`), so a new track only needs those two numbers.

## Setup

```sh
npm install
npm run assets                                  # icon from ../sixlines-ios; Matrix-skin screens (sixlines.online/tour), stipple art and the reference shorts from the CDN
npm run assets -- --music path/to/track.m4a     # optional: music to public/local/music.m4a
npm run assets -- --hexagram 1,2                # stipple plates for these hexagrams (default 1)
```

`public/assets/` and `public/local/` are gitignored. The reference shorts stay out of git because their soundtracks are commercial tracks. Set `SIXLINES_IOS` if the iOS repo is not at `../sixlines-ios`.

3D pieces are rendered in Blender (5.2 or later), headless:

```sh
npm run blender -- --lines 111111 --bpm 110              # public/assets/3d/hexagram-111111-110bpm-4b.mp4
npm run blender -- --lines 111111 --bpm 110 --preview    # half size, low samples, for a quick look
```

`--lines` is bottom line first, 1 = yang. Set `BLENDER` if Blender is not in `/Applications`. Logs go to `out/`.

## Use

```sh
npm run studio                                  # preview and scrub in the browser
npm run render -- Qian out/qian.mp4             # 1080×1920, 30 fps, H.264
npm test                                        # clip naming (Node), slab layout and music analysis (Python) tests
```

A new short is a new spec in `src/specs/` (text, hexagram, art keys, screens, beat grid) registered in `src/Root.tsx`.
The props are validated by `src/schema.ts` and can be edited live in the studio.

## Layout

- `src/scenes/`: one component per scene
- `src/fx/`: RGB split, band slicing, grain and scanlines (`Glitch.tsx`); halftone and pixelation on a canvas (`ImageCanvas.tsx`); beat punches, handheld sway, shake and whip/zoom cuts over the whole frame (`Camera.tsx`, scheduled by `cameraPlan` in `src/Short.tsx`)
- `src/lib/timing.ts`: beat grid and deterministic jitter
- `src/specs/`: one file per short

## Music

The reference track in `public/local/` is taken from a CapCut export and is only for comparing timing locally.
Published shorts need a track licensed for commercial use.

Candidate tracks go in `public/local/music/` (not committed) with a `LICENCES.tsv` of file, title, licence and source URL.
`music/analyse.py` measures each track's tempo, first beat and per-bar energy and bass, and marks where the bass drops out and comes back:

```sh
python3 music/analyse.py public/local/music/*.mp3 > music/analysis.json
```

`music/analysis.json` is committed. It records each track's SHA-256, source and licence, and the commit of the script that produced it (`modified: true` if the script had uncommitted changes), so a short's beat grid can be traced to the exact audio file and code.

## License

Remotion is free for individuals, companies with up to 3 employees, and for evaluation. Larger companies need a
[company license](https://www.remotion.dev/license).
