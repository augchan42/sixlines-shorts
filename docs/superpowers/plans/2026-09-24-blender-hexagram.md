# 3D Hexagram Build Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat hexagram in the Gotchu template with a Blender-rendered build of obsidian slabs with green edges, made by one command for any hexagram and tempo.

**Architecture:** `blender/hexagram.py` builds the scene in code and renders a clip headless. `scripts/blender.mjs`
wraps it: it renders the glyph-rain backdrop from Remotion if missing, runs Blender, and checks the frame count.
Remotion plays the clip in a new `Hexagram3D` scene when the spec sets `hexagramClip`. Clip names and lengths
come from one TypeScript module shared by the specs and the wrapper.

**Tech Stack:** Blender 5.2.2 LTS (EEVEE, Python API), Remotion 4.0.527, Node 22.22 (runs `.ts` imports and
`node --test`), Python 3.14 `unittest`, ffmpeg/ffprobe.

**Spec:** `docs/superpowers/specs/2026-09-24-blender-hexagram-design.md`

## Global Constraints

- Output 1080×1920, 30fps, H.264 MP4. Preview: 540×960.
- Edge colour default `#6cff7a`. Obsidian base near-black, glossy.
- Clip path: `public/assets/3d/hexagram-<lines>-<bpm>bpm-<beats>b.mp4`, with `-preview` before `.mp4` for previews.
  `<lines>` is bottom line first, 1 = yang.
- Clip frames: `ceil(beats × 60 × 30 / bpm) + 1`.
- Lines land on beats 0, 0.5, 1, 1.5, 2, 2.5 of the section; the push-in starts on beat 3.
- Blender 5.2 API facts, confirmed by a test render: engine id `BLENDER_EEVEE`; video output needs
  `image_settings.media_type = "VIDEO"` before `file_format = "FFMPEG"`; the compositor is a
  `CompositorNodeTree` assigned to `scene.compositing_node_group` with a `NodeGroupOutput` and an `Image` output
  socket; Glare settings are input sockets (`inputs["Type"].default_value = "Bloom"`); Principled BSDF inputs are
  `Base Color`, `Roughness`, `Coat Weight`, `Emission Color`, `Emission Strength`.
- Blender must run with `--python-exit-code 1`, otherwise a Python error still exits 0.
- `public/assets/` and `out/` are gitignored; generated clips and logs never go in git.
- Do not run prettier on whole files: the repo's files don't match its prettier config, and a full reformat
  buries the change. Match the surrounding style by hand.
- Commit messages end with:
  `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>` and
  `Claude-Session: https://claude.ai/code/session_016Z9BbdP28sZoh3uZowjvws`.

## Review Focus

1. Bad `--lines` (five or seven characters, letters): the wrapper should refuse before starting Blender, naming
   the expected format. Tested in Task 5.
2. A preview clip being played as the real one: preview renders get their own file name. Tested in Task 1.
3. A clip made for another hexagram or tempo, or not made at all: the Remotion render should fail with the
   expected path and the command that makes it. Checked in Task 6.
4. A tempo with decimals (107.4 BPM, her track): the file name must stay stable and readable. Tested in Task 1.
5. A clip one frame short because the section starts on a different sub-frame offset: the clip must cover the
   section for any first-beat offset. Tested in Task 1.

## File Structure

- Create `src/lib/clips.ts`: clip path and frame count. No imports, so Node and Remotion can both load it.
- Create `tests/clips.test.mjs`, `tests/blender-args.test.mjs`: `node --test` suites.
- Create `blender/layout.py`: slab positions and landing frames, no `bpy`. Create `blender/test_layout.py`.
- Create `blender/hexagram.py`: builds and renders the scene.
- Create `scripts/blender-args.mjs`: argument parsing for the wrapper. Create `scripts/blender.mjs`: the wrapper.
- Create `src/scenes/Hexagram3D.tsx`: plays the clip, fades in the names.
- Modify `src/scenes/CodeRain.tsx`: `showText` option. `src/scenes/Montage.tsx`: export `HexagramTitle`.
- Modify `src/Root.tsx`: `RainPlate` composition; clip check in GotchuQian's `calculateMetadata`.
- Modify `src/schema.ts`, `src/templates/Gotchu.tsx`, `src/specs/gotchu-qian.ts`, `package.json`, `README.md`.

---

### Task 1: Clip names and lengths

**Files:**
- Create: `src/lib/clips.ts`
- Create: `tests/clips.test.mjs`
- Modify: `package.json` (scripts)

**Interfaces:**
- Produces: `CLIP_FPS = 30`; `clipFrames(beats: number, bpm: number): number`;
  `hexagramClip(lines: readonly number[], bpm: number, beats: number, preview?: boolean): string`
  (public/-relative path).

- [ ] **Step 1: Write the failing tests**

`tests/clips.test.mjs`:

```js
import assert from "node:assert/strict";
import test from "node:test";
import { clipFrames, hexagramClip } from "../src/lib/clips.ts";
import { beatFrame } from "../src/lib/timing.ts";

test("clip names carry the lines, tempo and length", () => {
  assert.equal(hexagramClip([1, 1, 1, 1, 1, 1], 110, 4), "assets/3d/hexagram-111111-110bpm-4b.mp4");
  assert.equal(hexagramClip([1, 0, 1, 0, 1, 0], 107.4, 4), "assets/3d/hexagram-101010-107.4bpm-4b.mp4");
});

test("preview clips never share a name with full renders", () => {
  assert.equal(hexagramClip([1, 1, 1, 1, 1, 1], 110, 4, true), "assets/3d/hexagram-111111-110bpm-4b-preview.mp4");
});

test("a clip covers its section wherever the section starts", () => {
  for (const bpm of [107.4, 110, 120, 129.8]) {
    for (let i = 0; i < 100; i++) {
      const grid = { fps: 30, bpm, firstBeat: i / 100 };
      const section = beatFrame(grid, 23) - beatFrame(grid, 19);
      assert.ok(clipFrames(4, bpm) >= section, `${bpm} BPM, first beat ${grid.firstBeat}s`);
    }
  }
});

test("frame count matches blender/layout.py", () => {
  assert.equal(clipFrames(4, 110), 67);
});
```

- [ ] **Step 2: Add the test script and run it to verify it fails**

In `package.json` `scripts`, add after `"typecheck"`:

```json
    "test": "node --test 'tests/*.test.mjs' && python3 -m unittest discover -s blender -p 'test_*.py'",
```

Run: `node --test 'tests/clips.test.mjs'`
Expected: FAIL, cannot find module `src/lib/clips.ts`.

- [ ] **Step 3: Implement**

`src/lib/clips.ts`:

```ts
// Names and lengths of the clips rendered by blender/hexagram.py. Shared by the specs and
// scripts/blender.mjs, so it has no imports.

export const CLIP_FPS = 30;

// Frames rendered for a section of `beats` beats. Section lengths come from rounding
// absolute beat times, so this is always at least as many as the section takes.
export const clipFrames = (beats: number, bpm: number) => Math.ceil((beats * 60 * CLIP_FPS) / bpm) + 1;

// public/-relative path of a hexagram clip. Only the lines (bottom first), tempo and
// length change the clip, so hexagrams that share them share a file.
export const hexagramClip = (lines: readonly number[], bpm: number, beats: number, preview = false) =>
  `assets/3d/hexagram-${lines.join("")}-${bpm}bpm-${beats}b${preview ? "-preview" : ""}.mp4`;
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test 'tests/clips.test.mjs' && npm run typecheck`
Expected: 4 tests pass; typecheck clean. If importing `timing.ts` fails in Node because of the `remotion`
import, copy `beatFrame` into the test as a local function with a comment saying it mirrors
`src/lib/timing.ts`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/clips.ts tests/clips.test.mjs package.json
git commit -m "Add shared clip names and lengths for Blender renders" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_016Z9BbdP28sZoh3uZowjvws"
```

---

### Task 2: Slab layout and landing times

**Files:**
- Create: `blender/layout.py`
- Create: `blender/test_layout.py`

**Interfaces:**
- Produces (Python): `FPS = 30`, `LINE_W = 6.2`, `LINE_H = 0.5`, `LINE_GAP = 0.3`, `TRIGRAM_GAP = 0.9`,
  `YIN_GAP = 0.7`; `frame_count(beats, bpm) -> int`; `land_frame(line, bpm) -> int` (clip frame from 0);
  `line_z(line) -> float`; `slabs(lines: str) -> list[tuple[int, float, float, float]]` as
  `(line, x_centre, z_centre, width)`.

- [ ] **Step 1: Write the failing tests**

`blender/test_layout.py`:

```python
import unittest

from layout import LINE_GAP, LINE_H, LINE_W, TRIGRAM_GAP, YIN_GAP, frame_count, land_frame, line_z, slabs


class LayoutTest(unittest.TestCase):
    def test_yang_lines_are_one_full_width_slab(self):
        s = slabs("111111")
        self.assertEqual(len(s), 6)
        self.assertTrue(all(w == LINE_W and x == 0 for _, x, _, w in s))

    def test_yin_lines_are_two_slabs_with_the_gap(self):
        s = slabs("000000")
        self.assertEqual(len(s), 12)
        (_, xl, _, wl), (_, xr, _, wr) = s[0], s[1]
        self.assertAlmostEqual((xr - wr / 2) - (xl + wl / 2), YIN_GAP)
        self.assertAlmostEqual((xr + wr / 2) - (xl - wl / 2), LINE_W)

    def test_mixed_lines_keep_their_order(self):
        s = slabs("101010")
        self.assertEqual([line for line, *_ in s], [0, 1, 1, 2, 3, 3, 4, 5, 5])

    def test_gaps_follow_the_og_image(self):
        self.assertAlmostEqual((line_z(1) - LINE_H / 2) - (line_z(0) + LINE_H / 2), LINE_GAP)
        self.assertAlmostEqual((line_z(3) - LINE_H / 2) - (line_z(2) + LINE_H / 2), TRIGRAM_GAP)

    def test_hexagram_is_centred(self):
        self.assertAlmostEqual(line_z(0), -line_z(5))

    def test_lines_land_on_half_beats(self):
        self.assertEqual([land_frame(i, 110) for i in range(6)], [0, 8, 16, 25, 33, 41])

    def test_frame_count_matches_clips_ts(self):
        self.assertEqual(frame_count(4, 110), 67)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run to verify they fail**

Run: `python3 -m unittest discover -s blender -p 'test_*.py'`
Expected: FAIL, `ModuleNotFoundError: No module named 'layout'`.

- [ ] **Step 3: Implement**

`blender/layout.py`:

```python
"""Slab layout and timing for the 3D hexagram, without bpy so it can be unit-tested.

One Blender unit is 100px of the 2D Hexagram in src/scenes/Montage.tsx, whose spacing
follows the site's OG image.
"""

import math

FPS = 30
LINE_W = 6.2  # 620px
LINE_H = 0.5  # LINE = 50px
LINE_GAP = 0.3  # LINE * 0.6, between lines of a trigram
TRIGRAM_GAP = 0.9  # LINE * 1.8, between the trigrams
YIN_GAP = 0.7  # 70px, the break in a yin line


def frame_count(beats, bpm):
    """Frames to render; the same formula as clipFrames in src/lib/clips.ts."""
    return math.ceil(beats * 60 * FPS / bpm) + 1


def land_frame(line, bpm):
    """Clip frame (from 0) on which a line lands. Line 0 is the bottom; one every half-beat."""
    return round(line * 0.5 * 60 * FPS / bpm)


def line_z(line):
    """Centre height of a line, with the whole hexagram centred on z = 0."""
    total = 6 * LINE_H + 4 * LINE_GAP + TRIGRAM_GAP
    z = -total / 2 + LINE_H / 2 + line * (LINE_H + LINE_GAP)
    return z + (TRIGRAM_GAP - LINE_GAP if line >= 3 else 0)


def slabs(lines):
    """(line, x_centre, z_centre, width) per slab. `lines` is bottom first, "1" = yang."""
    out = []
    for i, ch in enumerate(lines):
        z = line_z(i)
        if ch == "1":
            out.append((i, 0.0, z, LINE_W))
        else:
            w = (LINE_W - YIN_GAP) / 2
            offset = (YIN_GAP + w) / 2
            out += [(i, -offset, z, w), (i, offset, z, w)]
    return out
```

- [ ] **Step 4: Run to verify they pass**

Run: `python3 -m unittest discover -s blender -p 'test_*.py'`
Expected: 7 tests OK.

- [ ] **Step 5: Commit**

```bash
git add blender/layout.py blender/test_layout.py
git commit -m "Add slab layout and landing times for the 3D hexagram" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_016Z9BbdP28sZoh3uZowjvws"
```

---

### Task 3: Glyph-rain backdrop

**Files:**
- Modify: `src/scenes/CodeRain.tsx` (props and the text block)
- Modify: `src/Root.tsx` (new composition)

**Interfaces:**
- Produces: `CodeRain` prop `showText?: boolean` (default `true`); composition id `RainPlate` (1080×1920, 30fps,
  120 frames), rendered by Task 5 to `public/assets/3d/rain.mp4`.

- [ ] **Step 1: Add `showText` to CodeRain**

Change the signature and wrap the text block:

```tsx
// Falling green glyphs, then a line of text typed over them. Each cut slams a full-bleed
// plate in behind the text, with the rain thinned over it. With `showText` off it is
// just the rain, as the backdrop for the Blender hexagram.
export const CodeRain: React.FC<{ text: string; cuts?: PlateCut[]; showText?: boolean }> = ({
  text,
  cuts = [],
  showText = true,
}) => {
```

and change `<AbsoluteFill style={{ justifyContent: "center", padding: "0 70px" }}>` … `</AbsoluteFill>` (the
text block) to render only when `showText` is true:

```tsx
      {showText && (
        <AbsoluteFill style={{ justifyContent: "center", padding: "0 70px" }}>
          {/* existing text div unchanged */}
        </AbsoluteFill>
      )}
```

- [ ] **Step 2: Register `RainPlate` in `src/Root.tsx`**

Add `import { CodeRain } from "./scenes/CodeRain";` and, before `</>`:

```tsx
    {/* The glyph rain alone, as the backdrop texture for blender/hexagram.py. */}
    <Composition
      id="RainPlate"
      component={() => <CodeRain text="" showText={false} />}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={120}
    />
```

- [ ] **Step 3: Verify**

Run: `npm run typecheck && npx remotion still src/index.ts RainPlate out/rain-still.png --frame=60 --log=error`
Expected: typecheck clean; the still shows green glyph rain on black with no text box. Also check the breakdown
still has its text: `npx remotion still src/index.ts GotchuQian out/breakdown.png --frame=400 --log=error`
shows "LETS CONTINUE..".

- [ ] **Step 4: Commit**

```bash
git add src/scenes/CodeRain.tsx src/Root.tsx
git commit -m "Add a RainPlate composition: the glyph rain without text" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_016Z9BbdP28sZoh3uZowjvws"
```

---

### Task 4: Blender scene script

**Files:**
- Create: `blender/hexagram.py`

**Interfaces:**
- Consumes: `blender/layout.py` (Task 2); the rain video from Task 3.
- Produces: CLI `Blender -b --factory-startup --python-exit-code 1 -P blender/hexagram.py -- --lines <6 chars>
  --bpm <n> --beats <n> --rain <video> --out <mp4> [--edge #rrggbb] [--preview]`, writing an MP4 of
  `frame_count(beats, bpm)` frames.

- [ ] **Step 1: Write the script**

`blender/hexagram.py`:

```python
"""Renders the 3D hexagram build: obsidian slabs with glowing edges landing bottom to top
on half-beats, over a glyph-rain backdrop, while the camera cranes up and pushes in.

Run through scripts/blender.mjs (npm run blender), or directly:
  Blender -b --factory-startup --python-exit-code 1 -P blender/hexagram.py -- \
    --lines 111111 --bpm 110 --beats 4 --rain public/assets/3d/rain.mp4 --out out/hex.mp4
"""

import argparse
import math
import os
import sys

import bpy

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from layout import FPS, LINE_H, frame_count, land_frame, slabs  # noqa: E402

DEPTH = 0.45  # slab thickness front to back
RISE = 6  # frames from below the frame to landed
REST, PULSE = 6.0, 60.0  # edge emission strength at rest and as a line lands


def parse():
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--lines", required=True)
    p.add_argument("--bpm", type=float, required=True)
    p.add_argument("--beats", type=float, required=True)
    p.add_argument("--rain", required=True)
    p.add_argument("--out", required=True)
    p.add_argument("--edge", default="#6cff7a")
    p.add_argument("--preview", action="store_true")
    return p.parse_args(argv)


def linear(hex_colour):
    """#rrggbb (sRGB) to linear RGBA, as Blender colour inputs expect."""
    c = [int(hex_colour.lstrip("#")[i : i + 2], 16) / 255 for i in (0, 2, 4)]
    return (*[x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c], 1.0)


def key(obj, path, frame, index=-1):
    """Keyframe at a clip frame (from 0); Blender's frames start at 1."""
    obj.keyframe_insert(path, frame=frame + 1, index=index)


def obsidian():
    m = bpy.data.materials.new("obsidian")
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (0.004, 0.005, 0.004, 1)
    b.inputs["Roughness"].default_value = 0.06
    b.inputs["Coat Weight"].default_value = 1.0
    return m


def edge(colour, name):
    """An emissive material for one slab's bevels; returns it and its strength input to animate."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = colour
    b.inputs["Emission Color"].default_value = colour
    b.inputs["Emission Strength"].default_value = REST
    return m, b.inputs["Emission Strength"]


def add_slab(i, x, z, w, black, colour):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, 0, z))
    o = bpy.context.object
    o.name = f"line{i}"
    o.scale = (w, DEPTH, LINE_H)
    bpy.ops.object.transform_apply(scale=True)
    o.data.materials.append(black)
    glow, strength = edge(colour, f"edge-{o.name}")
    o.data.materials.append(glow)
    # The bevel faces take material slot 1, the glowing edge.
    bevel = o.modifiers.new("bevel", "BEVEL")
    bevel.width = 0.035
    bevel.segments = 2
    bevel.material = 1
    return o, strength


def animate_slab(o, strength, z, land):
    """Hidden until it starts to rise, then rises from below the frame, overshoots and settles."""
    start = land - RISE
    o.hide_render = True
    key(o, "hide_render", start - 1)
    o.hide_render = False
    key(o, "hide_render", start)
    for frame, dz in ((start, -4.5), (land, 0.08), (land + 3, 0.0)):
        o.location.z = z + dz
        key(o, "location", frame, index=2)
    for frame, value in ((land - 1, REST), (land, PULSE), (land + 10, REST)):
        strength.default_value = value
        strength.keyframe_insert("default_value", frame=frame + 1)


def rain_plane(path):
    """The glyph rain on a far plane behind the slabs, looping."""
    bpy.ops.mesh.primitive_plane_add(size=1, location=(0, 10, -1), rotation=(math.radians(90), 0, 0))
    plane = bpy.context.object
    plane.scale = (24, 40, 1)
    m = bpy.data.materials.new("rain")
    m.use_nodes = True
    nodes, links = m.node_tree.nodes, m.node_tree.links
    nodes.clear()
    img = bpy.data.images.load(os.path.abspath(path))
    img.source = "MOVIE"
    tex = nodes.new("ShaderNodeTexImage")
    tex.image = img
    tex.image_user.frame_duration = img.frame_duration
    tex.image_user.use_auto_refresh = True
    tex.image_user.use_cyclic = True
    emit = nodes.new("ShaderNodeEmission")
    emit.inputs["Strength"].default_value = 0.8
    out = nodes.new("ShaderNodeOutputMaterial")
    links.new(tex.outputs["Color"], emit.inputs["Color"])
    links.new(emit.outputs["Emission"], out.inputs["Surface"])
    plane.data.materials.append(m)


def camera(scene, frames, bpm):
    """Low and close on line 1, crane up and orbit 25° to square-on by beat 2.75, push in from beat 3."""
    target = bpy.data.objects.new("target", None)
    scene.collection.objects.link(target)
    data = bpy.data.cameras.new("camera")
    data.lens = 35
    data.dof.use_dof = True
    data.dof.focus_object = target
    data.dof.aperture_fstop = 2.0
    cam = bpy.data.objects.new("camera", data)
    scene.collection.objects.link(cam)
    scene.camera = cam
    track = cam.constraints.new("TRACK_TO")
    track.target = target
    track.track_axis = "TRACK_NEGATIVE_Z"
    track.up_axis = "UP_Y"
    beat = 60 * FPS / bpm
    # (clip frame, orbit angle, distance, camera height, target height). The final target
    # sits below the hexagram's centre so it frames above the names, as the 2D version does.
    for frame, deg, dist, cz, tz in (
        (0, 25, 5.0, -2.6, -2.3),
        (round(2.75 * beat), 0, 13.0, -1.0, -1.0),
        (round(3 * beat), 0, 13.0, -1.0, -1.0),
        (frames - 1, 0, 9.0, -1.0, -1.0),
    ):
        a = math.radians(deg)
        cam.location = (dist * math.sin(a), -dist * math.cos(a), cz)
        key(cam, "location", frame)
        target.location = (0, 0, tz)
        key(target, "location", frame)


def lights_and_world(scene):
    world = bpy.data.worlds.new("black")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0
    scene.world = world
    light = bpy.data.lights.new("key", "AREA")
    light.energy = 300
    light.size = 6
    light.color = (0.85, 1.0, 0.9)
    obj = bpy.data.objects.new("key", light)
    obj.location = (0, -6, 6)
    obj.rotation_euler = (math.radians(45), 0, 0)
    scene.collection.objects.link(obj)


def bloom(scene):
    tree = bpy.data.node_groups.new("bloom", "CompositorNodeTree")
    tree.interface.new_socket("Image", in_out="OUTPUT", socket_type="NodeSocketColor")
    layers = tree.nodes.new("CompositorNodeRLayers")
    glare = tree.nodes.new("CompositorNodeGlare")
    glare.inputs["Type"].default_value = "Bloom"
    glare.inputs["Threshold"].default_value = 1.0
    glare.inputs["Strength"].default_value = 0.6
    glare.inputs["Size"].default_value = 0.6
    out = tree.nodes.new("NodeGroupOutput")
    tree.links.new(layers.outputs["Image"], glare.inputs["Image"])
    tree.links.new(glare.outputs["Image"], out.inputs[0])
    scene.compositing_node_group = tree


def render_settings(scene, frames, out, preview):
    scene.render.engine = "BLENDER_EEVEE"
    scene.eevee.use_raytracing = True
    scene.eevee.taa_render_samples = 16 if preview else 64
    scene.render.resolution_x, scene.render.resolution_y = (540, 960) if preview else (1080, 1920)
    scene.render.resolution_percentage = 100
    scene.render.fps = FPS
    scene.frame_start, scene.frame_end = 1, frames
    scene.view_settings.view_transform = "Standard"
    scene.render.image_settings.media_type = "VIDEO"
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format = "MPEG4"
    scene.render.ffmpeg.codec = "H264"
    scene.render.ffmpeg.constant_rate_factor = "PERC_LOSSLESS"
    scene.render.ffmpeg.ffmpeg_preset = "GOOD"
    scene.render.filepath = os.path.abspath(out)


def main():
    args = parse()
    scene = bpy.context.scene
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o)
    frames = frame_count(args.beats, args.bpm)
    black, colour = obsidian(), linear(args.edge)
    for i, x, z, w in slabs(args.lines):
        o, strength = add_slab(i, x, z, w, black, colour)
        animate_slab(o, strength, z, land_frame(i, args.bpm))
    rain_plane(args.rain)
    camera(scene, frames, args.bpm)
    lights_and_world(scene)
    bloom(scene)
    render_settings(scene, frames, args.out, args.preview)
    bpy.ops.render.render(animation=True)


main()
```

- [ ] **Step 2: Make a rain plate and render a preview directly**

Run:

```bash
npx remotion render src/index.ts RainPlate public/assets/3d/rain.mp4 --log=error
/Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup --python-exit-code 1 -P blender/hexagram.py -- \
  --lines 101010 --bpm 110 --beats 4 --rain public/assets/3d/rain.mp4 --out out/hex-test.mp4 --preview > out/blender-test.log 2>&1
echo "exit $?"
ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames,width,height -of csv=p=0 out/hex-test.mp4
```

Expected: `exit 0`; `540,960,67`. If the exit is non-zero, the traceback is at the end of
`out/blender-test.log`; fix the API call it names and rerun.

- [ ] **Step 3: Look at it**

```bash
for f in 5 20 45 60; do ffmpeg -v error -y -ss $(echo "$f/30" | bc -l) -i out/hex-test.mp4 -frames:v 1 out/hex-$f.png; done
ffmpeg -v error -y -i out/hex-5.png -i out/hex-20.png -i out/hex-45.png -i out/hex-60.png -filter_complex hstack=4 out/hex-sheet.png
```

Expected: at frame 5 line 1 is close and low with glowing edges; at 20 three lines; at 45 all six square-on with
the trigram gap and yin breaks visible, rain soft behind; at 60 pushed in. Tune only the numbers (camera keys,
`REST`/`PULSE`, glare, light energy) until it reads well, and send the sheet to the user for the look before
Task 5.

- [ ] **Step 4: Commit**

```bash
git add blender/hexagram.py
git commit -m "Add the Blender script that builds and renders the 3D hexagram" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_016Z9BbdP28sZoh3uZowjvws"
```

---

### Task 5: `npm run blender` wrapper

**Files:**
- Create: `scripts/blender-args.mjs`
- Create: `tests/blender-args.test.mjs`
- Create: `scripts/blender.mjs`
- Modify: `package.json` (script), `README.md`

**Interfaces:**
- Consumes: `clipFrames`, `hexagramClip` (Task 1); `blender/hexagram.py` CLI (Task 4); `RainPlate` (Task 3).
- Produces: `parseBlenderArgs(argv: string[]) => { lines: number[], bpm: number, beats: number, edge: string,
  preview: boolean }`; command `npm run blender -- --lines 111111 --bpm 110 [--beats 4] [--edge #rrggbb]
  [--preview]` writing `public/<hexagramClip(...)>`.

- [ ] **Step 1: Write the failing tests**

`tests/blender-args.test.mjs`:

```js
import assert from "node:assert/strict";
import test from "node:test";
import { parseBlenderArgs } from "../scripts/blender-args.mjs";

test("reads lines bottom first, with defaults", () => {
  assert.deepEqual(parseBlenderArgs(["--lines", "101010", "--bpm", "110"]), {
    lines: [1, 0, 1, 0, 1, 0],
    bpm: 110,
    beats: 4,
    edge: "#6cff7a",
    preview: false,
  });
});

test("reads beats, edge and preview", () => {
  const a = parseBlenderArgs(["--lines", "111111", "--bpm", "107.4", "--beats", "2", "--edge", "#ffb23f", "--preview"]);
  assert.equal(a.bpm, 107.4);
  assert.equal(a.beats, 2);
  assert.equal(a.edge, "#ffb23f");
  assert.equal(a.preview, true);
});

test("rejects lines that are not six 0s and 1s", () => {
  for (const lines of ["11111", "1111111", "11a111"]) {
    assert.throws(() => parseBlenderArgs(["--lines", lines, "--bpm", "110"]), /six 0s and 1s/);
  }
  assert.throws(() => parseBlenderArgs(["--bpm", "110"]), /six 0s and 1s/);
});

test("rejects a missing or non-positive tempo or length", () => {
  assert.throws(() => parseBlenderArgs(["--lines", "111111"]), /--bpm/);
  assert.throws(() => parseBlenderArgs(["--lines", "111111", "--bpm", "0"]), /--bpm/);
  assert.throws(() => parseBlenderArgs(["--lines", "111111", "--bpm", "110", "--beats", "-1"]), /--beats/);
});

test("rejects an edge colour that is not #rrggbb", () => {
  assert.throws(() => parseBlenderArgs(["--lines", "111111", "--bpm", "110", "--edge", "green"]), /--edge/);
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `node --test 'tests/blender-args.test.mjs'`
Expected: FAIL, cannot find module `scripts/blender-args.mjs`.

- [ ] **Step 3: Implement the parser**

`scripts/blender-args.mjs`:

```js
// Arguments for scripts/blender.mjs, kept apart so they can be tested without running Blender.

export const parseBlenderArgs = (argv) => {
  const get = (flag) => {
    const i = argv.indexOf(flag);
    return i === -1 ? undefined : argv[i + 1];
  };
  const lines = get("--lines");
  if (!lines || !/^[01]{6}$/.test(lines)) {
    throw new Error(`--lines must be six 0s and 1s, bottom line first, 1 = yang (got ${lines ?? "nothing"})`);
  }
  const bpm = Number(get("--bpm"));
  if (!(bpm > 0)) throw new Error(`--bpm must be a positive number (got ${get("--bpm") ?? "nothing"})`);
  const beats = Number(get("--beats") ?? 4);
  if (!(beats > 0)) throw new Error(`--beats must be a positive number (got ${get("--beats")})`);
  const edge = get("--edge") ?? "#6cff7a";
  if (!/^#[0-9a-fA-F]{6}$/.test(edge)) throw new Error(`--edge must be a colour like #6cff7a (got ${edge})`);
  return { lines: [...lines].map(Number), bpm, beats, edge, preview: argv.includes("--preview") };
};
```

- [ ] **Step 4: Run to verify they pass**

Run: `node --test 'tests/blender-args.test.mjs'`
Expected: 5 tests pass.

- [ ] **Step 5: Write the wrapper**

`scripts/blender.mjs`:

```js
// Renders the 3D hexagram build (blender/hexagram.py) into public/assets/3d/ (gitignored).
//
//   npm run blender -- --lines 111111 --bpm 110 [--beats 4] [--edge "#6cff7a"] [--preview]
//
// Renders the glyph-rain backdrop from Remotion first if it is missing. Set BLENDER if
// Blender is not in /Applications.

import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { clipFrames, hexagramClip } from "../src/lib/clips.ts";
import { parseBlenderArgs } from "./blender-args.mjs";

const root = path.resolve(import.meta.dirname, "..");
const blender = process.env.BLENDER ?? "/Applications/Blender.app/Contents/MacOS/Blender";

let args;
try {
  args = parseBlenderArgs(process.argv.slice(2));
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
if (!existsSync(blender)) {
  console.error(`Blender not found at ${blender}. Set BLENDER to the Blender executable.`);
  process.exit(1);
}

const rain = path.join(root, "public/assets/3d/rain.mp4");
if (!existsSync(rain)) {
  console.log("rendering the glyph-rain backdrop");
  mkdirSync(path.dirname(rain), { recursive: true });
  execFileSync("npx", ["remotion", "render", "src/index.ts", "RainPlate", rain, "--log=error"], { cwd: root, stdio: "inherit" });
}

const lines = args.lines.join("");
const out = path.join(root, "public", hexagramClip(args.lines, args.bpm, args.beats, args.preview));
const log = path.join(root, "out", `blender-${lines}.log`);
mkdirSync(path.dirname(log), { recursive: true });
// A clip left from an earlier run must not pass for this one.
rmSync(out, { force: true });

console.log(`rendering ${path.relative(root, out)}`);
const run = spawnSync(
  blender,
  [
    "-b", "--factory-startup", "--python-exit-code", "1", "-P", path.join(root, "blender/hexagram.py"), "--",
    "--lines", lines, "--bpm", String(args.bpm), "--beats", String(args.beats),
    "--rain", rain, "--out", out, "--edge", args.edge, ...(args.preview ? ["--preview"] : []),
  ],
  { encoding: "utf8", maxBuffer: 1 << 28 },
);
writeFileSync(log, `${run.stdout ?? ""}\n${run.stderr ?? ""}`);
if (run.status !== 0 || !existsSync(out)) {
  console.error(`Blender failed (exit ${run.status}). Log: ${path.relative(root, log)}`);
  process.exit(1);
}

const frames = Number(
  execFileSync(
    "ffprobe",
    ["-v", "error", "-count_frames", "-select_streams", "v:0", "-show_entries", "stream=nb_read_frames", "-of", "csv=p=0", out],
    { encoding: "utf8" },
  ).trim(),
);
const expected = clipFrames(args.beats, args.bpm);
if (frames < expected) {
  console.error(`${path.relative(root, out)} has ${frames} frames; expected ${expected}. Log: ${path.relative(root, log)}`);
  process.exit(1);
}
console.log(`wrote ${path.relative(root, out)} (${frames} frames)`);
```

In `package.json` `scripts` add `"blender": "node scripts/blender.mjs",`.

- [ ] **Step 6: Verify end to end, including the failure paths**

```bash
npm run blender -- --lines 11111 --bpm 110; echo "exit $?"            # expect the six-0s-and-1s message, exit 1, Blender not started
BLENDER=/nope npm run blender -- --lines 111111 --bpm 110; echo "exit $?"   # expect "Blender not found at /nope", exit 1
npm run blender -- --lines 111111 --bpm 110 --preview                 # expect: wrote public/assets/3d/hexagram-111111-110bpm-4b-preview.mp4 (67 frames)
npm test                                                              # all node and python tests pass
```

- [ ] **Step 7: Document**

In `README.md` under `## Setup`, after the assets lines, add:

````markdown
3D pieces are rendered in Blender (5.2 or later), headless:

```sh
npm run blender -- --lines 111111 --bpm 110              # public/assets/3d/hexagram-111111-110bpm-4b.mp4
npm run blender -- --lines 111111 --bpm 110 --preview    # half size, low samples, for a quick look
```

`--lines` is bottom line first, 1 = yang. Set `BLENDER` if Blender is not in `/Applications`. Logs go to `out/`.
````

and add `npm test` to the Use section with the comment `# clip naming (Node) and slab layout (Python) tests`.

- [ ] **Step 8: Commit**

```bash
git add scripts/blender-args.mjs scripts/blender.mjs tests/blender-args.test.mjs package.json README.md
git commit -m "Add npm run blender to render the 3D hexagram" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_016Z9BbdP28sZoh3uZowjvws"
```

---

### Task 6: Play the clip in the Gotchu template

**Files:**
- Modify: `src/scenes/Montage.tsx` (extract `HexagramTitle`)
- Create: `src/scenes/Hexagram3D.tsx`
- Modify: `src/schema.ts`, `src/templates/Gotchu.tsx`, `src/specs/gotchu-qian.ts`, `src/Root.tsx`

**Interfaces:**
- Consumes: `hexagramClip`, `clipFrames` (Task 1); the clip from Task 5.
- Produces: `HexagramTitle: React.FC<{ hexagram: ShortProps["hexagram"] }>`;
  `Hexagram3D: React.FC<{ hexagram: ShortProps["hexagram"]; clip: string }>`; schema field
  `hexagramClip?: string` on `gotchuSchema`.

- [ ] **Step 1: Extract the names block in Montage.tsx**

Replace the second `AbsoluteFill` inside `Hexagram` (the zh and name block) with `<HexagramTitle hexagram={hexagram} />`,
and add below `Hexagram`:

```tsx
// The hexagram's Chinese name and "1 · Qián · The Creative" under it.
export const HexagramTitle: React.FC<{ hexagram: ShortProps["hexagram"] }> = ({ hexagram }) => (
  <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 330 }}>
    <div style={{ fontFamily: fonts.serif, fontSize: 150, color: "#fff", textShadow: glow() }}>{hexagram.zh}</div>
    <div style={{ fontFamily: fonts.serif, fontSize: 58, color: "#6cff7a", marginTop: 10 }}>
      {hexagram.number} · {hexagram.pinyin} · {hexagram.name}
    </div>
  </AbsoluteFill>
);
```

- [ ] **Step 2: Add the scene**

`src/scenes/Hexagram3D.tsx`:

```tsx
import { AbsoluteFill, interpolate, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { framesPerBeat, useGrid } from "../lib/timing";
import type { ShortProps } from "../schema";
import { HexagramTitle } from "./Montage";

// The Blender hexagram build (blender/hexagram.py). The names fade in as the last line lands.
export const Hexagram3D: React.FC<{ hexagram: ShortProps["hexagram"]; clip: string }> = ({ hexagram, clip }) => {
  const frame = useCurrentFrame();
  const beat = framesPerBeat(useGrid());
  const opacity = interpolate(frame, [beat * 2.5, beat * 3], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <OffthreadVideo src={staticFile(clip)} muted style={{ width: "100%", height: "100%" }} />
      <AbsoluteFill style={{ opacity }}>
        <HexagramTitle hexagram={hexagram} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 3: Schema, template and spec**

`src/schema.ts`, in `gotchuSchema` after `hexagram: hexagramSchema,`:

```ts
  // The Blender hexagram build (npm run blender), under public/. Without it the 2D build plays.
  hexagramClip: z.string().optional(),
```

`src/templates/Gotchu.tsx`: import `Hexagram3D`, and change the hexagram `Sequence` body to:

```tsx
            {props.hexagramClip ? (
              <Hexagram3D hexagram={props.hexagram} clip={props.hexagramClip} />
            ) : (
              <Hexagram hexagram={props.hexagram} />
            )}
```

`src/specs/gotchu-qian.ts`: import `{ hexagramClip }` from `"../lib/clips"` and add after `hexagram: qian.hexagram,`:

```ts
  hexagramClip: hexagramClip(qian.hexagram.lines, 110, 4),
```

- [ ] **Step 4: Fail loudly on a missing or mismatched clip**

In `src/Root.tsx`, import `staticFile` from `remotion` and `hexagramClip` from `./lib/clips`, and make
GotchuQian's `calculateMetadata`:

```tsx
      calculateMetadata={async ({ props }: { props: GotchuProps }) => {
        const p = gotchuPlan(props);
        if (props.hexagramClip) {
          const beats = p.breakdown - p.hexagram;
          const expected = hexagramClip(props.hexagram.lines, props.bpm, beats);
          const make = `npm run blender -- --lines ${props.hexagram.lines.join("")} --bpm ${props.bpm} --beats ${beats}`;
          if (props.hexagramClip !== expected) {
            throw new Error(`hexagramClip is ${props.hexagramClip}, but this hexagram and tempo need ${expected}. Make it with: ${make}`);
          }
          const res = await fetch(staticFile(props.hexagramClip));
          await res.body?.cancel();
          if (!res.ok) throw new Error(`${props.hexagramClip} is missing. Make it with: ${make}`);
        }
        return { durationInFrames: beatFrame({ fps: FPS, bpm: props.bpm, firstBeat: props.firstBeat }, p.end) };
      }}
```

- [ ] **Step 5: Verify the failure path, then the real clip**

```bash
npm run typecheck
npx remotion still src/index.ts GotchuQian out/hex3d.png --frame=370 --log=error; echo "exit $?"
```

Expected before the full clip exists: non-zero exit and an error containing
`is missing. Make it with: npm run blender -- --lines 111111 --bpm 110 --beats 4`.

```bash
npm run blender -- --lines 111111 --bpm 110
npx remotion still src/index.ts GotchuQian out/hex3d.png --frame=370 --log=error
```

Expected: the still shows the 3D hexagram with the names over it.

Check a clip made for other lines is refused:

```bash
npx remotion still src/index.ts GotchuQian out/hex3d.png --frame=370 --log=error \
  --props='{"hexagramClip":"assets/3d/hexagram-000000-110bpm-4b.mp4"}'; echo "exit $?"
```

Expected: non-zero exit and an error containing `this hexagram and tempo need assets/3d/hexagram-111111-110bpm-4b.mp4`.

- [ ] **Step 6: Commit**

```bash
git add src/scenes/Montage.tsx src/scenes/Hexagram3D.tsx src/schema.ts src/templates/Gotchu.tsx src/specs/gotchu-qian.ts src/Root.tsx
git commit -m "Play the Blender hexagram in the Gotchu template" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_016Z9BbdP28sZoh3uZowjvws"
```

---

### Task 7: Check it against the 2D version and the music

**Files:** none changed unless tuning is needed (then `blender/hexagram.py` numbers only).

- [ ] **Step 1: Yin and mixed hexagrams**

```bash
npm run blender -- --lines 000000 --bpm 110 --preview
npm run blender -- --lines 101010 --bpm 110 --preview
```

Keep the current 2D render and compare frame 45 (all lines landed, before the push-in) of the three clips with
the 2D hexagram at the same point in the short:

```bash
cp out/gotchu-qian.mp4 out/gotchu-qian-2d.mp4
ffmpeg -v error -y -ss 12.4 -i out/gotchu-qian-2d.mp4 -frames:v 1 -vf scale=540:960 out/cmp-2d.png
for l in 111111 000000 101010; do
  f=public/assets/3d/hexagram-$l-110bpm-4b$([ $l = 111111 ] || echo -preview).mp4
  ffmpeg -v error -y -ss 1.5 -i $f -frames:v 1 -vf scale=540:960 out/cmp-$l.png
done
ffmpeg -v error -y -i out/cmp-2d.png -i out/cmp-111111.png -i out/cmp-000000.png -i out/cmp-101010.png -filter_complex hstack=4 out/cmp-sheet.png
```

Check the yin breaks and the trigram gap read as clearly as in the 2D version.

- [ ] **Step 2: Full short and side-by-side**

```bash
npx remotion render src/index.ts GotchuQian out/gotchu-qian.mp4 --log=error
ffmpeg -v error -y -ss 10.9 -t 2.2 -i out/gotchu-qian-2d.mp4 -ss 10.9 -t 2.2 -i out/gotchu-qian.mp4 \
  -filter_complex "[0:v]scale=540:960[a];[1:v]scale=540:960[b];[a][b]hstack[v]" -map "[v]" -map 1:a -c:v libx264 -crf 20 out/hex-2d-vs-3d.mp4
ffmpeg -v error -y -i out/gotchu-qian.mp4 -c:v libx264 -crf 26 -preset medium -c:a copy out/gotchu-qian-preview.mp4
```

Watch `out/hex-2d-vs-3d.mp4` with sound: each slab should land with a beat or half-beat. Send it and the preview
to the user.

- [ ] **Step 3: Commit any tuning**

```bash
git add blender/hexagram.py
git commit -m "Tune the 3D hexagram's camera and glow" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_016Z9BbdP28sZoh3uZowjvws"
git push
```
