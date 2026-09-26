"""Acts out a hexagram's lines as a house that falls in on itself, as a lesson picture. The
user's idea for 23, Splitting Apart (2026-09-26): one yang line on top of five yin, "the house
falls in on itself".

The hexagram is built bottom up as neon-edged slabs standing on a dark glass floor. Then the
bottom line's halves slide apart, as the line texts split the bed's legs first; the yin
halves above sag inward into their gaps; and the stack is let go to Blender's rigid-body
physics, so it falls in on itself. The yang line comes down on top of the rubble, still lit,
and turns amber. A searchlight (blender/searchlight.py) swings across it all through haze.
There is no shake.

Timed in beats for a lesson of --beats beats, the last 5 left clear for the sentence the
template types under it.

Run through scripts/lesson3d.mjs, or directly:
  Blender -b --factory-startup --python-exit-code 1 -P blender/collapse.py -- \
    --lines 000001 --bpm 82.5 --beats 12 --out out/collapse.mp4 [--still N] [--preview]
"""

import argparse
import math
import os
import random
import sys

import bpy

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from hexagram import REST, add_slab, animate_slab, bloom, key, linear, obsidian, render_settings  # noqa: E402
from layout import FPS, LINE_H, frame_count, land_frame, line_z, slabs  # noqa: E402
from searchlight import haze, searchlight, streaks, wet  # noqa: E402

AMBER = "#ffb347"  # the end card's amber backlight, as the stressed Judgment characters
BASE = -line_z(0) + LINE_H / 2  # lifts the hexagram so its bottom line stands on the floor
SPLIT = 3.4  # beat the bottom line's halves start to slide apart
SAG = 4.2  # beat the yin halves above start to sag into their gaps
FALL = 5.0  # beat the stack is let go
AMBER_AT = 6.6  # beat the yang line turns amber


def parse():
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--lines", required=True, help="six lines, bottom first, 1 = yang")
    p.add_argument("--pixel", help="unused; scripts/lesson3d.mjs passes it to every scene")
    p.add_argument("--edge", default="#6cff7a")
    p.add_argument("--bpm", type=float, required=True)
    p.add_argument("--beats", type=float, required=True)
    p.add_argument("--out", required=True)
    p.add_argument("--still", type=int)
    p.add_argument("--preview", action="store_true")
    return p.parse_args(argv)


def physics(o, kind="ACTIVE"):
    bpy.context.view_layer.objects.active = o
    o.select_set(True)
    bpy.ops.rigidbody.object_add(type=kind)
    o.select_set(False)
    rb = o.rigid_body
    rb.collision_shape = "BOX"
    rb.friction = 0.35
    rb.restitution = 0.05
    rb.collision_margin = 0.01
    return rb


def let_go(o, f):
    """Animated (kinematic) until clip frame f, then Blender's physics has it."""
    o.rigid_body.kinematic = True
    o.keyframe_insert("rigid_body.kinematic", frame=f)
    o.rigid_body.kinematic = False
    o.keyframe_insert("rigid_body.kinematic", frame=f + 1)


def pull(scene, f, beat):
    """At the let-go, a field at the house's middle pulls the pieces in, so it falls in on
    itself rather than straight down; a little turbulence keeps the fall untidy."""
    for name, kind, strength, where in (("pull", "FORCE", -900.0, (0, 0, 0.8)), ("turbulence", "TURBULENCE", 120.0, (0, 0, 2))):
        o = bpy.data.objects.new(name, None)
        o.location = where
        scene.collection.objects.link(o)
        bpy.context.view_layer.objects.active = o
        bpy.ops.object.forcefield_toggle()
        o.field.type = kind
        o.field.shape = "POINT"
        if kind == "TURBULENCE":
            o.field.size = 1.5
        for g, v in ((f - 1, 0.0), (f, strength), (f + round(1.2 * beat), strength), (f + round(1.6 * beat), 0.0)):
            o.field.strength = v
            o.field.keyframe_insert("strength", frame=g + 1)


def camera(scene, frames, beat):
    """In front, a little above and to the left, drifting down and in as the house falls."""
    target = bpy.data.objects.new("target", None)
    scene.collection.objects.link(target)
    data = bpy.data.cameras.new("camera")
    data.lens = 35
    cam = bpy.data.objects.new("camera", data)
    scene.collection.objects.link(cam)
    scene.camera = cam
    track = cam.constraints.new("TRACK_TO")
    track.target, track.track_axis, track.up_axis = target, "TRACK_NEGATIVE_Z", "UP_Y"
    # (clip frame, orbit angle, distance, camera height, target height). The house sits in
    # the upper part of the frame, clear of the sentence typed at the bottom.
    for f, deg, dist, cz, tz in ((0, -18, 17.5, 4.5, 0.6), (round(FALL * beat), -12, 16.5, 4.0, 0.2), (frames - 1, -6, 14.5, 3.4, -1.2)):
        a = math.radians(deg)
        cam.location = (dist * math.sin(a), -dist * math.cos(a), cz)
        key(cam, "location", f)
        target.location = (0, 0, tz)
        key(target, "location", f)


def main():
    args = parse()
    scene = bpy.context.scene
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o)
    frames = frame_count(args.beats, args.bpm)
    beat = 60 * FPS / args.bpm
    at = lambda b: round(b * beat)  # noqa: E731
    rng = random.Random(23)

    world = bpy.data.worlds.new("black")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0
    scene.world = world
    bpy.ops.mesh.primitive_plane_add(size=120, location=(0, 0, 0))
    floor = bpy.context.object
    floor.data.materials.append(wet())
    bpy.ops.rigidbody.world_add()
    rw = scene.rigidbody_world
    rw.point_cache.frame_start, rw.point_cache.frame_end = 1, frames
    rw.substeps_per_frame = 20
    rw.solver_iterations = 30
    rw.time_scale = 1.3  # a touch quicker than life, so it lands inside the lesson
    physics(floor, "PASSIVE")

    black, colour = obsidian(), linear(args.edge)
    yang = None
    for i, x, z, w in slabs(args.lines):
        o, strength = add_slab(i, x, z + BASE, w, black, colour)
        o.location.y = 0
        animate_slab(o, strength, z + BASE, land_frame(i, args.bpm))
        physics(o)
        o.rigid_body.mass = w
        whole = args.lines[i] == "1"
        side = 0 if whole else (1 if x > 0 else -1)
        if i == 0 and not whole:
            # The bed's legs split: the bottom halves slide out from under the house.
            for f, dx in ((at(SPLIT), 0.0), (at(FALL) - 1, 2.6)):
                o.location.x = x + side * dx
                key(o, "location", f)
        elif not whole:
            # The halves above sag inward, their inner ends dropping into the gap, more the higher they are.
            tilt = math.radians((6 + 3 * i) * (0.8 + 0.4 * rng.random()))
            for f, t in ((at(SAG), 0.0), (at(FALL) - 1, tilt)):
                o.rotation_euler.y = side * t  # a positive turn about y lowers the +x end
                key(o, "rotation_euler", f)
        let_go(o, at(FALL) + (0 if not whole else 2))
        if whole:
            yang = strength
        else:
            # A yin half's neon fades as it falls.
            for f, v in ((at(FALL), REST), (at(FALL + 2), REST * 0.08)):
                strength.default_value = v
                strength.keyframe_insert("default_value", frame=f + 1)
    # The yang line, down on the rubble, turns amber and holds.
    if yang is not None:
        node = yang.node
        for f, v, c in ((at(AMBER_AT) - 1, REST, colour), (at(AMBER_AT) + 3, REST * 6, linear(AMBER)), (at(AMBER_AT + 1), REST * 1.6, linear(AMBER))):
            yang.default_value = v
            yang.keyframe_insert("default_value", frame=f + 1)
            for name in ("Emission Color", "Base Color"):
                node.inputs[name].default_value = c
                node.inputs[name].keyframe_insert("default_value", frame=f + 1)

    pull(scene, at(FALL), beat)
    haze(scene)
    # The searchlight swings from behind the house on the left, across it, to the rubble's right.
    searchlight(scene, frames, (7, 9, 16), [(0, (-7, 1, 0)), (at(FALL), (-0.5, 0, 1.5)), (frames - 1, (6, -2, 0))])
    camera(scene, frames, beat)
    bloom(scene)
    streaks(scene)
    render_settings(scene, frames, args.out, args.preview)
    if args.still is not None:
        # The physics has to run from the start to reach the still's frame.
        for f in range(1, args.still + 2):
            scene.frame_set(f)
        scene.render.image_settings.media_type = "IMAGE"
        scene.render.image_settings.file_format = "PNG"
        scene.render.filepath = os.path.abspath(args.out)
        bpy.ops.render.render(write_still=True)
    else:
        bpy.ops.render.render(animation=True)


if __name__ == "__main__":
    main()
