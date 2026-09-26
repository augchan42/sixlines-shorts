"""Biting Through (21) as its own lines act it, in the hexagram build's look. The Ten Wings
read the hexagram as a picture: the yang lines at the bottom and top are the jaws, and the
yang fourth line is something caught between them ("There is something between the
corners of the mouth: this is called Biting Through", Tuan Zhuan). So: the yin lines, the
inside of the mouth, dim and step back; the jaws open, bite, and the fourth line snaps
into a yin line; the jaws go back to their places. What is left is 27, Jaws, the empty
mouth. No words or signs; the sentence typed under it says what it means.

The user, 2026-09-26: tell the hexagram's story the way the character drawings do,
engaging and minimalist.

Timed for a lesson of --beats beats: the act is done by the last 5, which hold.

  Blender -b --factory-startup --python-exit-code 1 -P blender/bite.py -- \
    --lines 100101 --rain public/assets/3d/rain.mp4 --bpm 100 --beats 12 \
    --out out/bite.mp4 [--still N] [--preview]
"""

import argparse
import math
import os
import sys

import bpy

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from hexagram import PULSE, REST, add_slab, bloom, key, lights_and_world, linear, obsidian, rain_plane, render_settings  # noqa: E402
from layout import FPS, LINE_H, LINE_W, YIN_GAP, frame_count, line_z  # noqa: E402

AMBER = "#ffb347"  # the end card's amber, for the break
BACK = 0.7  # how far the dimmed yin lines step back, so the jaws pass in front of them
DIM = 0.12  # their glow, as a share of REST, while they step back
OPEN = 0.45  # how far each jaw opens before it bites
BITE = 3.85  # the beat the jaws meet; they open slowly from beat 2, and are back by BITE + 2.6


def parse():
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--lines", required=True, help="six lines, bottom first, 1 = yang")
    p.add_argument("--caught", type=int, default=3, help="the yang line between the jaws (0 = bottom)")
    p.add_argument("--rain", required=True)
    p.add_argument("--pixel", help="unused; scripts/lesson3d.mjs passes it to every scene")
    p.add_argument("--edge", default="#6cff7a")
    p.add_argument("--bpm", type=float, required=True)
    p.add_argument("--beats", type=float, required=True)
    p.add_argument("--out", required=True)
    p.add_argument("--still", type=int)
    p.add_argument("--preview", action="store_true")
    return p.parse_args(argv)


def glow(strength, points):
    """Keys an edge's emission strength at (clip frame, value) points."""
    for f, v in points:
        strength.default_value = v
        strength.keyframe_insert("default_value", frame=f + 1)


def ease(o, index, points, path="location"):
    """Keys one channel at (clip frame, value) points."""
    for f, v in points:
        getattr(o, path)[index] = v
        key(o, path, f, index=index)


def recolour(node, points):
    for f, c in points:
        for name in ("Emission Color", "Base Color"):
            node.inputs[name].default_value = c
            node.inputs[name].keyframe_insert("default_value", frame=f + 1)


def camera(scene, frames, beat):
    """From where the build ends (square on, 13 away), round 16° as the mouth opens, so the
    jaws have depth, then a slow push in through the hold."""
    target = bpy.data.objects.new("target", None)
    scene.collection.objects.link(target)
    data = bpy.data.cameras.new("camera")
    data.lens = 35
    data.dof.use_dof = True
    data.dof.focus_object = target
    data.dof.aperture_fstop = 0.1
    cam = bpy.data.objects.new("camera", data)
    scene.collection.objects.link(cam)
    scene.camera = cam
    track = cam.constraints.new("TRACK_TO")
    track.target, track.track_axis, track.up_axis = target, "TRACK_NEGATIVE_Z", "UP_Y"
    for f, deg, dist in ((0, 0, 13.0), (round(3.5 * beat), 16, 13.4), (frames - 1, 16, 12.2)):
        a = math.radians(deg)
        cam.location = (dist * math.sin(a), -dist * math.cos(a), -0.9)
        key(cam, "location", f)
        target.location = (1.8 * math.sin(a), 0, -0.9)
        key(target, "location", f)


def main():
    args = parse()
    scene = bpy.context.scene
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o)
    frames = frame_count(args.beats, args.bpm)
    beat = 60 * FPS / args.bpm
    at = lambda b: round(b * beat)  # noqa: E731
    black, green, amber = obsidian(), linear(args.edge), linear(AMBER)
    lines = args.lines
    jaws = (lines.index("1"), lines.rindex("1"))
    caught = args.caught
    zc = line_z(caught)

    for i, ch in enumerate(lines):
        z = line_z(i)
        if i == caught:
            continue
        if ch == "1":
            o, strength = add_slab(i, 0.0, z, LINE_W, black, green)
            if i in jaws:
                # Open, bite down onto the caught line, hold on it, and go back.
                side = 1 if i == jaws[1] else -1
                touch = zc + side * LINE_H * 1.02
                ease(o, 2, ((at(2.0), z), (at(3.5), z + side * OPEN), (at(BITE), touch), (at(BITE + 0.75), touch), (at(BITE + 2.6), z)))
                glow(strength, ((at(BITE) - 1, REST), (at(BITE), PULSE), (at(BITE + 0.6), REST)))
            continue
        # Yin lines, the inside of the mouth: step back and dim while the jaws work.
        w = (LINE_W - YIN_GAP) / 2
        for sx in (-1, 1):
            o, strength = add_slab(i, sx * (YIN_GAP + w) / 2, z, w, black, green)
            ease(o, 1, ((at(0.5), 0.0), (at(2.0), BACK), (at(BITE + 1.6), BACK), (at(BITE + 3.0), 0.0)))
            glow(strength, ((at(0.5), REST), (at(2.0), REST * DIM), (at(BITE + 1.6), REST * DIM), (at(BITE + 3.0), REST)))

    # The caught line: whole until the bite lands, then two halves that spring apart to a
    # yin line's places, flashing amber at the break and cooling back to green.
    snap = at(BITE)
    whole, strength = add_slab(caught, 0.0, zc, LINE_W, black, green)
    whole.hide_render = False
    key(whole, "hide_render", snap - 1)
    whole.hide_render = True
    key(whole, "hide_render", snap)
    glow(strength, ((at(3.0), REST), (at(BITE) - 1, REST * 3)))
    w = (LINE_W - YIN_GAP) / 2
    for sx in (-1, 1):
        half, s = add_slab(caught, sx * LINE_W / 4, zc, w, black, green)
        half.hide_render = True
        key(half, "hide_render", snap - 1)
        half.hide_render = False
        key(half, "hide_render", snap)
        # Each half starts as half the whole line and ends a yin half.
        ease(half, 0, ((snap, (LINE_W / 2) / w), (snap + at(0.5), 1.0)), path="scale")
        ease(half, 0, ((snap, sx * LINE_W / 4), (snap + at(0.25), sx * ((YIN_GAP + w) / 2 + 0.25)), (snap + at(0.6), sx * (YIN_GAP + w) / 2)))
        ease(half, 1, ((snap, math.radians(0)), (snap + at(0.25), math.radians(-sx * 6)), (snap + at(0.7), 0.0)), path="rotation_euler")
        glow(s, ((snap, PULSE), (snap + at(1.5), REST)))
        recolour(s.node, ((snap, amber), (snap + at(0.6), amber), (snap + at(2), green)))

    rain_plane(args.rain)
    camera(scene, frames, beat)
    lights_and_world(scene)
    bloom(scene)
    render_settings(scene, frames, args.out, args.preview)
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
