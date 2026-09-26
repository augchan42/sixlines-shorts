"""The Abyss (29) as its own lines act it, in the hexagram build's look. The hexagram is
water doubled: in each trigram a yang line lies between two yin lines, water in a pit. The
Tuan: "Water flows and never fills up; it goes through danger and does not lose its trust."
So the water moves on: each yang line narrows to a stream the width of the yin line's gap,
slips down through it and spreads out again. The lower one flows out at the bottom, the
upper one down into its place, and a new one comes in at the top, so the hexagram is 29
again: the pits never fill, the water never stops. The yin lines stay where they are. No
words or signs; the sentence typed under it says what it means.

The user, 2026-09-26: where the lines lend themselves to a picture, act it out as 21's
bite (blender/bite.py) does.

Timed for a lesson of --beats beats: the act is done by the last 4, which hold.

  Blender -b --factory-startup --python-exit-code 1 -P blender/abyss.py -- \
    --lines 010010 --rain public/assets/3d/rain.mp4 --bpm 100 --beats 12 \
    --out out/abyss.mp4 [--still N] [--preview]
"""

import argparse
import math
import os
import sys

import bpy

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bite import ease, glow  # noqa: E402
from hexagram import DEPTH, PULSE, REST, add_slab, bloom, key, lights_and_world, linear, obsidian, rain_plane, render_settings  # noqa: E402
from layout import FPS, LINE_W, YIN_GAP, frame_count, line_z  # noqa: E402

STREAM = 0.12 / LINE_W  # a stream's width, as a share of the line's: thin enough that its edges glow as one
THIN = 0.12 / DEPTH  # and as thin front to back, so it is one rod of light
STRETCH = 2.4  # how much taller a stream is than a line, so it reads as falling water
BRIGHT = REST * 2.5  # a stream's glow
BELOW = line_z(0) - 2.4  # where the lower water goes out of sight
ABOVE = line_z(5) + 2.4  # where the new water comes from


def parse():
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--lines", required=True, help="six lines, bottom first, 1 = yang")
    p.add_argument("--rain", required=True)
    p.add_argument("--pixel", help="unused; scripts/lesson3d.mjs passes it to every scene")
    p.add_argument("--edge", default="#6cff7a")
    p.add_argument("--bpm", type=float, required=True)
    p.add_argument("--beats", type=float, required=True)
    p.add_argument("--out", required=True)
    p.add_argument("--still", type=int)
    p.add_argument("--preview", action="store_true")
    return p.parse_args(argv)


def flow(o, strength, at, start, z0, path, end=None):
    """Narrows a yang line to a stream from beat `start`, carries it through the heights in
    `path` (beat, z), and spreads it back to a line at the last one, or leaves it a
    stream that fades out if `end` is None."""
    ease(o, 0, ((at(start), 1.0), (at(start + 0.6), STREAM)), path="scale")
    ease(o, 1, ((at(start), 1.0), (at(start + 0.6), THIN)), path="scale")
    ease(o, 2, ((at(start), 1.0), (at(start + 0.6), STRETCH)), path="scale")
    ease(o, 2, ((at(start + 0.5), z0), *((at(b), z) for b, z in path)))
    last = path[-1][0]
    if end is None:
        glow(strength, ((at(start), REST), (at(start + 0.6), BRIGHT), (at(last - 0.6), BRIGHT), (at(last), 0.0)))
        return
    ease(o, 0, ((at(last), STREAM), (at(last + 0.7), 1.0)), path="scale")
    ease(o, 1, ((at(last), THIN), (at(last + 0.7), 1.0)), path="scale")
    ease(o, 2, ((at(last), STRETCH), (at(last + 0.7), 1.0)), path="scale")
    glow(strength, ((at(start), REST), (at(start + 0.6), BRIGHT), (at(last), BRIGHT), (at(last + 0.3), PULSE * 0.5), (at(last + 1.2), REST)))


def shown(o, points):
    """Keys whether a slab renders at (clip frame, shown) points."""
    for f, v in points:
        o.hide_render = not v
        key(o, "hide_render", f)


def camera(scene, frames, beat):
    """From where the build ends (square on, 13 away), round 12° so the lines have depth,
    then a slow push in through the hold."""
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
    for f, deg, dist in ((0, 0, 13.0), (round(3 * beat), 12, 13.4), (frames - 1, 12, 12.4)):
        a = math.radians(deg)
        cam.location = (dist * math.sin(a), -dist * math.cos(a), -0.9)
        key(cam, "location", f)
        target.location = (1.4 * math.sin(a), 0, -0.9)
        key(target, "location", f)


def main():
    args = parse()
    scene = bpy.context.scene
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o)
    frames = frame_count(args.beats, args.bpm)
    beat = 60 * FPS / args.bpm
    at = lambda b: round(b * beat)  # noqa: E731
    black, green = obsidian(), linear(args.edge)
    lower, upper = args.lines.index("1"), args.lines.rindex("1")
    end = args.beats - 4

    w = (LINE_W - YIN_GAP) / 2
    for i, ch in enumerate(args.lines):
        if ch == "0":
            for sx in (-1, 1):
                add_slab(i, sx * (YIN_GAP + w) / 2, line_z(i), w, black, green)

    # The lower water flows out at the bottom, through the gap below it.
    o, s = add_slab(lower, 0.0, line_z(lower), LINE_W, black, green)
    flow(o, s, at, 1.0, line_z(lower), ((3.2, BELOW),))
    shown(o, ((0, True), (at(3.2), False)))
    # The upper water flows down through the gaps between into the lower water's place.
    o, s = add_slab(upper, 0.0, line_z(upper), LINE_W, black, green)
    flow(o, s, at, 2.4, line_z(upper), ((end - 1.4, line_z(lower)),), end=True)
    # New water comes in from above into the upper place.
    o, s = add_slab(upper, 0.0, ABOVE, LINE_W, black, green)
    ease(o, 0, ((0, STREAM),), path="scale")
    ease(o, 1, ((0, THIN), (at(end - 0.7), THIN), (at(end), 1.0)), path="scale")
    ease(o, 2, ((0, STRETCH),), path="scale")
    shown(o, ((0, False), (at(3.4), True)))
    ease(o, 2, ((at(3.4), ABOVE), (at(end - 0.7), line_z(upper))))
    ease(o, 0, ((at(end - 0.7), STREAM), (at(end), 1.0)), path="scale")
    ease(o, 2, ((at(end - 0.7), STRETCH), (at(end), 1.0)), path="scale")
    glow(s, ((0, 0.0), (at(3.4), 0.0), (at(4.2), BRIGHT), (at(end - 0.7), BRIGHT), (at(end - 0.4), PULSE * 0.5), (at(end + 0.5), REST)))

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
