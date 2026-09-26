"""Preponderance of the Small (62) as its own lines act it, in the hexagram build's look.
The hexagram is read as a flying bird: the two yang lines in the middle are its body, the
yin lines' halves above and below its spread wings. Its Judgment: "The flying bird leaves
its message: it is not fitting to go up, it is fitting to go down." So: the wings beat and
the bird lifts a little; then it stops climbing, holds its wings out and glides down, and
comes to rest with its wings level. No words or signs; the sentence typed under it says
what it means.

The user, 2026-09-26: tell the hexagram's story the way the character drawings do; for
hexagrams that lend themselves to a picture, act it out as 21's bite (blender/bite.py) does.

Timed for a lesson of --beats beats: the act is done by the last 4, which hold.

  Blender -b --factory-startup --python-exit-code 1 -P blender/bird.py -- \
    --lines 001100 --rain public/assets/3d/rain.mp4 --bpm 112 --beats 12 \
    --out out/bird.mp4 [--still N] [--preview]
"""

import argparse
import math
import os
import sys

import bpy

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bite import ease  # noqa: E402
from hexagram import add_slab, bloom, key, lights_and_world, linear, obsidian, rain_plane, render_settings  # noqa: E402
from layout import FPS, LINE_W, YIN_GAP, frame_count, line_z  # noqa: E402

BEAT_DEG = 14  # how far a wing beats up and down
BEATS_OF_WINGS = 2  # wing beats before the glide, 1.5 music beats each
LIFT = 0.6  # how far the beating lifts the bird
FALL = 2.2  # how far it glides down
GLIDE_DEG = 7  # the wings held a little up while it glides


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


def camera(scene, frames, beat, height):
    """From where the build ends (square on, 13 away), round 18° so the wings show depth; the
    target follows the bird's height at a lag, so the climb and the glide read against the
    rain behind."""
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
    for f, deg, dist in ((0, 0, 13.0), (round(3 * beat), 18, 13.6), (frames - 1, 18, 12.6)):
        a = math.radians(deg)
        z = -0.9 + 0.6 * height(f)
        cam.location = (dist * math.sin(a), -dist * math.cos(a), z + 0.8)
        key(cam, "location", f)
        target.location = (1.6 * math.sin(a), 0, z)
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

    # The whole bird: every line hangs from one empty, which lifts and glides.
    bird = bpy.data.objects.new("bird", None)
    scene.collection.objects.link(bird)
    flap_from = 0.75
    glide_from = flap_from + 1.5 * BEATS_OF_WINGS
    glide_to = args.beats - 4
    rise = ((at(flap_from), 0.0), (at(glide_from), LIFT), (at(glide_from + 0.5), LIFT + 0.1), (at(glide_to), LIFT - FALL))
    ease(bird, 2, rise)

    def height(f):
        """The bird's height at clip frame f, for the camera: linear between the keys."""
        pts = [(0, 0.0), *rise, (frames - 1, LIFT - FALL)]
        for (f0, v0), (f1, v1) in zip(pts, pts[1:]):
            if f0 <= f <= f1:
                return v0 + (v1 - v0) * (f - f0) / max(f1 - f0, 1)
        return pts[-1][1]

    w = (LINE_W - YIN_GAP) / 2
    for i, ch in enumerate(args.lines):
        z = line_z(i)
        if ch == "1":
            o, _ = add_slab(i, 0.0, z, LINE_W, black, green)
            o.parent = bird
            continue
        for sx in (-1, 1):
            # A wing: hinged at its inner end, by the gap, so it beats up and down.
            hinge = bpy.data.objects.new(f"hinge{i}{sx}", None)
            hinge.location = (sx * YIN_GAP / 2, 0, z)
            hinge.parent = bird
            scene.collection.objects.link(hinge)
            o, _ = add_slab(i, sx * (YIN_GAP + w) / 2, z, w, black, green)
            o.parent = hinge
            o.location = (sx * w / 2, 0, 0)
            # A positive turn about y lowers +x; the wings on both sides rise together.
            up = lambda deg: -sx * math.radians(deg)  # noqa: E731
            beats = [(at(flap_from), 0.0)]
            for k in range(BEATS_OF_WINGS):
                b0 = flap_from + 1.5 * k
                beats += [(at(b0 + 0.5), up(BEAT_DEG)), (at(b0 + 1.2), up(-BEAT_DEG * 0.7))]
            beats += [(at(glide_from + 0.4), up(GLIDE_DEG)), (at(glide_to - 0.5), up(GLIDE_DEG)), (at(glide_to + 0.5), 0.0)]
            ease(hinge, 1, beats, path="rotation_euler")

    rain_plane(args.rain)
    camera(scene, frames, beat, height)
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
