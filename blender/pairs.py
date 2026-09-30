"""King Wen's pairs for the structure shorts (docs/superpowers/specs/2026-09-30-structure-shorts-design.md,
section 2): one hexagram of obsidian slabs with glowing edges, square to the camera, in the
terminal's window (980x1160). Two ways to make its partner:

- turn: the whole hexagram turns end over end (180 degrees in the picture plane), so it reads
  upside down: 3 becomes 4.
- flip: for the 8 that read the same upside down, it turns end over end first and stays the
  same; then each line flips over on its own axis, bottom first, and comes up the other kind
  (solid for broken, broken for solid): 29 becomes 30.

Calm: one slow push in, every move eased, nothing overshoots.

  Blender -b --factory-startup --python-exit-code 1 -P blender/pairs.py -- \
    --lines 100010 --mode turn --out public/local/structure/pair-3-4.mp4 [--still N] [--preview]
"""

import argparse
import math
import os
import sys

import bpy

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from hexagram import add_slab, bloom, key, linear, lights_and_world, obsidian, render_settings  # noqa: E402
from layout import FPS, line_z, slabs  # noqa: E402

W, H = 980, 1160
TURN = 1.6  # seconds for the end-over-end turn
FLIP, STAGGER = 0.8, 0.25  # seconds for one line's flip, and between lines' starts


def parse():
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--lines", required=True, help="bottom first, 1 = solid")
    p.add_argument("--mode", choices=["turn", "flip"], required=True)
    p.add_argument("--at", type=float, default=1.5, help="seconds before the turn starts")
    p.add_argument("--secs", type=float, default=7.0)
    p.add_argument("--edge", default="#6cff7a")
    p.add_argument("--out", required=True)
    p.add_argument("--still", type=int)
    p.add_argument("--preview", action="store_true")
    return p.parse_args(argv)


def ease(obj, path, index, frames_values):
    """Keys; Blender's default Bezier keys ease in and out."""
    for frame, value in frames_values:
        getattr(obj, path)[index] = value
        key(obj, path, frame, index)


def show(o, frame, visible):
    """Hidden or shown from a clip frame on (constant between keys)."""
    o.hide_render = not visible
    key(o, "hide_render", frame)


def line_objects(lines, black, colour, name):
    """One empty per line at its centre, its slabs parented to it; returns [(empty, [slabs])]."""
    out = []
    for i in range(6):
        e = bpy.data.objects.new(f"{name}{i}", None)
        e.location = (0, 0, line_z(i))
        bpy.context.scene.collection.objects.link(e)
        out.append((e, []))
    for i, x, z, w in slabs(lines):
        o, _ = add_slab(i, x, z, w, black, colour)
        o.name = f"{name}-slab{i}"
        e = out[i][0]
        o.parent = e
        o.location = (x, 0, 0)
        out[i][1].append(o)
    return out


def camera(scene, frames):
    data = bpy.data.cameras.new("camera")
    data.lens = 50
    cam = bpy.data.objects.new("camera", data)
    scene.collection.objects.link(cam)
    scene.camera = cam
    # Square on, a little from the left and above so the slabs' depth shows; a slow push in.
    cam.rotation_euler = (math.radians(86), 0, math.radians(-8))
    for frame, dist in ((0, 14.0), (frames - 1, 12.5)):
        a = math.radians(-8)
        cam.location = (dist * math.sin(a), -dist * math.cos(a), 0.9)
        key(cam, "location", frame)


def main():
    args = parse()
    scene = bpy.context.scene
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o)
    frames = round(args.secs * FPS)
    black, colour = obsidian(), linear(args.edge)
    pivot = bpy.data.objects.new("pivot", None)
    scene.collection.objects.link(pivot)

    start, end = round(args.at * FPS), round((args.at + TURN) * FPS)
    first = line_objects(args.lines, black, colour, "a")
    for e, _ in first:
        e.parent = pivot
    # End over end: a half turn about the axis pointing at the camera.
    ease(pivot, "rotation_euler", 1, [(start, 0.0), (end, math.pi)])

    if args.mode == "flip":
        # After the turn each line flips about its own horizontal axis, bottom of the picture
        # first as a hexagram is built (once turned, line 5 is at the bottom); at the half-way
        # point, edge on, the slab is swapped for the other kind.
        other = "".join("0" if c == "1" else "1" for c in args.lines)
        second = line_objects(other, black, colour, "b")
        for e, _ in second:
            e.parent = pivot
        for i in range(6):
            a = end + round((0.4 + (5 - i) * STAGGER) * FPS)
            b = a + round(FLIP * FPS)
            mid = (a + b) // 2
            for e, objs, visible_before in ((first[i][0], first[i][1], True), (second[i][0], second[i][1], False)):
                ease(e, "rotation_euler", 0, [(a, 0.0), (b, math.pi)])
                for o in objs:
                    show(o, 0, visible_before)
                    show(o, mid, not visible_before)

    camera(scene, frames)
    lights_and_world(scene)
    bloom(scene)
    render_settings(scene, frames, args.out, args.preview)
    scene.render.resolution_x, scene.render.resolution_y = (W // 2, H // 2) if args.preview else (W, H)
    if args.still is not None:
        scene.frame_set(args.still + 1)
        scene.render.image_settings.media_type = "IMAGE"
        scene.render.image_settings.file_format = "PNG"
        scene.render.filepath = os.path.abspath(args.out)
        bpy.ops.render.render(write_still=True)
    else:
        bpy.ops.render.render(animation=True)


if __name__ == "__main__":
    main()
