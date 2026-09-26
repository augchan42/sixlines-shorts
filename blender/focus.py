"""A trigram lesson in the hexagram build's own look, doing as little as it can: the built
hexagram's obsidian slabs over the glyph rain, the camera as the build leaves it; the two
trigrams part a little and the camera moves slowly in to the one the lesson turns on
(--stress, 0 the lower, 1 the upper), the other going soft behind the focus. No words,
signs, lights or shake; the sentence typed under it says what it means. (The user,
2026-09-26: the hexagram build is good "because we're not really doing too much".)

Timed for a lesson of --beats beats: the move is done by the last 5, which hold for the
sentence.

Run through scripts/lesson3d.mjs, or directly:
  Blender -b --factory-startup --python-exit-code 1 -P blender/focus.py -- \
    --lines 110010 --stress 0 --rain public/assets/3d/rain.mp4 --bpm 100 --beats 12 \
    --out out/focus.mp4 [--still N] [--preview]
"""

import argparse
import math
import os
import sys

import bpy

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from hexagram import add_slab, bloom, key, lights_and_world, linear, obsidian, rain_plane, render_settings  # noqa: E402
from layout import FPS, frame_count, line_z, slabs  # noqa: E402

PART = 0.35  # how far each trigram moves away from the other


def parse():
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--lines", required=True, help="six lines, bottom first, 1 = yang")
    p.add_argument("--stress", type=int, choices=(0, 1), required=True)
    p.add_argument("--rain", required=True)
    p.add_argument("--pixel", help="unused; scripts/lesson3d.mjs passes it to every scene")
    p.add_argument("--edge", default="#6cff7a")
    p.add_argument("--bpm", type=float, required=True)
    p.add_argument("--beats", type=float, required=True)
    p.add_argument("--out", required=True)
    p.add_argument("--still", type=int)
    p.add_argument("--preview", action="store_true")
    return p.parse_args(argv)


def camera(scene, frames, beat, focus_z):
    """From where the hexagram build ends (square on, 13 away), slowly round 22° and down to
    the stressed trigram, which sits a little above the frame's middle, clear of the sentence.
    Seen at an angle the 6.2 m bars fit the portrait frame closer in than square on."""
    target = bpy.data.objects.new("target", None)
    scene.collection.objects.link(target)
    data = bpy.data.cameras.new("camera")
    data.lens = 35
    data.dof.use_dof = True
    data.dof.focus_object = target
    data.dof.aperture_fstop = 0.25  # the other trigram softens as the camera closes in
    cam = bpy.data.objects.new("camera", data)
    scene.collection.objects.link(cam)
    scene.camera = cam
    track = cam.constraints.new("TRACK_TO")
    track.target, track.track_axis, track.up_axis = target, "TRACK_NEGATIVE_Z", "UP_Y"
    settle = frames - 1 - round(5 * beat)
    for f, deg, dist, cz, tz in ((0, 0, 13.0, -0.9, -0.9), (settle, 20, 13.2, focus_z + 0.4, focus_z - 1.0), (frames - 1, 22, 12.8, focus_z + 0.4, focus_z - 1.0)):
        a = math.radians(deg)
        cam.location = (dist * math.sin(a), -dist * math.cos(a), cz)
        key(cam, "location", f)
        # Aimed a little towards the near end, which looks bigger, so the bars sit centred.
        target.location = (0.9 * math.sin(a) * 2, 0, tz)
        key(target, "location", f)


def main():
    args = parse()
    scene = bpy.context.scene
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o)
    frames = frame_count(args.beats, args.bpm)
    beat = 60 * FPS / args.bpm
    black, colour = obsidian(), linear(args.edge)
    part_from, part_to = round(0.5 * beat), round(3 * beat)
    for i, x, z, w in slabs(args.lines):
        o, _ = add_slab(i, x, z, w, black, colour)
        away = PART if i >= 3 else -PART
        for f, dz in ((part_from, 0), (part_to, away)):
            o.location.z = z + dz
            key(o, "location", f, index=2)
    focus_z = (line_z(1 + 3 * args.stress)) + (PART if args.stress else -PART)
    rain_plane(args.rain)
    camera(scene, frames, beat, focus_z)
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
